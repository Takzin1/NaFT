#!/usr/bin/env node
'use strict';

const fs=require('fs');
const vm=require('vm');

function die(message){console.error('CLIMATECHAIN_TESTNET_VERIFY_FAIL: '+message);process.exit(1);}
function ok(label,detail){console.log('ok: '+label+(detail?' ['+detail+']':''));}
function strip0x(value){return String(value||'').replace(/^0x/i,'').toLowerCase();}

const rpc=process.env.RPC_URL;
if(!rpc) die('RPC_URL is required');

const recordSource=fs.readFileSync('src/climatechain-testnet-record.js','utf8');
const recordSandbox={Set,console};
vm.createContext(recordSandbox);
vm.runInContext(recordSource,recordSandbox,{filename:'src/climatechain-testnet-record.js'});
const record=process.env.TESTNET_RECORD_JSON
  ? JSON.parse(process.env.TESTNET_RECORD_JSON)
  : recordSandbox.climateChainTestnetRecord();

if(record.status!=='VERIFIED_TESTNET') die('record status must be VERIFIED_TESTNET');
try{recordSandbox.validateClimateChainTestnetRecord(record);}catch(e){die(e.message);}

const planContext={
  console,
  TextEncoder,
  TextDecoder,
  crypto:globalThis.crypto,
  setTimeout,
  clearTimeout
};
vm.createContext(planContext);
for(const file of [
  'src/mrv-core.js',
  'src/methodology-packs.js',
  'src/mrv-compiler.js',
  'src/compiler-demo.js',
  'src/climatechain-testnet-record.js',
  'src/climatechain-demo.js'
]){
  vm.runInContext(fs.readFileSync(file,'utf8'),planContext,{filename:file});
}
const plan=vm.runInContext('buildClimateChainAnchorPlan(runClimateChainImpact())',planContext);

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

function expectedAnchorPayload(entry){
  return [
    entry.claim_id_hash,
    entry.package_hash,
    entry.methodology_hash,
    entry.previous_package_hash
  ].map(strip0x).join('');
}

function assertAnchorCalldata(tx,label,entry){
  const input=strip0x(tx.input);
  if(input.length!==8+(64*4)) die(label+' calldata length mismatch');
  const args=input.slice(8);
  const expected=expectedAnchorPayload(entry);
  if(args!==expected) die(label+' calldata arguments do not match deterministic NaFT anchor plan');
  ok(label+' calldata matches NaFT plan');
}

function assertAnchorEvent(receipt,label,entry){
  const expected=[
    strip0x(entry.claim_id_hash),
    strip0x(entry.package_hash),
    strip0x(entry.previous_package_hash)
  ];
  const logs=Array.isArray(receipt.logs)?receipt.logs:[];
  const match=logs.some(log=>{
    if(!sameAddress(log.address,record.contract_address)) return false;
    const topics=Array.isArray(log.topics)?log.topics:[];
    return topics.length>=4 &&
      strip0x(topics[1])===expected[0] &&
      strip0x(topics[2])===expected[1] &&
      strip0x(topics[3])===expected[2];
  });
  if(!match) die(label+' MRVPackageAnchored indexed topics do not match NaFT plan');
  ok(label+' event topics match NaFT plan');
}

(async()=>{
  const chainId=hexInt(await rpcCall('eth_chainId',[]));
  if(chainId!==record.chain_id) die('chain id mismatch expected '+record.chain_id+' got '+chainId);
  ok('chain id matches',String(chainId));

  const code=await rpcCall('eth_getCode',[record.contract_address,'latest']);
  if(typeof code!=='string'||code==='0x'||code==='0x0') die('no contract bytecode at '+record.contract_address);
  ok('contract bytecode exists',record.contract_address);

  const deployTx=await rpcCall('eth_getTransactionByHash',[record.deploy_tx_hash]);
  if(!deployTx) die('deploy transaction not found');
  const deployReceipt=await rpcCall('eth_getTransactionReceipt',[record.deploy_tx_hash]);
  if(!deployReceipt||deployReceipt.status!=='0x1') die('deployment transaction not confirmed');
  if(!sameAddress(deployReceipt.contractAddress,record.contract_address)) die('deployment contract address mismatch');
  ok('deploy transaction confirmed',record.deploy_tx_hash);

  for(const [label,hash,entry] of [
    ['genesis',record.genesis_tx_hash,plan.genesis],
    ['successor',record.successor_tx_hash,plan.successor]
  ]){
    const tx=await rpcCall('eth_getTransactionByHash',[hash]);
    if(!tx) die(label+' transaction not found');
    const receipt=await rpcCall('eth_getTransactionReceipt',[hash]);
    if(!receipt) die(label+' receipt not found');
    if(receipt.status!=='0x1') die(label+' transaction reverted');
    if(!sameAddress(tx.to,record.contract_address)) die(label+' transaction target mismatch');
    assertAnchorCalldata(tx,label,entry);
    assertAnchorEvent(receipt,label,entry);
    ok(label+' transaction confirmed',hash);
  }

  if(strip0x(plan.successor.previous_package_hash)!==strip0x(plan.genesis.package_hash)) {
    die('deterministic plan lineage mismatch');
  }
  ok('successor points to genesis package');

  console.log(JSON.stringify({
    status:'VERIFIED_TESTNET_RPC',
    network:record.network,
    chain_id:record.chain_id,
    contract_address:record.contract_address,
    claim_id:plan.claim_id,
    genesis_package_hash:plan.genesis.package_hash,
    successor_package_hash:plan.successor.package_hash,
    deploy_tx_hash:record.deploy_tx_hash,
    genesis_tx_hash:record.genesis_tx_hash,
    successor_tx_hash:record.successor_tx_hash
  },null,2));
})().catch(e=>die(e&&e.stack?e.stack:String(e)));
