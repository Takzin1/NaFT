#!/usr/bin/env node
/* Offline Japan/Asia CH4 observation replay. Input files never leave this process.
 * SHA-256 matches only the user-supplied manifest; it does not attest a publisher.
 */
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {replayObservationSeries} from './lib/japan-observation-adapters.mjs';

const BASE='research/japan-observation-adapters-2026-10-19/';
const FIXTURES=new Set(['daily','eddy','interval','umol','carbon']);
const USAGE='USAGE: node scripts/replay-japan-observation-adapters.mjs daily|eddy|interval|umol|carbon\n'
 +'   OR: node scripts/replay-japan-observation-adapters.mjs --csv path/to/observation.csv --manifest path/to/manifest.json';

function inputPaths(args){
 if(args.length===1&&FIXTURES.has(args[0]))
  return {csv:BASE+args[0]+'.csv',manifest:BASE+args[0]+'.manifest.json'};
 if(args.length!==4)throw Error(USAGE);
 const parsed=new Map();
 for(let i=0;i<args.length;i+=2){
  const flag=args[i],value=args[i+1];
  if(!['--csv','--manifest'].includes(flag)||parsed.has(flag)||
     typeof value!=='string'||!value.trim()||value.startsWith('--'))
   throw Error(USAGE);
  parsed.set(flag,resolve(value));
 }
 if(!parsed.has('--csv')||!parsed.has('--manifest'))throw Error(USAGE);
 return {csv:parsed.get('--csv'),manifest:parsed.get('--manifest')};
}

function boundedFile(path,limit){
 const stat=statSync(path);
 if(!stat.isFile()||stat.size<1||stat.size>limit)throw Error('OBS_INPUT_FILE_SIZE_OR_TYPE');
 const bytes=readFileSync(path);
 if(bytes.length<1||bytes.length>limit)throw Error('OBS_INPUT_FILE_SIZE_OR_TYPE');
 return bytes;
}

try {
 const {csv,manifest}=inputPaths(process.argv.slice(2));
 // Limits match the replay engine. Manifests are metadata, not arbitrary raw blobs.
 const manifestBytes=boundedFile(manifest,50000);
 const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(manifestBytes));
 const result=replayObservationSeries(boundedFile(csv,2000000),parsed);
 console.log(JSON.stringify(result,null,2));
} catch(error){
 console.error('OBSERVATION_REPLAY_BLOCKED:'+error.message);
 process.exitCode=1;
}
