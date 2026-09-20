'use strict';
// Mutable adapter uses the existing store, actor and append-only audit guards.
function compilerCollections() {
  ['compiler_runs','compiler_decisions','compiler_attestations'].forEach(function(k) { if(db[k]===undefined) db[k]=[];if(!Array.isArray(db[k])) throw new Error('INVALID_COMPILER_DATASET'); });
}
function compilerRun(id) {
  compilerCollections();requireAudit();var r=db.compiler_runs.find(function(x) { return x.id===id; });
  if(!r||!sealed(r,'run_hash')||!eventBinds('compiler_run',r.id,{hash:r.run_hash})) throw new Error('COMPILER_RUN_INTEGRITY');
  var u=currentUser();if(!u||u.role!=='reviewer'&&u.id!==r.owner) throw new Error('ROLE_BLOCKED');
  if(!packageCurrent(r.package,r.input,r.pack,{supersedes:r.supersedes||undefined})) throw new Error('COMPILER_RUN_INTEGRITY');return r;
}
function latestCompilerRun(claimId) { compilerCollections();return db.compiler_runs.filter(function(r) { return r.input.activity.id===claimId; }).slice(-1)[0]; }
function currentCompilerRun(id) { var r=compilerRun(id);if(latestCompilerRun(r.input.activity.id).id!==id) throw new Error('STALE_PACKAGE');return r; }
async function saveCompilerRun(input,pack,previous) {
  var u=requireRole('operator');requireAudit();compilerCollections();
  var latest=latestCompilerRun(input.activity.id);if(latest) { compilerRun(latest.id);if(latest.owner!==u.id) throw new Error('ROLE_BLOCKED'); }
  if(previous&&(!latest||latest.package.package_hash!==previous)) throw new Error('STALE_PACKAGE');
  input=canonicalCompilerInput(input);
  var current=db.compiler_runs.filter(function(r) { return latestCompilerRun(r.input.activity.id).id===r.id&&r.input.activity.id!==input.activity.id; });
  input.peers=stableSort((input.peers||[]).concat(current.map(function(r) { return r.input.activity; })).filter(function(p,i,all) { return all.findIndex(function(q) { return q.id===p.id; })===i; }));
  if(current.some(function(r) { return r.input.field.id===input.field.id&&hashObject(r.input.field)!==hashObject(input.field); })) throw new Error('FIELD_IDENTITY_CONFLICT');
  if(current.some(function(r) { var a=r.input.activity,b=input.activity;return a.field_id===b.field_id&&a.methodology_id===b.methodology_id&&a.type===b.type&&a.start<=b.end&&a.end>=b.start; })) throw new Error('DUPLICATE_FIELD_ACTIVITY_BLOCKED');
  var pkg=compileEvidence(input,pack,{supersedes:previous||undefined});
  var r=seal({id:uid('compile'),owner:u.id,input:canonicalCompilerInput(input),pack:clone(pack),package:pkg,supersedes:previous||null},'run_hash');
  db.compiler_runs.push(r);audit('compiler_run',r.id,{hash:r.run_hash});await saveDB();return r;
}
async function compileAndSave(input) {
  var pack=COMPILER_REGISTRY[compilerKey(input.activity)];if(!pack) throw new Error('UNSUPPORTED_METHODOLOGY');
  var previous=latestCompilerRun(input.activity.id);return saveCompilerRun(input,pack,previous?previous.package.package_hash:null);
}
async function approveVersionedPack(key,note) {
  var u=requireRole('maintainer');requireAudit();var pack=COMPILER_REGISTRY[key];if(!pack) throw new Error('UNSUPPORTED_METHODOLOGY');
  if(packRelease(pack)) throw new Error('PACK_ALREADY_RELEASED');
  var r=seal({id:uid('release'),pack_key:key,pack_hash:hashObject(pack),approved_by:u.id,approved_at:nowISO(),note:humanNote(note),scope:'research_only',official_adoption_confirmed:false},'release_hash');
  db.pack_releases.push(r);audit('pack_release',r.id,{hash:r.release_hash});await saveDB();return r;
}
function compilerDecisions(r) {
  var list=db.compiler_decisions.filter(function(x) { return x.run_id===r.id; }).slice().sort(function(a,b) { return a.exception_code<b.exception_code?-1:a.exception_code>b.exception_code?1:0; });
  var seen=new Set(),fingerprint=inputFingerprint(r.input),packHash=hashObject(r.pack);
  list.forEach(function(d) {
    var u=db.users.find(function(x) { return x.id===d.reviewer&&x.role==='reviewer'&&x.status==='active'; });
    var binding={claim_id:d.claim_id,run_id:d.run_id,exception_code:d.exception_code,input_fingerprint:d.input_fingerprint,pack_hash:d.pack_hash,reviewer:d.reviewer,reason:d.reason,decision:d.decision};
    if(!u||d.decision_hash!==hashObject(binding)||!eventBinds('compiler_decision',d.id,{hash:d.decision_hash})) throw new Error('DECISION_INTEGRITY_BLOCKED');
    if(d.claim_id!==r.input.activity.id||d.input_fingerprint!==fingerprint||d.pack_hash!==packHash) throw new Error('STALE_REVIEW');
    if(!['ACCEPT','REJECT','NEED_MORE_EVIDENCE','ABSTAIN'].includes(d.decision)||seen.has(d.exception_code)) throw new Error('DECISION_INTEGRITY_BLOCKED');seen.add(d.exception_code);
    if(!r.package.document.evaluation.issues.some(function(e) { return e.code===d.exception_code&&e.status==='HUMAN_REVIEW_REQUIRED'; })) throw new Error('BLOCKING_EXCEPTION_NOT_OVERRIDABLE');
  });
  return list;
}
async function reviewCompilerRun(id,exceptionCode,decision,reason) {
  requireRole('reviewer');var r=currentCompilerRun(id),issues=r.package.document.evaluation.issues;
  if(!['ACCEPT','REJECT','NEED_MORE_EVIDENCE','ABSTAIN'].includes(decision)) throw new Error('INVALID_HUMAN_DECISION');
  var target=issues.find(function(e) { return e.code===exceptionCode; });
  if(!target||target.status!=='HUMAN_REVIEW_REQUIRED') throw new Error('BLOCKING_EXCEPTION_NOT_OVERRIDABLE');
  if(compilerDecisions(r).some(function(d) { return d.exception_code===exceptionCode; })) throw new Error('EXCEPTION_ALREADY_DECIDED');
  var binding={claim_id:r.input.activity.id,run_id:id,exception_code:exceptionCode,input_fingerprint:inputFingerprint(r.input),pack_hash:hashObject(r.pack),reviewer:actorId,reason:humanNote(reason),decision:decision};
  var d=Object.assign({id:uid('compilerdecision')},binding,{decision_hash:hashObject(binding)});
  db.compiler_decisions.push(d);audit('compiler_decision',d.id,{hash:d.decision_hash});await saveDB();return d;
}
function compilerDraft(id) { var r=currentCompilerRun(id),decisions=compilerDecisions(r);return compileEvidence(r.input,r.pack,{supersedes:r.supersedes||undefined,review:decisions.length?decisions:undefined}); }
async function attestCompilerRun(id,note,ack) {
  requireRole('reviewer');var r=currentCompilerRun(id);if(ack!==true) throw new Error('ATTESTATION_ACKNOWLEDGEMENT_REQUIRED');note=humanNote(note);
  if(!validRelease(r.pack)) throw new Error('PACK_RELEASE_APPROVAL_REQUIRED');
  var decisions=compilerDecisions(r);if(decisions.some(function(d) { return d.decision!=='ACCEPT'; })) throw new Error('UNRESOLVED_EXCEPTIONS');
  var pkg=compilerDraft(id);if(pkg.document.evaluation.status!=='AUTO_REEVALUATED'||pkg.document.evaluation.outstanding_issues.some(function(e) { return e.status==='UNSUPPORTED'||e.status==='EVIDENCE_REQUIRED'||e.status==='HUMAN_REVIEW_REQUIRED'; })) throw new Error('UNRESOLVED_EXCEPTIONS');
  if(db.compiler_attestations.some(function(a) { return a.run_id===id; })) throw new Error('DUPLICATE_ATTESTATION_BLOCKED');
  var document=Object.assign({},pkg.document,{status:'ATTESTED_RESEARCH_PACKAGE',attestation:{reviewer:actorId,note:note,acknowledged:true,scope:'not_formal_certification'}});
  var att=seal({id:uid('compilerattestation'),run_id:id,document:document,package_hash:hashObject(document)},'attestation_hash');
  db.compiler_attestations.push(att);audit('compiler_attested',att.id,{hash:att.attestation_hash});await saveDB();return att;
}
function exportCompilerRun(id,attested) {
  var r=currentCompilerRun(id),pkg=compilerDraft(id);if(!attested) return canonicalize(pkg);
  var att=db.compiler_attestations.find(function(x) { return x.run_id===id; });
  if(!att||!sealed(att,'attestation_hash')||hashObject(att.document)!==att.package_hash||!eventBinds('compiler_attested',att.id,{hash:att.attestation_hash})) throw new Error('ATTESTATION_INTEGRITY_BLOCKED');
  var user=db.users.find(function(u) { return u.id===att.document.attestation.reviewer&&u.role==='reviewer'&&u.status==='active'; });
  var baseline=clone(att.document);delete baseline.attestation;baseline.status='DRAFT';
  if(!user||!validRelease(r.pack)||hashObject(baseline)!==pkg.package_hash) throw new Error('STALE_PACKAGE');
  return canonicalize({package_hash:att.package_hash,document:att.document});
}
async function applyCompilerChange(change) {
  var user=requireRole('operator');requireAudit();compilerCollections();
  var latest=db.compiler_runs.filter(function(r) { return r.owner===user.id&&latestCompilerRun(r.input.activity.id).id===r.id; });latest.forEach(function(r) { currentCompilerRun(r.id); });
  var registry=Object.assign(Object.create(null),COMPILER_REGISTRY);
  latest.forEach(function(r) { var key=compilerKey(r.pack);if(hashObject(registry[key])!==hashObject(r.pack)) throw new Error('PACK_SNAPSHOT_CONFLICT'); });
  var result=analyzeImpact(latest.map(function(r) { return r.input; }),change,registry);
  var planned=result.claims.filter(function(row) { return row.potentially_affected; }).map(function(row) {
    var previous=latest.find(function(r) { return r.input.activity.id===row.claim_id; });
    return seal({id:uid('compile'),owner:user.id,input:row.next_input,pack:row.next_pack,package:compileEvidence(row.next_input,row.next_pack,{supersedes:previous.package.package_hash}),supersedes:previous.package.package_hash},'run_hash');
  });
  // A field revision must update every known claim using that identity, including other Programs.
  if(change.type==='field'&&db.compiler_runs.some(function(r) { return latestCompilerRun(r.input.activity.id).id===r.id&&r.input.field.id===change.field_id&&r.owner!==user.id; })) throw new Error('CROSS_PROGRAM_FIELD_CHANGE_UNSUPPORTED');
  var before=clone(db);
  try {
    planned.forEach(function(r) { db.compiler_runs.push(r);audit('compiler_run',r.id,{hash:r.run_hash}); });
    await saveDB();
  } catch(error) { db=before;throw error; }
  return result;
}
