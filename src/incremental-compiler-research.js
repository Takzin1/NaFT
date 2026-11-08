'use strict';
/**
 * NaFT selective research compilation v1.
 * Research lineage: Gupta/Mumick/Subrahmanian (1993); Acar et al. (2006 x2).
 * Narrow per-Claim immutable cache, NOT a full DRed, dynamic-dependence-graph
 * interpreter, general SQL incremental view maintenance, or carbon certifier.
 *
 * Requires canonicalize/hashObject/inputFingerprint/compileEvidence from Core.
 */
var NAFT_INCREMENTAL_SNAPSHOT_SCHEMA='naft-incremental-compiler-snapshot-1';
var NAFT_DERIVATION_VIEW_SCHEMA='naft-nonrecursive-support-view-1';
function incAssert(ok,code) { if(!ok) throw new Error('NAFT_INCREMENTAL_'+code); }
function incObject(x) { return !!x&&typeof x==='object'&&!Array.isArray(x); }
function incId(x) { return typeof x==='string'&&x.length>0&&x.length<=180; }
function incItems(xs,max,code) {
  incAssert(Array.isArray(xs)&&xs.length<=max,code);return xs;
}
function incStableRecords(records) {
  return records.slice().sort(function(a,b){return a.claim_id<b.claim_id?-1:a.claim_id>b.claim_id?1:0;});
}
function incSnapshotPayload(entries) {
  return {schema:NAFT_INCREMENTAL_SNAPSHOT_SCHEMA,
    record_count:entries.length,records:incStableRecords(entries),
    formal_certification:false,certified_tco2e:null,
    note:'Local research cache; hashes detect accidental changes but do not authenticate scientific evidence or external authorship.'};
}
function validateIncrementalSnapshot(snapshot) {
  incAssert(incObject(snapshot)&&snapshot.schema===NAFT_INCREMENTAL_SNAPSHOT_SCHEMA&&
    snapshot.formal_certification===false&&snapshot.certified_tco2e===null&&
    typeof snapshot.snapshot_hash==='string'&&/^[a-f0-9]{64}$/.test(snapshot.snapshot_hash),
    'INVALID_SNAPSHOT');
  incItems(snapshot.records,1000,'SNAPSHOT_LIMIT');
  incAssert(snapshot.record_count===snapshot.records.length,'SNAPSHOT_COUNT_MISMATCH');
  var seen=new Set();
  snapshot.records.forEach(function(r) {
    incAssert(incObject(r)&&incId(r.claim_id)&&!seen.has(r.claim_id)&&
      incId(r.pack_key)&&/^[a-f0-9]{64}$/.test(r.input_hash||'')&&
      /^[a-f0-9]{64}$/.test(r.pack_hash||'')&&
      /^[a-f0-9]{64}$/.test(r.package_hash||'')&&
      incObject(r.document)&&hashObject(r.document)===r.package_hash&&
      r.certified_tco2e===null,'CORRUPT_SNAPSHOT_ENTRY');
    seen.add(r.claim_id);
  });
  var body=incSnapshotPayload(snapshot.records);
  incAssert(canonicalize(snapshot.records)===canonicalize(body.records)&&
    snapshot.snapshot_hash===hashObject(body)&&canonicalize(snapshot)===
      canonicalize(Object.assign({},body,{snapshot_hash:snapshot.snapshot_hash})),
    'SNAPSHOT_HASH_MISMATCH');
  return true;
}
function compileIncrementalResearch(claims,registry,previous) {
  incItems(claims,1000,'CLAIMS_LIMIT');
  incAssert(incObject(registry),'REGISTRY_REQUIRED');
  if(previous!==undefined&&previous!==null)validateIncrementalSnapshot(previous);
  var old=new Map((previous&&previous.records||[]).map(function(r){return [r.claim_id,r];}));
  var next=[],seen=new Set(),reused=[],recomputed=[],added=[],invalidated=[];
  claims.forEach(function(raw) {
    incAssert(incObject(raw)&&incObject(raw.activity)&&incId(raw.activity.id)&&
      !seen.has(raw.activity.id),'CLAIM_ID_OR_DUPLICATE');
    var id=raw.activity.id;seen.add(id);
    var input=canonicalCompilerInput(raw),key=compilerKey(input.activity);
    incAssert(Object.prototype.hasOwnProperty.call(registry,key)&&
      incObject(registry[key]),'MISSING_OR_INVALID_PACK');
    var pack=registry[key],inputHash=inputFingerprint(input),packHash=hashObject(pack);
    var prior=old.get(id);
    if(prior&&prior.pack_key===key&&prior.input_hash===inputHash&&prior.pack_hash===packHash) {
      reused.push(id);
      next.push(prior);return;
    }
    var fresh=compileEvidence(input,pack);
    incAssert(hashObject(fresh.document)===fresh.package_hash,'COMPILATION_HASH_MISMATCH');
    next.push({claim_id:id,input_hash:inputHash,pack_key:key,pack_hash:packHash,
      package_hash:fresh.package_hash,document:fresh.document,certified_tco2e:null});
    recomputed.push(id);
    if(!prior)added.push(id);
    else invalidated.push({claim_id:id,reason:prior.pack_key!==key||prior.pack_hash!==packHash?
      'METHODOLOGY_OR_PACK_CHANGE':'INPUT_OR_EVIDENCE_CHANGE',
      previous_package_hash:prior.package_hash,new_package_hash:fresh.package_hash});
  });
  var removed=Array.from(old.keys()).filter(function(id){return !seen.has(id);}).sort();
  var body=incSnapshotPayload(next);
  var snapshot=Object.assign({},body,{snapshot_hash:hashObject(body)});
  validateIncrementalSnapshot(snapshot);
  return {snapshot:snapshot,change_report:{
    schema:'naft-incremental-compilation-delta-1',
    total_claims:snapshot.record_count,
    reused:reused.sort(),recomputed:recomputed.sort(),added:added.sort(),
    removed:removed,invalidated:invalidated.sort(function(a,b){return a.claim_id.localeCompare(b.claim_id);}),
    recomputation_skipped:reused.length,
    semantics:'PER_CLAIM_CACHE_WITH_CONTENT_FINGERPRINTS',
    full_dag_change_propagation_implemented:false,
    independent_oracle_run:false,certification:'NOT_PERFORMED'}};
}
function compareIncrementalWithFull(snapshot,claims,registry) {
  validateIncrementalSnapshot(snapshot);
  incItems(claims,1000,'CLAIMS_LIMIT');
  var originals=new Map(),seen=new Set();
  claims.forEach(function(raw){
    incAssert(raw&&raw.activity&&incId(raw.activity.id)&&
      !seen.has(raw.activity.id),'ORACLE_DUPLICATE_CLAIM');
    var id=raw.activity.id,key=compilerKey(raw.activity),pack=registry[key];
    incAssert(!!pack,'ORACLE_PACK_MISSING');seen.add(id);
    var input=canonicalCompilerInput(raw),pkg=compileEvidence(input,pack);
    originals.set(id,{input_hash:inputFingerprint(input),pack_hash:hashObject(pack),
      pack_key:key,package_hash:pkg.package_hash});
  });
  var mismatches=[];
  snapshot.records.forEach(function(r){
    var original=originals.get(r.claim_id);
    if(!original||original.input_hash!==r.input_hash||
      original.pack_hash!==r.pack_hash||original.pack_key!==r.pack_key||
      original.package_hash!==r.package_hash)mismatches.push(r.claim_id);
  });
  originals.forEach(function(v,id){if(!snapshot.records.some(function(r){return r.claim_id===id;}))mismatches.push(id);});
  return {status:mismatches.length?'MISMATCH':'MATCH',compared_claims:claims.length,
    mismatches:mismatches.sort(),oracle:'FULL_COMPILE_EVIDENCE_FOR_EVERY_CLAIM',
    certificate_issued:false};
}
/**
 * Research-only nonrecursive alternative support counter.
 * Each derivation is a distinct (tuple_id, derivation_id) token.
 * Counts concern whether a derived tuple still has ANY surviving derivation.
 * Not DRed, not recursive negation/aggregation, not a GHG eligibility rule.
 */
function incSupportView(derivations) {
  incItems(derivations,4096,'DERIVATION_LIMIT');
  var ids=new Set(),rows=[];
  derivations.forEach(function(r){
    incAssert(incObject(r)&&incId(r.tuple_id)&&incId(r.derivation_id)&&
      !ids.has(r.derivation_id),'INVALID_DERIVATION_OR_DUPLICATE');
    ids.add(r.derivation_id);
    rows.push({tuple_id:r.tuple_id,derivation_id:r.derivation_id});
  });
  rows.sort(function(a,b){return a.derivation_id.localeCompare(b.derivation_id);});
  var counts=new Map();
  rows.forEach(function(r){counts.set(r.tuple_id,(counts.get(r.tuple_id)||0)+1);});
  var tuples=Array.from(counts,function(pair){return {tuple_id:pair[0],derivation_count:pair[1],present:true};})
    .sort(function(a,b){return a.tuple_id.localeCompare(b.tuple_id);});
  var body={schema:NAFT_DERIVATION_VIEW_SCHEMA,derivations:rows,tuples:tuples,
    scope:'FINITE_NONRECURSIVE_ALTERNATIVE_SUPPORT_ONLY',is_dred:false};
  return Object.assign({},body,{view_hash:hashObject(body)});
}
function incValidateSupportView(view) {
  incAssert(incObject(view)&&view.schema===NAFT_DERIVATION_VIEW_SCHEMA&&
    Array.isArray(view.derivations)&&Array.isArray(view.tuples),'INVALID_SUPPORT_VIEW');
  var rebuilt=incSupportView(view.derivations);
  incAssert(view.view_hash===rebuilt.view_hash&&canonicalize(view)===canonicalize(rebuilt),
    'TAMPERED_SUPPORT_VIEW');
  return true;
}
function updateResearchSupports(previous,delta) {
  incValidateSupportView(previous);
  incAssert(incObject(delta),'INVALID_SUPPORT_DELTA');
  var remove=incItems(delta.remove||[],4096,'SUPPORT_REMOVE_LIMIT');
  var add=incItems(delta.add||[],4096,'SUPPORT_ADD_LIMIT');
  var prior=new Map(previous.derivations.map(function(r){return [r.derivation_id,r];}));
  var removedIds=new Set();
  remove.forEach(function(id){
    incAssert(incId(id)&&prior.has(id)&&!removedIds.has(id),'UNKNOWN_OR_DUPLICATE_REMOVAL');
    removedIds.add(id);prior.delete(id);
  });
  add.forEach(function(r){
    incAssert(incObject(r)&&incId(r.derivation_id)&&incId(r.tuple_id)&&
      !prior.has(r.derivation_id),'DUPLICATE_SUPPORT_INSERTION');
    prior.set(r.derivation_id,r);
  });
  var view=incSupportView(Array.from(prior.values()));
  var oldTuples=new Set(previous.tuples.map(function(t){return t.tuple_id;}));
  var nextTuples=new Set(view.tuples.map(function(t){return t.tuple_id;}));
  var inserted=Array.from(nextTuples).filter(function(t){return !oldTuples.has(t);}).sort();
  var deleted=Array.from(oldTuples).filter(function(t){return !nextTuples.has(t);}).sort();
  return {view:view,delta:{inserted_tuples:inserted,deleted_tuples:deleted,
    preserved_tuples:Array.from(nextTuples).filter(function(t){return oldTuples.has(t);}).sort(),
    semantics:'COUNT_ALTERNATIVE_DERIVATIONS_WITHOUT_RECURSION'}};
}
