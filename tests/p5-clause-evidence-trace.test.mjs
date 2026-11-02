import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stableJson} from '../scripts/lib/research-readiness-report.mjs';
import {
 loadP5Graph,checkP5Graph,buildP5ClauseTrace,verifyP5ClauseTrace,renderP5ClauseTraceJa
} from '../scripts/p5-clause-evidence-trace.mjs';

let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
const denied=(fn,re)=>{assert.throws(fn,new RegExp(re));checks++};
const request=JSON.parse(readFileSync('fixtures/p5-gs-soc-clause-trace-request.json','utf8'));
const verraRequest=JSON.parse(readFileSync('fixtures/p5-verra-soc-clause-trace-request.json','utf8'));
const g=loadP5Graph();
eq(checkP5Graph(g),true);
eq(g.source_index.length,4);
eq(g.clauses.length,14);
eq(g.observed_source_conflict.older_general_date,'2026-01-01');
eq(g.observed_source_conflict.current_general_date,'2026-07-01');
eq(g.source_index.find(s=>s.id==='GS_SOC_2025_12_22').listed_applicable_rule_update,true);
eq(g.source_index.find(s=>s.id==='GS_SOC_2025_07_07').listed_applicable_rule_update,false);
eq(g.clauses.some(c=>c.source_id==='GS_SOC_2025_07_07'),false);
eq(g.clauses.some(c=>c.id==='GS.SOC.2.4.1'),true);
eq(g.clauses.some(c=>c.id==='VERRA.VM0051.9.3.1'),true);
eq(g.formal_output_policy.verified_credits_tco2e,null);
const r=buildP5ClauseTrace(request);
eq(r.status,'BLOCKED_FOR_INSTITUTIONAL_METHOD_USE');
eq(r.program,'GS_AWD_SOC');
eq(r.clauses.length,4);
eq(r.evidence.length,10);
eq(r.evidence_missing,8);
eq(r.evidence_submitted_but_unverified,2);
eq(r.evidence.every(e=>e.independently_verified===false),true);
eq(r.evidence.every(e=>e.triggered_by.length>0),true);
eq(r.evidence.find(x=>x.id==='FIELD_MANAGEMENT_LOGS').triggered_by,
 ['GS.SOC.2.3.4','GS.SOC.AWD.25']);
eq(r.temporal_review_signal,'CROSSES_2026_07_01_REQUIRES_REVIEW');
eq(r.observed_outdated_rule_excluded_from_graph,true);
eq(r.actual_original_pdf_clause_text_diff_extracted,false);
eq(r.clause_to_rulepack_dependency_candidate_only,true);
eq(r.complete_rulepack_dependency_coverage_verified,false);
eq(r.independent_qc_passed,false);
eq(r.human_or_vvb_approved,false);
eq(r.field_recalculation_executed,false);
eq(r.production_rule_pack_mutated,false);
eq(r.applicability_decided,false);
eq(r.certified_field_cases_recalculated,0);
eq(r.soc_stock_loss_tco2e,null);
eq(r.officially_certified_tco2e,null);
eq(r.credit_issuance,null);
eq(r.ledger_or_financial_action,false);
eq(r,buildP5ClauseTrace(request));
eq(verifyP5ClauseTrace(request,r).status,'GRAPH_AND_LOCAL_REQUEST_REPLAY_MATCH');
eq(r.clause_graph_sha256,createHash('sha256').update(stableJson(g)).digest('hex'));
const submitted=structuredClone(request);
for(const k of Object.keys(submitted.evidence_status))submitted.evidence_status[k]='PROVIDED_UNVERIFIED';
const all=buildP5ClauseTrace(submitted);
eq(all.evidence_missing,0);eq(all.evidence_submitted_but_unverified,10);
eq(all.independent_qc_passed,false);eq(all.officially_certified_tco2e,null);
const earlier=structuredClone(request);
earlier.monitoring_window={start_date:'2025-12-01',end_date:'2026-06-30',ccp_label_requested:false};
eq(buildP5ClauseTrace(earlier).temporal_review_signal,
 'BEFORE_CURRENT_GENERAL_DATE_BUT_VOLUNTARY_AND_CCP_EXCEPTIONS_REQUIRE_REVIEW');
const later=structuredClone(request);
later.monitoring_window={start_date:'2026-07-01',end_date:'2026-10-01',ccp_label_requested:false};
eq(buildP5ClauseTrace(later).temporal_review_signal,'ON_OR_AFTER_2026_07_01_REQUIRES_REVIEW');
later.monitoring_window.ccp_label_requested=true;
eq(buildP5ClauseTrace(later).temporal_review_signal,
 'CCP_LABEL_PERIOD_REQUIRES_INDEPENDENT_EARLY_DATE_REVIEW');
const vr=buildP5ClauseTrace(verraRequest);
eq(vr.program,'VERRA_VM0051');
eq(vr.evidence.length,3);
eq(vr.evidence_missing,2);
eq(vr.clauses.length,2);
eq(vr.candidate_replay_modules,['VERRA_SAFEGUARD_REVIEW']);
eq(vr.temporal_review_signal,'VERIFY_VM0051_1_1_AND_LEGACY_PROJECT_TRANSITION');
eq(vr.officially_certified_tco2e,null);
const verraLater=structuredClone(verraRequest);
verraLater.monitoring_window.start_date='2027-08-01';
verraLater.monitoring_window.end_date='2027-08-30';
eq(buildP5ClauseTrace(verraLater).temporal_review_signal,
 'VERIFY_VM0051_V10_PHASEOUT_FOR_REGISTRATION_OR_RENEWAL');
const ag={schema:'naft-p5-clause-impact-request-v1',program:'J_CREDIT_AG005',
 changed_clause_ids:['AG005.REFERENCE.EXTENSION'],
 evidence_status:{BASELINE_DRAINING_RECORDS:'MISSING',
  PROJECT_DRAINING_RECORDS:'MISSING',FIELD_IDENTITY:'PROVIDED_UNVERIFIED'},
 monitoring_window:{start_date:'2026-01-01',end_date:'2026-11-02',ccp_label_requested:false}};
const ar=buildP5ClauseTrace(ag);
eq(ar.temporal_review_signal,'AG005_CURRENT_VERSION_NOT_INDEPENDENTLY_PINNED');
eq(ar.officially_certified_tco2e,null);
eq(ar.clauses[0].source_original_bytes_independently_authenticated,false);
const markdown=renderP5ClauseTraceJa(r);
assert.match(markdown,/原典条項→証憑→再検証候補/);checks++;
assert.match(markdown,/CROSSES_2026_07_01/);checks++;
assert.match(markdown,/正式な削減量・認証済みtCO2e：null/);checks++;
denied(()=>renderP5ClauseTraceJa({...r,officially_certified_tco2e:999}),
 'PLAN_HASH_MISMATCH');
denied(()=>verifyP5ClauseTrace(request,{...r,independent_qc_passed:true}),
 'TRACE_REPLAY_MISMATCH');
denied(()=>verifyP5ClauseTrace(submitted,r),'TRACE_REPLAY_MISMATCH');
denied(()=>buildP5ClauseTrace({...request,changed_clause_ids:['GS.SOC.UNKNOWN']}),
 'UNKNOWN_CLAUSE');
denied(()=>buildP5ClauseTrace({...request,changed_clause_ids:
 ['GS.SOC.2.3.4','GS.SOC.2.3.4']}),'CLAUSE_SELECTION');
denied(()=>buildP5ClauseTrace({...request,changed_clause_ids:['VERRA.VM0051.9.3.1']}),
 'CROSS_PROGRAM_CLAUSE');
denied(()=>buildP5ClauseTrace({...request,evidence_status:{...request.evidence_status,UNRELATED:'MISSING'}}),
 'EVIDENCE_STATUS_EXACT_COVERAGE');
denied(()=>buildP5ClauseTrace({...request,evidence_status:{
 ...request.evidence_status,SOC_BASELINE_SAMPLES:'INDEPENDENTLY_VERIFIED'}}),
 'SOURCE_EVIDENCE_CANNOT_SELF_VERIFY');
denied(()=>buildP5ClauseTrace({...request,certified_tco2e:100}),'REQUEST_KEYS');
denied(()=>buildP5ClauseTrace({...request,monitoring_window:{
 ...request.monitoring_window,start_date:'2026-02-30'}}),'MONITORING_WINDOW_INVALID');
denied(()=>buildP5ClauseTrace({...request,monitoring_window:{
 ...request.monitoring_window,end_date:'2026-01-01'}}),'MONITORING_WINDOW_INVALID');
denied(()=>buildP5ClauseTrace({...request,monitoring_window:{
 ...request.monitoring_window,ccp_label_requested:'true'}}),'MONITORING_WINDOW_INVALID');
const mutatedOld=structuredClone(g);
mutatedOld.observed_source_conflict.current_general_date='2026-01-01';
denied(()=>checkP5Graph(mutatedOld),'GOLD_TIMELINE_CONFLICT_NOT_RESOLVED');
const changedOfficial=structuredClone(g);
changedOfficial.source_index.find(s=>s.id==='GS_SOC_2025_12_22').listed_applicable_rule_update=false;
denied(()=>checkP5Graph(changedOfficial),'GOLD_CURRENT_OFFICIAL_INDEX_BOUNDARY');
const addedOldClause=structuredClone(g);
addedOldClause.clauses[0].source_id='GS_SOC_2025_07_07';
denied(()=>checkP5Graph(addedOldClause),'OLDER_GS_RULE_USED_AS_CURRENT_CLAUSE');
const forgedApproval=structuredClone(g);
forgedApproval.formal_output_policy.official_adoption_automatic=true;
denied(()=>checkP5Graph(forgedApproval),'GATE_NOT_FAIL_CLOSED');
const badGraph=structuredClone(g);
badGraph.controlled_evidence_ids.pop();
denied(()=>checkP5Graph(badGraph),'GRAPH_EDGE_INDEX_INCONSISTENT');
const badClause=structuredClone(g);
badClause.clauses[0].fully_translated_rule=true;
denied(()=>checkP5Graph(badClause),'UNSAFE_CLAUSE_CONTENT');
const cli=(...args)=>spawnSync(process.execPath,['scripts/p5-clause-evidence-trace.mjs',...args],
 {encoding:'utf8',timeout:20000,maxBuffer:300000});
const dir=mkdtempSync(join(tmpdir(),'naft-p5-graph-'));
try{
 const req=join(dir,'request.json'),report=join(dir,'trace.json');
 writeFileSync(req,JSON.stringify(request));
 const created=cli('generate',req);eq(created.status,0);
 eq(JSON.parse(created.stdout),r);
 writeFileSync(report,created.stdout);
 const verified=cli('verify',req,report);
 eq(verified.status,0);
 eq(JSON.parse(verified.stdout).plan_sha256,r.plan_sha256);
 const human=cli('markdown',req);
 eq(human.status,0);eq(human.stdout,markdown+'\n');
 writeFileSync(report,JSON.stringify({...r,credit_issuance:123}));
 const forged=cli('verify',req,report);
 eq(forged.status!==0,true);
 eq(forged.stderr.includes('TRACE_REPLAY_MISMATCH'),true);
 const link=join(dir,'symlink.json');symlinkSync(req,link);
 const noLink=cli('generate',link);
 eq(noLink.status!==0,true);
 eq(noLink.stderr.includes('INPUT_FILE'),true);
 const wrong=cli('generate',req,report);
 eq(wrong.status!==0,true);
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('NAFT_P5_CLAUSE_TRACE_PASS: '+checks+
 ' checks; 14 indexed research clauses; Gold Standard current timeline reconciled; zero official claims');
