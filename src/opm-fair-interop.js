'use strict';
/*
 * NaFT research interoperability sidecar (OPM v1.1 crosswalk + FAIR checklist).
 * No official OPM conformance, FAIR certification, external evidence validation,
 * licensing determination, blockchain writes, or publication of source records.
 * Load after mrv-core.js, methodology-packs.js, and mrv-compiler.js.
 */
var NAFT_OPM_CROSSWALK_SCHEMA='naft-opm-v1.1-research-crosswalk-1';
var NAFT_FAIR_CHECK_SCHEMA='naft-fair-metadata-self-check-1';
function naftResearchAssert(ok,code) { if(!ok) throw new Error('NAFT_RESEARCH_'+code); }
function naftString(s) { return typeof s==='string'&&s.length>0&&s.length<=512; }
function naftSafeUrl(s) { return typeof s==='string'&&/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(s)&&s.length<2048; }
function naftSortObjectArray(a) { return a.slice().sort(function(x,y) {
  var a=canonicalize(x),b=canonicalize(y);return a<b?-1:a>b?1:0;
}); }
function naftNonEmptyArray(x) {return Array.isArray(x)&&x.length>0&&x.every(naftString);}
function naftResearchPackageCurrent(pkg,input,pack,compilerOptions) {
  return !!pkg&&!!pkg.document&&hashObject(pkg.document)===pkg.package_hash&&
    pkg.package_hash===compileEvidence(input,pack,compilerOptions||{}).package_hash;
}
function naftOpmCrosswalk(pkg,input,pack,compilerOptions) {
  naftResearchAssert(naftResearchPackageCurrent(pkg,input,pack,compilerOptions),'STALE_COMPILER_PACKAGE');
  var doc=pkg.document, graph=doc.provenance_graph;
  naftResearchAssert(graph&&graph.schema==='naft-provenance-1'&&
    graph.edge_direction==='dependency_to_dependent'&&
    hashObject(graph)===doc.provenance_graph_reference,'GRAPH_IDENTITY');
  var permitted={field:1,activity:1,evidence:1,methodology:1,parameter:1};
  var nodes=[],edges=[],ids=new Set();
  function add(kind,id,attributes) {
    naftResearchAssert(!ids.has(id),'DUPLICATE_OPM_NODE');ids.add(id);
    nodes.push({id:id,kind:kind,attributes:attributes});return id;
  }
  var used=[];
  graph.nodes.forEach(function(n) {
    if(!permitted[n.type]) return;
    naftResearchAssert(typeof n.hash==='string'&&/^[a-f0-9]{64}$/.test(n.hash),'UNVERIFIED_NODE_HASH');
    var id='art:'+hashObject({source_graph_id:n.id,source_hash:n.hash});
    add('artifact',id,{source_type:n.type,source_graph_hash:n.hash});
    used.push({id:id,role:n.type});
  });
  var process=add('process','proc:'+hashObject({activity:'compileEvidence',package_hash:pkg.package_hash}),
    {name:'NaFT deterministic compiler',process_type:'compiler_execution_record'});
  var output=add('artifact','art:'+hashObject({package_hash:pkg.package_hash}),
    {source_type:'compiler_package',sha256:pkg.package_hash});
  used.forEach(function(a) {edges.push({from:process,to:a.id,relation:'used',role:a.role});});
  edges.push({from:output,to:process,relation:'wasGeneratedBy',role:'compiled_package'});
  var base={
    schema:NAFT_OPM_CROSSWALK_SCHEMA,
    source_schema:doc.schema,source_graph_hash:doc.provenance_graph_reference,
    source_package_hash:pkg.package_hash,
    source_edge_direction:'dependency_to_dependent',edge_direction:'effect_to_cause',
    semantics:'OPM_V1_1_INSPIRED_COARSE_GRAINED_PAST_EXECUTION_SUBSET',
    nodes:naftSortObjectArray(nodes),edges:naftSortObjectArray(edges),
    full_opm_conformance_asserted:false,independent_evidence_authentication:false,
    external_regulator_certification:false,certified_tco2e:null,
    caution:'Coarse-grained declared dependency crosswalk; not proof of complete causality, provenance authenticity, or credit issuance.'
  };
  var result=Object.assign({},base,{crosswalk_hash:hashObject(base)});
  naftValidateOpmCrosswalk(result);
  return result;
}
function naftValidateOpmCrosswalk(x) {
  naftResearchAssert(x&&x.schema===NAFT_OPM_CROSSWALK_SCHEMA&&
    x.edge_direction==='effect_to_cause'&&
    x.source_edge_direction==='dependency_to_dependent'&&
    Array.isArray(x.nodes)&&Array.isArray(x.edges)&&
    x.nodes.length<=2000&&x.edges.length<=10000,'OPM_SCHEMA');
  var nodes=new Map();
  x.nodes.forEach(function(n){
    naftResearchAssert(n&&naftString(n.id)&&
      ['artifact','process','agent'].includes(n.kind)&&!nodes.has(n.id),'OPM_NODE_INVALID');
    nodes.set(n.id,n);
  });
  var seen=new Set();
  var shapes={
    used:['process','artifact',true],
    wasGeneratedBy:['artifact','process',true],
    wasControlledBy:['process','agent',true],
    wasDerivedFrom:['artifact','artifact',false],
    wasTriggeredBy:['process','process',false]
  };
  var adj=new Map(Array.from(nodes.keys(),function(id){return [id,[]];}));
  x.edges.forEach(function(e) {
    var shape=e&&shapes[e.relation];
    naftResearchAssert(shape&&nodes.has(e.from)&&nodes.has(e.to)&&
      nodes.get(e.from).kind===shape[0]&&nodes.get(e.to).kind===shape[1]&&
      e.from!==e.to,'OPM_EDGE_TYPE_OR_DIRECTION');
    naftResearchAssert(shape[2]?naftString(e.role):e.role===undefined,'OPM_EDGE_ROLE');
    var key=canonicalize(e);naftResearchAssert(!seen.has(key),'OPM_DUPLICATE_EDGE');seen.add(key);
    adj.get(e.from).push(e.to);
  });
  var visiting=new Set(),visited=new Set();
  function dfs(id) {
    naftResearchAssert(!visiting.has(id),'OPM_CYCLE');
    if(visited.has(id))return;
    visiting.add(id);adj.get(id).forEach(dfs);visiting.delete(id);visited.add(id);
  }
  Array.from(nodes.keys()).forEach(dfs);
  var base=Object.assign({},x);delete base.crosswalk_hash;
  naftResearchAssert(x.crosswalk_hash===hashObject(base),'OPM_HASH_MISMATCH');
  naftResearchAssert(x.external_regulator_certification===false&&x.certified_tco2e===null&&
    x.full_opm_conformance_asserted===false,'OPM_UNSUPPORTED_ASSERTION');
  return true;
}
function naftFairPackageMetadata(pkg,input,pack,options) {
  options=options||{};
  naftResearchAssert(naftResearchPackageCurrent(pkg,input,pack,options.compiler_options),'STALE_COMPILER_PACKAGE');
  naftResearchAssert(options&&typeof options==='object'&&!Array.isArray(options),'FAIR_OPTIONS_INVALID');
  var d=pkg.document, id='urn:naft:package:sha256:'+pkg.package_hash;
  // A content-addressed URN is NOT by itself a registered, findable, persistent identifier.
  return {
    schema:'naft-research-package-metadata-1',data_identifier:id,
    persistent_identifier:options.persistent_identifier||null,
    title:'NaFT research compiler package',
    description:'Reproducible, non-certified MRV research compilation',
    keywords:['MRV','research','provenance'],
    describes:id,media_type:'application/json',
    schema_uri:null,metadata_access_url:null,access_url:null,
    indexed_in:null,access_policy:'not_published',metadata_retention_policy:null,
    license_uri:null,rights_review_status:'UNKNOWN',
    vocabulary_uris:[],qualified_relations:[
      {relation:'methodology_source',identifier:pack.source_url}
    ],community_standard_uri:null,
    provenance:{methodology_id:pack.methodology_id,methodology_version:pack.methodology_version,
      pack_sha256:hashObject(pack),package_sha256:pkg.package_hash,
      compiler_input_sha256:d.input_fingerprint,source_verification:'UNVERIFIED'},
    real_world_data_authenticated:false,methodology_adoption_verified:false,
    formal_certification:false,certified_tco2e:null
  };
}
function naftFairSelfCheck(m) {
  naftResearchAssert(m&&typeof m==='object'&&!Array.isArray(m)&&
    naftString(m.data_identifier),'FAIR_RECORD_INVALID');
  var checks=[];
  function add(id,declared,context) {
    checks.push({principle:id,status:declared?'DECLARED_UNVERIFIED':'MISSING_OR_UNESTABLISHED',
      note:context});
  }
  add('F1',naftString(m.persistent_identifier),
      'Globally unique persistent identifier must be independently registered and maintained; local URN alone is insufficient.');
  add('F2',naftString(m.title)&&naftString(m.description)&&naftNonEmptyArray(m.keywords),
      'Rich, relevant and accurate metadata still require domain review.');
  add('F3',m.describes===m.data_identifier,'Metadata must explicitly identify its described resource.');
  add('F4',naftSafeUrl(m.indexed_in),'Searchable external indexing must be checked.');
  add('A1',naftSafeUrl(m.metadata_access_url)&&naftSafeUrl(m.access_url),
      'A retrieval endpoint and protocol must be checked; access may be restricted.');
  add('A1.1',naftSafeUrl(m.metadata_access_url),
      'HTTPS endpoint declared; actual openness and availability not tested.');
  add('A1.2',naftString(m.access_policy)&&m.access_policy!=='not_published',
      'Authentication and authorization policy must be described where needed.');
  add('A2',naftSafeUrl(m.metadata_access_url)&&naftString(m.metadata_retention_policy),
      'Metadata retention after data withdrawal needs an enforceable policy.');
  add('I1',naftSafeUrl(m.schema_uri)&&naftString(m.media_type),
      'A broadly shared formal knowledge-representation language cannot be proven by JSON alone.');
  add('I2',Array.isArray(m.vocabulary_uris)&&m.vocabulary_uris.some(naftSafeUrl),
      'Controlled vocabulary itself requires independent FAIR assessment.');
  add('I3',Array.isArray(m.qualified_relations)&&m.qualified_relations.some(function(x){
    return x&&naftString(x.relation)&&naftString(x.identifier);
  }),'Qualified links must be semantically reviewed.');
  add('R1',naftString(m.title)&&naftString(m.description)&&naftNonEmptyArray(m.keywords),
      'Description quality and relevance are not machine-provable from presence alone.');
  add('R1.1',naftSafeUrl(m.license_uri)&&m.rights_review_status==='REVIEWED',
      'Explicit accessible usage license and actual rights check are required; Open Access is not automatic reuse permission.');
  add('R1.2',m.provenance&&naftString(m.provenance.methodology_id)&&
      /^[a-f0-9]{64}$/.test(m.provenance.package_sha256||''),
      'Local compiler provenance declared; external authenticity is not verified.');
  add('R1.3',naftSafeUrl(m.community_standard_uri),
      'Claimed community standard and scope require domain review.');
  var declared=checks.filter(function(x){return x.status==='DECLARED_UNVERIFIED';}).length;
  return {
    schema:NAFT_FAIR_CHECK_SCHEMA,resource_id:m.data_identifier,
    checks:checks,declared_count:declared,missing_or_unestablished_count:checks.length-declared,
    fair_certified:false,completeness_score_claimed:false,
    external_endpoints_checked:false,
    redistribution_authorized:m.rights_review_status==='REVIEWED'&&naftSafeUrl(m.license_uri)?'REQUIRES_MANUAL_CONFIRMATION':'NOT_ESTABLISHED',
    note:'FAIR principles are guidelines. These are local metadata-presence checks, not a standard FAIR maturity assessment or permission to publish evidence.'
  };
}
function naftResearchInteropReceipt(pkg,input,pack,options) {
  var opm=naftOpmCrosswalk(pkg,input,pack,options&&options.compiler_options);
  var metadata=naftFairPackageMetadata(pkg,input,pack,options);
  var fair=naftFairSelfCheck(metadata);
  return {schema:'naft-research-interop-receipt-1',
    source_package_hash:pkg.package_hash,opm:opm,metadata:metadata,fair:fair,
    certification:'NOT_PERFORMED',on_chain_status:'NOT_SUBMITTED'};
}
