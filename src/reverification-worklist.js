'use strict';
/* P80 · Re-verification worklist: turns analyzeImpact() into concrete per-claim tasks for people.
 * Pure (no clock/network). Works in the browser and in Node vm. Each task names the Pack item and, when a clause
 * map is supplied, the source clause. Configuration-level blockers (REFERENCE Packs, unpinned factors) are reported
 * once for the whole worklist instead of being repeated as per-claim work.
 */
var WORKLIST_CONFIG_ISSUES=/^(official_configuration|effective_period|calculation_configuration|unsupported_conditions:(adoption|complete_translation|current_coefficients|official_requirements)|parameter_configuration:.*)$/;
function worklistRebind(claim,oldPack,newPack){
  var input=canonicalCompilerInput(claim);
  input.activity.methodology_version=newPack.methodology_version;
  input.evidence=input.evidence.map(function(e){return e.methodology_version===oldPack.methodology_version?Object.assign({},e,{methodology_version:newPack.methodology_version}):e;});
  return input;
}
function worklistTask(issue,pack,evaluation,clauses,isNew){
  var code=issue.code,colon=code.indexOf(':'),kind=colon<0?code:code.slice(0,colon),ref=colon<0?'':code.slice(colon+1);
  var clause=function(group,id){var m=clauses&&clauses[group+'.'+id];var item=pack[group]&&pack[group][id];return m||(item&&item.source_section)||null;};
  var t={code:code,status:issue.status,new_from_change:isNew,clause:null,target:ref||null,value:null,threshold:null};
  if(kind==='missing_evidence'){t.action='ADD_EVIDENCE';t.target=pack.evidence_requirements[ref]?pack.evidence_requirements[ref].category:ref;t.clause=clause('evidence_requirements',ref);}
  else if(kind==='rule'){var r=(evaluation.rules||[]).filter(function(x){return x.id===ref;})[0];t.action=r&&!r.supported?'FIX_PACK_RULE':'CORRECT_RECORD_OR_INPUT';t.clause=clause('rules',ref);
    if(r){t.target=r.input+(r.input_ref?' vs '+r.input_ref:'');t.value=r.value;t.threshold=r.threshold;}}
  else if(kind==='content_hash'||kind==='evidence_parse'){t.action='RECHECK_EVIDENCE_BYTES';}
  else if(kind==='contradictory_evidence'){t.action='RESOLVE_CONFLICTING_EVIDENCE';t.clause=clause('evidence_requirements',ref);}
  else if(kind==='exceptions'){t.action=issue.status==='HUMAN_REVIEW_REQUIRED'?'HUMAN_DECISION':'OUT_OF_SCOPE';t.clause=clause('exceptions',ref);}
  else if(kind==='unsupported_conditions'){t.action='OUT_OF_SCOPE';}
  else if(kind==='identity_ambiguity'||kind==='field_identity'){t.action='CONFIRM_IDENTITY';}
  else if(kind==='ambiguous_condition'){t.action='SUPPLY_CONDITION_INPUT';}
  else t.action='REVIEW_ISSUE';
  return t;
}
function reverificationWorklist(claims,change,registry,clauseMaps){
  if(!change||change.type!=='methodology') throw new Error('WORKLIST_METHODOLOGY_CHANGE_ONLY');
  var oldPack=registry[change.old_key],newPack=registry[change.new_key];
  if(!oldPack||!newPack) throw new Error('WORKLIST_UNKNOWN_PACK');
  var impact=analyzeImpact(claims,change,registry),byId=Object.create(null);
  claims.forEach(function(c){byId[c.activity.id]=c;});
  var clauses=clauseMaps&&clauseMaps[change.new_key]||null,config=new Set(),actions=Object.create(null);
  var items=impact.claims.map(function(row){
    var claim=byId[row.claim_id],tasks=[],pre=null;
    if(row.requires_reverification){
      var next=worklistRebind(claim,oldPack,newPack);
      pre=preflightClaim(next,newPack);
      pre.missing_required.forEach(function(p){tasks.push({code:'input:'+p,status:'INPUT_REQUIRED',new_from_change:true,action:'SUPPLY_INPUT',target:p,clause:null,value:null,threshold:null});});
      pre.missing_conditions.forEach(function(p){tasks.push({code:'condition_input:'+p,status:'CONDITION_INPUT_UNCONFIRMED',new_from_change:false,action:'CONFIRM_CONDITION_INPUT',target:p,clause:null,value:null,threshold:null});});
      var before=new Set(compileEvidence(claim,oldPack).document.evaluation.issues.map(function(i){return i.code;}));
      var after=compileEvidence(next,newPack).document.evaluation;
      var hashFailed=new Set(after.outstanding_issues.filter(function(i){return i.code.indexOf('content_hash:')===0;}).map(function(i){return i.code.slice(13);}));
      after.outstanding_issues.forEach(function(i){
        if(WORKLIST_CONFIG_ISSUES.test(i.code)){config.add(i.code);return;}
        if(i.code.indexOf('evidence_parse:')===0&&hashFailed.has(i.code.slice(15))) return;
        tasks.push(worklistTask(i,newPack,after,clauses,!before.has(i.code)));
      });
    }
    tasks.forEach(function(t){actions[t.action]=(actions[t.action]||0)+1;});
    var outcome=!row.requires_reverification?'UNAFFECTED':!tasks.length?'NO_ACTION_AUTO_REEVALUATED':tasks.some(function(t){return t.new_from_change;})?'ACTION_NEW_FROM_CHANGE':'ACTION_PRE_EXISTING_ONLY';
    return {claim_id:row.claim_id,field_id:claim.field.id,requires_reverification:row.requires_reverification,outcome:outcome,reasons:row.reasons,preflight:pre?pre.status:null,tasks:tasks};
  });
  var outcomes=Object.create(null);items.forEach(function(i){outcomes[i.outcome]=(outcomes[i.outcome]||0)+1;});
  return {schema:'naft-reverification-worklist-1',change:{from:change.old_key,to:change.new_key},
    blocking_configuration:Array.from(config).sort(),formal_certification:false,
    counts:{claims:items.length,require_reverification:impact.counts.require_reverification,outcomes:plainCounts(outcomes),actions:plainCounts(actions)},items:items};
}
function plainCounts(m){var o={};Object.keys(m).sort().forEach(function(k){o[k]=m[k];});return o;}
var WORKLIST_ACTION_JA={ADD_EVIDENCE:'証拠を追加',CORRECT_RECORD_OR_INPUT:'記録・入力を是正',FIX_PACK_RULE:'Packのルールを修正',RECHECK_EVIDENCE_BYTES:'証拠ファイルを再照合',
  RESOLVE_CONFLICTING_EVIDENCE:'矛盾する証拠を整理',HUMAN_DECISION:'人が判断',OUT_OF_SCOPE:'対象外（自動判定停止）',CONFIRM_IDENTITY:'圃場・小班の同一性を確認',
  SUPPLY_CONDITION_INPUT:'条件の入力を補う',SUPPLY_INPUT:'必須入力を補う',CONFIRM_CONDITION_INPUT:'例外条件の入力を確認',REVIEW_ISSUE:'内容を確認'};
/* CSV for spreadsheets: UTF-8 BOM, CRLF, quoted cells, and spreadsheet-formula neutralisation (=,+,-,@,tab,CR). */
function worklistCsvCell(v){
  var s=v===null||v===undefined?'':typeof v==='object'?JSON.stringify(v):String(v);
  if(/^[=+\-@\t\r]/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
function worklistCsv(w){
  var head=['claim_id','field_id','結果','作業','対象','条文','変更で新たに発生','現在の値','基準','issue_code'];
  var lines=[head.map(worklistCsvCell).join(',')];
  w.items.forEach(function(i){
    if(!i.tasks.length){lines.push([i.claim_id,i.field_id,i.outcome,'','','','','','',''].map(worklistCsvCell).join(','));return;}
    i.tasks.forEach(function(t){lines.push([i.claim_id,i.field_id,i.outcome,WORKLIST_ACTION_JA[t.action]||t.action,t.target,t.clause,t.new_from_change?'はい':'いいえ',t.value,t.threshold,t.code].map(worklistCsvCell).join(','));});
  });
  lines.push(['#','blocking_configuration',w.blocking_configuration.join(' / '),'formal_certification=false','','','','','',''].map(worklistCsvCell).join(','));
  return '﻿'+lines.join('\r\n')+'\r\n';
}
