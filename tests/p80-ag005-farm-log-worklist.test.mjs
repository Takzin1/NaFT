import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,mkdtempSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';
import * as L from '../scripts/lib/ag005-farm-log.mjs';
import {main as claimsCli} from '../scripts/ag005-claims-cli.mjs';
import {main as worklistCli} from '../scripts/naft-worklist.mjs';

const PROFILE=JSON.parse(readFileSync('config/ag005-farm-log-profiles/synthetic-v1.json','utf8'));
const PROGRAM=JSON.parse(readFileSync('fixtures/p80-ag005-program-synthetic.json','utf8'));
const LOG=readFileSync('fixtures/p80-ag005-farm-log-synthetic.csv','utf8');
const blocked=(fn,code)=>assert.throws(fn,e=>e.message.includes(code),code);
const c={TextEncoder,TextDecoder,Uint8Array,console};vm.createContext(c);
for(const f of ['src/mrv-core.js','src/methodology-packs.js','src/mrv-compiler.js','src/forest-packs.js','src/ag005-text-packs.js','src/reverification-worklist.js'])vm.runInContext(readFileSync(f,'utf8'),c,{filename:f});
const plain=x=>JSON.parse(JSON.stringify(x));

test('中干し日数: inclusive count, heading ends the period the day before, heading first is invalid',()=>{
 assert.deepEqual(L.drainageDays({drain_start:'2025-06-18',drain_end:'2025-07-10',heading_date:'2025-08-03'}),{days:23,effective_end:'2025-07-10',ended_by_heading:false});
 assert.deepEqual(L.drainageDays({drain_start:'2025-07-01',drain_end:'2025-07-30',heading_date:'2025-07-20'}),{days:19,effective_end:'2025-07-19',ended_by_heading:true});
 assert.equal(L.drainageDays({drain_start:'2025-07-01',drain_end:'2025-07-01',heading_date:'2025-07-10'}).days,1);
 blocked(()=>L.drainageDays({drain_start:'2025-07-10',drain_end:'2025-07-20',heading_date:'2025-07-10'}),'HEADING_NOT_AFTER_DRAINAGE_START');
 blocked(()=>L.drainageDays({drain_start:'2025-07-10',drain_end:'2025-07-09',heading_date:'2025-08-01'}),'DRAIN_END_BEFORE_START');
 blocked(()=>L.drainageDays({drain_start:'2025-02-30',drain_end:'2025-03-09',heading_date:'2025-08-01'}),'DRAIN_START');
});

test('排水性 and 施用有機物 routing follow the text thresholds',()=>{
 assert.equal(L.drainageClass('MEASURED',6.0).class,'POOR_DRAINAGE');             // 7.32
 assert.equal(L.drainageClass('MEASURED',6.15).class,'DAILY_DRAINAGE');           // 7.503
 assert.equal(L.drainageClass('MEASURED',10.2).class,'DAILY_DRAINAGE');           // 12.444
 assert.equal(L.drainageClass('MEASURED',10.25).class,'FOUR_HOUR_DRAINAGE');      // 12.505
 assert.equal(L.drainageClass('DEFAULT',null).class,'DEFAULT_LOWEST_FACTOR_CLASS');
 blocked(()=>L.drainageClass('MEASURED',null),'PERCOLATION_REQUIRED_FOR_MEASURED');
 assert.deepEqual([[100,0],[89,0],[0,1],[0,0.9],[95,1.5],[50,0.5],[100,0.5],[0,0]].map(([s,x])=>L.organicMatterRoute(s,x)),
  ['STRAW_FACTOR','FORMULA_5','COMPOST_FACTOR','FORMULA_6','BOTH_FULL_USE_HIGHER_FACTOR','FORMULA_7_CAPPED','FORMULA_7_CAPPED','NO_APPLICATION_FACTOR']);
});

test('baseline: most recent ≥2 consecutive years, Σdays/Σcycles rounded up, gaps held back per field',()=>{
 const rows=L.parseFarmLog(LOG,PROFILE);
 assert.deepEqual(L.baselineFor(rows,'P-A',2025),{years:[2023,2024],cycles:2,total_days:29,average_days_ceil:15});
 assert.deepEqual(L.baselineFor(rows,'P-C',2025),{years:[2023,2024],cycles:3,total_days:36,average_days_ceil:12});
 blocked(()=>L.baselineFor(rows,'P-E',2025),'BASELINE_YEARS_NOT_CONSECUTIVE');
 blocked(()=>L.baselineFor(rows,'P-A',2024),'BASELINE_FEWER_THAN_TWO_YEARS');
 blocked(()=>L.baselineFor(rows,'P-A',2027),'BASELINE_NOT_MOST_RECENT');
 const r=L.buildAg005Claims(rows,PROGRAM,[]);
 assert.deepEqual(r.report.map(x=>[x.field_ref,x.extension_days]),[['P-A',8],['P-B',8],['P-C',7],['P-D',5]]);
 assert.deepEqual(r.errors.map(e=>e.field_ref),['P-E']);
 assert.equal(r.claims.find(x=>x.field.id==='P-C').activity.land_consolidation,true);
});

test('farm-log guards: personal columns, unmapped values, duplicates and malformed rows stop the import',()=>{
 blocked(()=>L.parseFarmLog(LOG.replace('換地等','換地等,氏名').replace(/\n(?=P-)/g,'\n').split('\n').map((l,i)=>i===0||!l?l:l+',X').join('\n'),PROFILE),'PERSONAL_DATA_COLUMNS_PRESENT');
 blocked(()=>L.parseFarmLog(LOG.replace('2025,1,2025-06-18,2025-07-10,2025-08-03,0.42,100,0,デフォルト','2025,1,2025-06-18,2025-07-10,2025-08-03,0.42,100,0,不明'),PROFILE),'DRAINAGE_BASIS_UNMAPPED');
 blocked(()=>L.parseFarmLog(LOG+'P-A,2025,1,2025-06-18,2025-07-10,2025-08-03,0.42,100,0,デフォルト,,\n',PROFILE),'DUPLICATE_FIELD_YEAR_CYCLE');
 blocked(()=>L.parseFarmLog(LOG.replace('0.42,100,0,デフォルト,,\nP-A,2024','0.42,150,0,デフォルト,,\nP-A,2024'),PROFILE),'STRAW');
 blocked(()=>L.validateFarmLogProfile({...PROFILE,source:{...PROFILE.source,personal_info_removed:false}}),'PROFILE_SOURCE_TERMS');
});

test('farm-log claims compile under both AG-005 text Packs; the extension rule bites only where the text says',()=>{
 const rows=L.parseFarmLog(LOG,PROFILE),{claims}=L.buildAg005Claims(rows,PROGRAM,[]);
 const pack=c.AG005_TEXT_REGISTRY['AG-005@3.3-pc-draft-text'];
 for(const cl of claims){
  assert.equal(c.preflightClaim(cl,pack).status,'READY');
  const e=c.compileEvidence(cl,pack).document;
  assert.equal(e.evaluation.status,'UNSUPPORTED');assert.equal(e.calculation.result,null);
  const ext=e.evaluation.rules.find(r=>r.id==='extension');
  assert.equal(ext.pass,cl.activity.extension_days>=7,cl.activity.id);
  // farm log evidences the records it contains; field photos etc. are still required.
  assert.ok(!e.evaluation.missing_evidence.includes('project_drainage_dates'));
  assert.ok(e.evaluation.missing_evidence.includes('drainage_start_end_proof'));
 }
});

test('worklist: per-claim tasks with clauses, config blockers reported once, CSV safe for spreadsheets',()=>{
 const claims=[];for(let i=1;i<=48;i++)claims.push(c.ag005PaddyClaim(c.ag005SyntheticPaddy(i),'3.1-pc-text'));
 const w=plain(c.reverificationWorklist(claims,{type:'methodology',old_key:'AG-005@3.1-pc-text',new_key:'AG-005@3.3-pc-draft-text'},c.AG005_TEXT_REGISTRY,c.AG005_TEXT_CLAUSES));
 assert.ok(w.blocking_configuration.includes('official_configuration'));
 assert.ok(w.items.every(i=>i.tasks.every(t=>!/^(official_configuration|effective_period|calculation_configuration)$/.test(t.code))));
 // Parity with the P79 triage: claims with new demands ⇔ ACTION_NEW_FROM_CHANGE.
 const demo=plain(c.ag005RevisionDemo());
 for(const row of demo.rows){
  const item=w.items.find(i=>i.claim_id===row.claim_id);
  assert.equal(item.outcome==='ACTION_NEW_FROM_CHANGE',row.new_issues.length>0,row.claim_id);
  assert.deepEqual(item.tasks.filter(t=>t.new_from_change).map(t=>t.code).sort(),row.new_issues,row.claim_id);
 }
 const t=w.items.flatMap(i=>i.tasks).find(t=>t.code==='missing_evidence:percolation_record_proof');
 assert.equal(t.action,'ADD_EVIDENCE');assert.ok(t.clause.includes('Ver.3.3追加'));
 const r=w.items.flatMap(i=>i.tasks).find(t=>t.code==='rule:certification_start_not_before_extension');
 assert.equal(r.action,'CORRECT_RECORD_OR_INPUT');assert.ok(r.value<r.threshold);
 // CSV: BOM, CRLF, quoting, formula neutralisation.
 assert.equal(c.worklistCsvCell('=HYPERLINK("x")'),'"\'=HYPERLINK(""x"")"');
 assert.equal(c.worklistCsvCell('-1'),'"\'-1"');assert.equal(c.worklistCsvCell(null),'""');
 const csv=c.worklistCsv(w);assert.ok(csv.startsWith('﻿"claim_id"')&&csv.includes('\r\n'));
 assert.equal(csv.trim().split('\r\n').length-2,w.items.reduce((a,i)=>a+Math.max(1,i.tasks.length),0));
 // Forest registry: unaffected stands produce no tasks.
 const fw=plain(c.reverificationWorklist(c.forestSyntheticStands(60).map(s=>c.forestStandClaim(s,'1')),{type:'methodology',old_key:'FOREST-SYNTHETIC@1',new_key:'FOREST-SYNTHETIC@2'},c.FOREST_REGISTRY));
 assert.ok(fw.items.filter(i=>i.outcome==='UNAFFECTED').every(i=>!i.tasks.length));
 assert.equal(fw.counts.require_reverification,24);
 assert.throws(()=>c.reverificationWorklist(claims,{type:'parameter'},c.AG005_TEXT_REGISTRY),/WORKLIST_METHODOLOGY_CHANGE_ONLY/);
});

test('CLIs: farm log → claims → worklist, rechecking evidence bytes and writing only outside the repository',async()=>{
 const W=mkdtempSync(join(tmpdir(),'naft-p80-'));
 writeFileSync(join(W,'proof.jpg'),'ruler photo');
 writeFileSync(join(W,'ev.json'),JSON.stringify([{evidence_id:'EV-B',field_ref:'P-B',year:2025,category:'percolation_record_proof',path:join(W,'proof.jpg')},
  {evidence_id:'EV-GONE',field_ref:'P-A',year:2025,category:'drainage_start_end_proof',path:join(W,'missing.jpg')}]));
 writeFileSync(join(W,'p31.json'),JSON.stringify({...PROGRAM,methodology_version:'3.1-pc-text'}));
 const args=out=>['--log','fixtures/p80-ag005-farm-log-synthetic.csv','--profile','config/ag005-farm-log-profiles/synthetic-v1.json','--program',join(W,'p31.json'),'--evidence',join(W,'ev.json'),'--out',out];
 await assert.rejects(claimsCli(args('./claims.json')),/OUT_CANNOT_BE_INSIDE_REPOSITORY/);
 const r=await claimsCli(args(join(W,'claims.json')));
 assert.equal(r.claims_written,4);assert.deepEqual(r.held_back.map(x=>x.field_ref),['P-E']);
 assert.deepEqual(r.evidence,{listed:2,rechecked:1,missing_files:['EV-GONE']});
 assert.equal(r.tco2e,null);
 await assert.rejects(claimsCli(args(join(W,'claims.json'))),/OUT_EXISTS/);
 const w=await worklistCli(['--registry','ag005-text','--claims',join(W,'claims.json'),'--from','AG-005@3.1-pc-text','--to','AG-005@3.3-pc-draft-text','--out-csv',join(W,'w.csv'),'--out-json',join(W,'w.json')]);
 assert.equal(w.counts.claims,4);assert.equal(w.counts.actions.RECHECK_EVIDENCE_BYTES,1);
 const json=JSON.parse(readFileSync(join(W,'w.json'),'utf8'));
 assert.ok(!json.items.find(i=>i.field_id==='P-B').tasks.some(t=>t.code==='missing_evidence:percolation_record_proof'));
 assert.ok(json.items.find(i=>i.field_id==='P-A').tasks.some(t=>t.code==='missing_evidence:percolation_record_proof')===false);  // P-A is DEFAULT drainage
 await assert.rejects(worklistCli(['--registry','nope','--claims',join(W,'claims.json'),'--from','a','--to','b','--out-csv',join(W,'x.csv')]),/REGISTRY/);
 await assert.rejects(worklistCli(['--registry','ag005-text','--claims',join(W,'claims.json'),'--from','AG-005@9','--to','AG-005@3.3-pc-draft-text','--out-csv',join(W,'y.csv')]),/UNKNOWN_PACK_KEY/);
 assert.ok(!existsSync('claims.json'));
});
