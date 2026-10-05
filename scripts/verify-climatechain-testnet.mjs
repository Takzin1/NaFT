#!/usr/bin/env node
'use strict';

const fs=require('fs');
const vm=require('vm');

function die(message){console.error('CLIMATECHAIN_TESTNET_VERIFY_FAIL: '+message);process.exit(1);}
function ok(label,detail){console.log('ok: '+label+(detail?' ['+detail+']':''));}

const rpc=process.env.RPC_URL;
if(!rpc) die('RPC_URL is required');

const recordSource=fs.readFileSync('src/climatechain-testnet-record.js','utf8');
const sandbox={Set,console};
vm.createContext(sandbox);
vm.runInContext(recordSource,sandbox,{filename:'src/climatechain-testnet-record.js'});
const record=sandbox.climateChainTestnetRecord();

if(record.status!=='VERIFIED_TESTNET') die('record status must be VERIFIED_TESTNET');
try{sandbox.validateClimateChainTestnetRecord(record);}catch(e){die(e.message);}

let id=0;
async function rpcCall(method,params){
  const res=await fetch(rpc,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})
  });
  if(!res.ok) die(method+' HTTP '+res.status);
  const body=await res.json();
  if(body.error) die(method+' '+JSON.stringify(body.error));
  return body.result;
}

function hexInt(value){
  if(typeof value!=='string'||!/^0x[0-9a-f]+$/i.test(value)) die('invalid hex integer '+value);
  return Number(BigInt(value));
}

function sameAddress(a,b){return String(a||'').toLowerCase()===String(b||'').toLowerCase();}

(async()=>{
  const chainId=hexInt(await rpcCall('eth_chainId',[]));
  if(chainId!==record.chain_id) die('chain id mismatch expected '+record.chain_id+' got '+chainId);
  ok('chain id matches',String(chainId));

  const code=await rpcCall('eth_getCode',[record.contract_address,'latest']);
  if(typeof code!=='string'||code==='0x'||code==='0x0') die('no contract bytecode at '+record.contract_address);
  ok('contract bytecode exists',record.contract_address);

  const txs=[
    ['deploy',record.deploy_tx_hash],
    ['genesis',record.genesis_tx_hash],
    ['successor',record.successor_tx_hash]
  ];

  for(const [label,hash] of txs){
    const tx=await rpcCall('eth_getTransactionByHash',[hash]);
    if(!tx) die(label+' transaction not found');
    const receipt=await rpcCall('eth_getTransactionReceipt',[hash]);
    if(!receipt) die(label+' receipt not found');
    if(receipt.status!=='0x1') die(label+' transaction reverted');
    if(label==='deploy'){
      if(!sameAddress(receipt.contractAddress,record.contract_address)) {
        die('deployment contract address mismatch');
      }
    } else {
      if(!sameAddress(tx.to,record.contract_address)) die(label+' transaction target mismatch');
      const logs=Array.isArray(receipt.logs)?receipt.logs:[];
      if(!logs.some(x=>sameAddress(x.address,record.contract_address))) {
        die(label+' receipt has no log emitted by anchor contract');
      }
    }
    ok(label+' transaction confirmed',hash);
  }

  console.log(JSON.stringify({
    status:'VERIFIED_TESTNET_RPC',
    network:record.network,
    chain_id:record.chain_id,
    contract_address:record.contract_address,
    deploy_tx_hash:record.deploy_tx_hash,
    genesis_tx_hash:record.genesis_tx_hash,
    successor_tx_hash:record.successor_tx_hash
  },null,2));
})().catch(e=>die(e&&e.stack?e.stack:String(e)));
