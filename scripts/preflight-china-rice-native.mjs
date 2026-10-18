#!/usr/bin/env node
/* Offline-only preflight; no raw source redistribution or derived emissions. */
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {preflightChinaNativeCsv,nativeSourceContracts} from './lib/china-rice-native-preflight.mjs';

const HELP='USAGE: node scripts/preflight-china-rice-native.mjs --csv <local original CSV> --source <CN_2023_DAILY_CARBON|CN_2023_HOURLY_MOLECULAR> --data-class <SYNTHETIC|USER_SUPPLIED_UNVERIFIED>';
try{
 const args=process.argv.slice(2);
 if(args.length!==6)throw Error(HELP);
 const fields=new Map();
 for(let i=0;i<args.length;i+=2){
  if(!['--csv','--source','--data-class'].includes(args[i])||
     fields.has(args[i])||!args[i+1]||args[i+1].startsWith('--'))
   throw Error(HELP);
  fields.set(args[i],args[i+1]);
 }
 if(fields.size!==3)throw Error(HELP);
 const source=fields.get('--source'),contract=nativeSourceContracts[source];
 if(!contract)throw Error('NATIVE_SOURCE_UNREGISTERED');
 const name=resolve(fields.get('--csv'));
 const stat=statSync(name);
 const maxBytes=source==='CN_2023_HOURLY_MOLECULAR'?14000000:2000000;
 if(!stat.isFile()||stat.size<1||stat.size>maxBytes)
  throw Error('NATIVE_SOURCE_BYTES_SIZE_INVALID');
 const bytes=readFileSync(name);
 if(bytes.length<1||bytes.length>maxBytes)
  throw Error('NATIVE_SOURCE_BYTES_SIZE_INVALID');
 const report=preflightChinaNativeCsv(bytes,{
   source_id:source,data_class:fields.get('--data-class')
 });
 process.stdout.write(JSON.stringify(report,null,2)+'\n');
}catch(error){
 process.stderr.write('NATIVE_PREFLIGHT_BLOCKED:'+error.message+'\n');
 process.exitCode=1;
}
