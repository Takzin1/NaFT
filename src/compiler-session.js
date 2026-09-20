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
function compilerDecision(r) {
  var d=db.compiler_decisions.filter(function(x) { return x.run_id===r.id; }).slice(-1)[0];
  if(d) { var u=db.users.find(function(x) { return x.id===d.reviewer&&x.role==='reviewer'&&x.status==='active'; });if(!u||!sealed(d,'decision_hash')||!eventBinds('compiler_decision',d.id,{hash:d.decision_hash})) throw new Error('DECISION_INTEGRITY_BLOCKED'); }
  return d;
}
async function reviewCompilerRun(id,note) {
  requireRole('reviewer');var r=currentCompilerRun(id),issues=r.package.document.evaluation.issues;
  var codes=issues.filter(function(e) { return e.status==='HUMAN_REVIEW_REQUIRED'; }).map(function(e) { return e.code; });
  if(!codes.length||issues.some(function(e) { return e.status!=='HUMAN_REVIEW_REQUIRED'; })) throw new Error('BLOCKING_EXCEPTION_NOT_OVERRIDABLE');
  if(compilerDecision(r)) throw new Error('EXCEPTION_ALREADY_DECIDED');
  var d=seal({id:uid('compilerdecision'),run_id:id,reviewer:actorId,input_fingerprint:inputFingerprint(r.input),pack_hash:hashObject(r.pack),accepted_codes:codes,note:humanNote(note)},'decision_hash');
  db.compiler_decisions.push(d);audit('compiler_decision',d.id,{hash:d.decision_hash});await saveDB();return d;
}
function compilerDraft(id) { var r=currentCompilerRun(id),d=compilerDecision(r);return compileEvidence(r.input,r.pack,{supersedes:r.supersedes||undefined,review:d||undefined}); }
async function attestCompilerRun(id,note,ack) {
  requireRole('reviewer');var r=currentCompilerRun(id);if(ack!==true) throw new Error('ATTESTATION_ACKNOWLEDGEMENT_REQUIRED');note=humanNote(note);
  if(!validRelease(r.pack)) throw new Error('PACK_RELEASE_APPROVAL_REQUIRED');
  var pkg=compilerDraft(id);if(pkg.document.evaluation.status!=='AUTO_REEVALUATED') throw new Error('UNRESOLVED_EXCEPTIONS');
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
