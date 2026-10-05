#!/usr/bin/env node
'use strict';

const fs=require('fs');
const vm=require('vm');
const http=require('http');
const {spawn}=require('child_process');
const assert=require('assert/strict');

function strip0x(v){return String(v).replace(/^0x/,'');}

const ctx={
  console,
  TextEncoder,
  TextDecoder,
  crypto:globalThis.crypto,
  setTimeout,
  clearTimeout
};
vm.createContext(ctx);
for(const file of [
  'src/mrv-core.js',
  'src/methodology-packs.js',
  'src/mrv-compiler.js',
  'src/compiler-demo.js',
  'src/climatechain-testnet-record.js',
  'src/climatechain-demo.js'
]){
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const plan=vm.runInContext('buildClimateChainAnchorPlan(runClimateChainImpact())',ctx);

const contract='0x'+'1'.repeat(40);
const deployHash='0x'+'1'.repeat(64);
const genesisHash='0x'+'2'.repeat(64);
const successorHash='0x'+'3'.repeat(64);
const record={
  schema:'naft-climatechain-testnet-record-1',
  status:'VERIFIED_TESTNET',
  network:'Mock Sepolia-compatible testnet',
  chain_id:11155111,
  contract_address:contract,
  deploy_tx_hash:deployHash,
  genesis_tx_hash:genesisHash,
  successor_tx_hash:successorHash,
  explorer_base_url:'https://example.test',
  source_commit:'a'.repeat(40),
  compiler:'solc 0.8.24',
  verified_at:'2026-10-06T00:00:00Z',
  boundary:'test fixture'
};

function calldata(entry){
  return '0xdeadbeef'+[
    entry.claim_id_hash,
    entry.package_hash,
    entry.methodology_hash,
    entry.previous_package_hash
  ].map(strip0x).join('');
}

let corruptSuccessor=false;
function txFor(hash){
  if(hash===deployHash) return {hash,to:null,input:'0x6000'};
  if(hash===genesisHash) return {hash,to:contract,input:calldata(plan.genesis)};
  if(hash===successorHash){
    let input=calldata(plan.successor);
    if(corruptSuccessor) input=input.slice(0,-1)+(input.endsWith('0')?'1':'0');
    return {hash,to:contract,input};
  }
  return null;
}

function receiptFor(hash){
  if(hash===deployHash) return {status:'0x1',contractAddress:contract,logs:[]};
  const entry=hash===genesisHash?plan.genesis:hash===successorHash?plan.successor:null;
  if(!entry) return null;
  return {
    status:'0x1',
    contractAddress:null,
    logs:[{
      address:contract,
      topics:[
        '0x'+'9'.repeat(64),
        entry.claim_id_hash,
        entry.package_hash,
        entry.previous_package_hash
      ],
      data:'0x'
    }]
  };
}

function rpcResult(method,params){
  if(method==='eth_chainId') return '0xaa36a7';
  if(method==='eth_getCode') return '0x6001600055';
  if(method==='eth_getTransactionByHash') return txFor(params[0]);
  if(method==='eth_getTransactionReceipt') return receiptFor(params[0]);
  throw new Error('unexpected RPC method '+method);
}

function runVerifier(url){
  return new Promise((resolve)=>{
    const child=spawn(process.execPath,['scripts/verify-climatechain-testnet.mjs'],{
      env:{...process.env,RPC_URL:url,TESTNET_RECORD_JSON:JSON.stringify(record)},
      stdio:['ignore','pipe','pipe']
    });
    let stdout='',stderr='';
    child.stdout.on('data',d=>stdout+=d);
    child.stderr.on('data',d=>stderr+=d);
    child.on('close',code=>resolve({code,stdout,stderr}));
  });
}

(async()=>{
  const server=http.createServer((req,res)=>{
    let body='';
    req.on('data',d=>body+=d);
    req.on('end',()=>{
      try{
        const input=JSON.parse(body);
        const result=rpcResult(input.method,input.params||[]);
        res.writeHead(200,{'content-type':'application/json'});
        res.end(JSON.stringify({jsonrpc:'2.0',id:input.id,result}));
      }catch(e){
        res.writeHead(200,{'content-type':'application/json'});
        res.end(JSON.stringify({jsonrpc:'2.0',id:null,error:{code:-32000,message:e.message}}));
      }
    });
  });

  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  const url='http://127.0.0.1:'+address.port;

  try{
    const good=await runVerifier(url);
    assert.equal(good.code,0,good.stderr);
    assert.match(good.stdout,/VERIFIED_TESTNET_RPC/);
    assert.match(good.stdout,/successor calldata matches NaFT plan/);

    corruptSuccessor=true;
    const bad=await runVerifier(url);
    assert.notEqual(bad.code,0);
    assert.match(bad.stderr,/successor calldata arguments do not match deterministic NaFT anchor plan/);

    console.log('CLIMATECHAIN RPC VERIFIER: PASS');
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exit(1);});
