#!/usr/bin/env node
/* P80 · Re-verification worklist from claims + a methodology version change (local, no network).
 * node scripts/naft-worklist.mjs --registry ag005-text|forest --claims claims.json --from KEY --to KEY --out-csv /private/w.csv [--out-json /private/w.json] */
import vm from 'node:vm';
import {outsideRepo,readJson,writePrivate,parseArgs,compilerContext,fail} from './lib/private-paths.mjs';
const P='P80_WORKLIST_CLI_BLOCKED';
const REGISTRIES={'ag005-text':['AG005_TEXT_REGISTRY','AG005_TEXT_CLAUSES'],'forest':['FOREST_REGISTRY',null]};
export async function main(argv){
 const o=parseArgs(argv,['registry','claims','from','to','out-csv','out-json'],P);
 if(!REGISTRIES[o.registry])fail(P,'REGISTRY');
 if(!o['out-csv']&&!o['out-json'])fail(P,'OUTPUT_REQUIRED');
 const csvOut=o['out-csv']?outsideRepo(o['out-csv'],'OUT_CSV',P):null,jsonOut=o['out-json']?outsideRepo(o['out-json'],'OUT_JSON',P):null;
 const claims=readJson(o.claims,'CLAIMS',P,256*1024*1024);if(!Array.isArray(claims)||!claims.length)fail(P,'CLAIMS_ARRAY');
 const ctx=compilerContext(),[reg,clauses]=REGISTRIES[o.registry];
 if(!vm.runInContext(reg,ctx)[o.from]||!vm.runInContext(reg,ctx)[o.to])fail(P,'UNKNOWN_PACK_KEY');
 ctx.__claims=claims;ctx.__change={type:'methodology',old_key:o.from,new_key:o.to};
 const w=JSON.parse(vm.runInContext(`JSON.stringify(reverificationWorklist(__claims,__change,${reg},${clauses||'null'}))`,ctx));
 if(csvOut){ctx.__w=w;writePrivate(csvOut,vm.runInContext('worklistCsv(__w)',ctx));}
 if(jsonOut)writePrivate(jsonOut,JSON.stringify(w,null,1)+'\n');
 return {schema:w.schema,change:w.change,counts:w.counts,blocking_configuration:w.blocking_configuration,formal_certification:false};
}
if(import.meta.url===`file://${process.argv[1]}`)main(process.argv.slice(2)).then(r=>console.log(JSON.stringify(r,null,1)),e=>{console.error(e.message);process.exitCode=2;});
