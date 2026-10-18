#!/usr/bin/env node
/* Local research-only comparison: no downloads, credit issuance or approval. */
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {reconcileObservationAggregate} from './lib/japan-aggregate-reconciliation.mjs';

const BASE='research/japan-observation-adapters-2026-10-19/';
const SAMPLE='research/japan-aggregate-reconciliation-2026-10-19/synthetic-interval-reference.json';
const USAGE='USAGE: node scripts/reconcile-japan-observation.mjs synthetic-interval\n'
 +' OR: node scripts/reconcile-japan-observation.mjs --csv observations.csv --manifest observation.manifest.json --reference reported-aggregate.json';
function paths(args){
 if(args.length===1&&args[0]==='synthetic-interval')
  return {csv:BASE+'interval.csv',manifest:BASE+'interval.manifest.json',reference:SAMPLE};
 if(args.length!==6)throw Error(USAGE);
 const supplied=new Map();
 for(let i=0;i<6;i+=2){
  if(!['--csv','--manifest','--reference'].includes(args[i])||supplied.has(args[i])||
      !args[i+1]||args[i+1].startsWith('--'))
   throw Error(USAGE);
  supplied.set(args[i],resolve(args[i+1]));
 }
 if(supplied.size!==3)throw Error(USAGE);
 return {csv:supplied.get('--csv'),manifest:supplied.get('--manifest'),reference:supplied.get('--reference')};
}
function localFile(file,limit){
 const stat=statSync(file);
 if(!stat.isFile()||stat.size===0||stat.size>limit)throw Error('RECON_FILE_SIZE_OR_TYPE');
 const bytes=readFileSync(file);
 if(bytes.length===0||bytes.length>limit)throw Error('RECON_FILE_SIZE_OR_TYPE');
 return bytes;
}
function jsonFile(file){
 const bytes=localFile(file,50000);
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
try {
 const files=paths(process.argv.slice(2));
 const manifest=jsonFile(files.manifest),reference=jsonFile(files.reference);
 const result=reconcileObservationAggregate(localFile(files.csv,2000000),manifest,reference);
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
} catch(error){
 process.stderr.write('RECONCILIATION_BLOCKED:'+error.message+'\n');
 process.exitCode=1;
}
