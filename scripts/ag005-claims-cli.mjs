#!/usr/bin/env node
/* P80 · AG-005 生産管理記録 CSV → Evidence Compiler claims (local, research-only, no tCO2e).
 * node scripts/ag005-claims-cli.mjs --log farm.csv --profile profile.json --program program.json [--evidence manifest.json] --out /private/claims.json
 * evidence manifest: [{"evidence_id","field_ref","year","category","path"}]; bytes are re-read and hashed now. */
import {existsSync,readFileSync,statSync} from 'node:fs';
import vm from 'node:vm';
import {resolve} from 'node:path';
import {decodeRegisterBytes} from './lib/forest-stand-identity.mjs';
import {validateFarmLogProfile,parseFarmLog,buildAg005Claims,sha256} from './lib/ag005-farm-log.mjs';
import {outsideRepo,readJson,writePrivate,parseArgs,compilerContext,fail} from './lib/private-paths.mjs';
const P='P80_AG005_CLI_BLOCKED';
const CATEGORIES=['drainage_start_end_proof','planted_area_record','percolation_measurement_record','no_rain_record','percolation_record_proof','land_consolidation_lot_mapping','activity_report_list_lot_numbers','heading_date_record','organic_matter_record'];
export async function main(argv){
 const o=parseArgs(argv,['log','profile','program','evidence','out'],P);
 for(const k of ['log','profile','program','out'])if(!o[k])fail(P,'MISSING_'+k.toUpperCase());
 const out=outsideRepo(o.out,'OUT',P);
 const profile=validateFarmLogProfile(readJson(o.profile,'PROFILE',P)),program=readJson(o.program,'PROGRAM',P);
 const log=resolve(o.log);if(!existsSync(log)||!statSync(log).isFile()||statSync(log).size>256*1024*1024)fail(P,'LOG_FILE');
 const bytes=readFileSync(log),rows=parseFarmLog(decodeRegisterBytes(bytes,profile.encoding),profile);
 const manifest=o.evidence?readJson(o.evidence,'EVIDENCE',P):[];
 if(!Array.isArray(manifest))fail(P,'EVIDENCE_ARRAY');
 const ids=new Set();
 const evidence=manifest.map(e=>{
  if(!e||!/^[A-Za-z0-9_.:-]{1,80}$/.test(e.evidence_id||'')||ids.has(e.evidence_id))fail(P,'EVIDENCE_ID');ids.add(e.evidence_id);
  if(!CATEGORIES.includes(e.category))fail(P,'EVIDENCE_CATEGORY:'+e.category);
  const f=resolve(e.path||'');const ok=existsSync(f)&&statSync(f).isFile();
  return {evidence_id:e.evidence_id,field_ref:e.field_ref,year:e.year,category:e.category,sha256:ok?sha256(readFileSync(f)):'0'.repeat(64),rechecked:ok};
 });
 const r=buildAg005Claims(rows,program,evidence);
 const ctx=compilerContext(),key='AG-005@'+program.methodology_version;ctx.__claims=r.claims;
 ctx.__key=key;
 const preflight=JSON.parse(vm.runInContext('JSON.stringify(__claims.map(c=>preflightClaim(c,AG005_TEXT_REGISTRY[__key])))',ctx));
 writePrivate(out,JSON.stringify(r.claims,null,1)+'\n');
 return {schema:'naft-p80-ag005-claims-receipt-v1',farm_log_sha256:sha256(bytes),rows:rows.length,claims_written:r.claims.length,held_back:r.errors,
  evidence:{listed:evidence.length,rechecked:evidence.filter(e=>e.rechecked).length,missing_files:evidence.filter(e=>!e.rechecked).map(e=>e.evidence_id)},
  report:r.report,preflight:preflight.map(p=>({claim_id:p.claim_id,status:p.status,missing_required:p.missing_required})),formal_certification:false,tco2e:null};
}
if(import.meta.url===`file://${process.argv[1]}`)main(process.argv.slice(2)).then(r=>console.log(JSON.stringify(r,null,1)),e=>{console.error(e.message);process.exitCode=2;});
