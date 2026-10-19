#!/usr/bin/env node
/* Source manifest audit CLI — no original measurements, credentials, clock or network.
 * JSON and Markdown share the exact same evidence and integrity digest.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {buildResearchReadinessReport,renderResearchReadinessMarkdown} from './lib/research-readiness-report.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
function localJson(path){
 return JSON.parse(readFileSync(resolve(root,path),'utf8'));
}
function run(args){
 if(args.includes('--help')){
  if(args.length!==1)throw Error('READINESS_INVALID_ARGUMENTS');
  process.stdout.write('Usage: node scripts/report-research-readiness.mjs [--format json|markdown] [--verify <sha256>]\n');
  return;
 }
 let format='json',digest=null;
 for(let i=0;i<args.length;i++){
  if(args[i]==='--format'&&i+1<args.length){format=args[++i];continue;}
  if(args[i]==='--verify'&&i+1<args.length){digest=args[++i];continue;}
  throw Error('READINESS_INVALID_ARGUMENTS');
 }
 if(!['json','markdown'].includes(format))throw Error('READINESS_UNSUPPORTED_FORMAT');
 if(digest!==null&&!/^[0-9a-f]{64}$/.test(digest))throw Error('READINESS_INVALID_DIGEST');
 const report=buildResearchReadinessReport({
  coverage:localJson('research/japanflux-jp-hrt-v200/selected-native-source-coverage.json'),
  badm:localJson('research/japanflux-jp-hrt-v200/badm-concordance-2026-10-19.json'),
  thesis:localJson('research/japanflux-jp-hrt-v200/komiya-thesis-study-to-published-lineage.json'),
  tellus:localJson('research/japanflux-jp-hrt-v200/tellus-ueyama-2012-ec-options-reference.json'),
  rice:localJson('research/rice-mrv-2026-10-19/standards-and-training-source-manifest.json')
 });
 if(digest!==null&&report.content_sha256!==digest)throw Error('READINESS_DIGEST_MISMATCH');
 process.stdout.write(format==='json'?JSON.stringify(report,null,2)+'\n':
  renderResearchReadinessMarkdown(report));
}
try{run(process.argv.slice(2));}
catch(e){process.stderr.write('NAFT_RESEARCH_READINESS_BLOCKED: '+e.message+'\n');process.exitCode=1;}
