'use strict';
/**
 * NaFT provenance explanation sidecar for compiler packages.
 *
 * Inspired by Buneman/Khanna/Tan (2001) and Cheney/Chiticariu/Tan (2009).
 * This is NOT a general SQL/DQL provenance implementation: the existing
 * compiler graph represents conservative dependencies, and the small
 * requirement-witness component represents evidence-completeness only.
 *
 * Load after mrv-core.js, methodology-packs.js and mrv-compiler.js.
 * No network, PDF ingestion, chain writes, or automatic certification.
 */
var NAFT_PROVENANCE_EXPLAIN_SCHEMA = 'naft-compiler-provenance-explanation-1';

function minimalProvenanceWitnesses(sets) {
  if(!Array.isArray(sets) || sets.length>4096) throw new Error('PROVENANCE_INVALID_WITNESS_SETS');
  var keys=[], seen=new Set();
  sets.forEach(function(s) {
    if(!Array.isArray(s)||s.length>100||
       s.some(function(x){return typeof x!=='string'||!x||x.length>250;}))
      throw new Error('PROVENANCE_INVALID_WITNESS');
    var unique=Array.from(new Set(s)).sort(), key=JSON.stringify(unique);
    if(!seen.has(key)) { seen.add(key);keys.push(unique); }
  });
  keys.sort(function(a,b) {
    return a.length-b.length || (JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0);
  });
  return keys.filter(function(w,i) {
    return !keys.some(function(smaller,j) {
      return j!==i && smaller.length<w.length &&
        smaller.every(function(id) { return w.indexOf(id)!==-1; });
    });
  });
}
function compilerRequirementWitnesses(pkg,input,pack,maxCombinations) {
  if(!packageCurrent(pkg,input,pack)) throw new Error('PROVENANCE_STALE_PACKAGE');
  var max=maxCombinations===undefined?256:maxCombinations;
  if(!Number.isInteger(max)||max<1||max>4096) throw new Error('PROVENANCE_INVALID_WITNESS_LIMIT');
  var doc=pkg.document, groups=[], missing=[];
  Object.keys(pack.evidence_requirements).sort().forEach(function(key) {
    var requirement=pack.evidence_requirements[key];
    if(!requirement.required || !matchesWhen(input,requirement.when)) return;
    var matches=doc.evidence_manifests.filter(function(e) {
      return e.category===requirement.category && e.content_verified===true &&
        e.binding_valid===true && e.parse_valid===true &&
        e.manifest_hash===hashObject((function() {
          var c=clone(e);delete c.manifest_hash;return c;
        })());
    }).map(function(e) { return 'evidence:'+e.id; });
    matches=Array.from(new Set(matches)).sort();
    groups.push({requirement_id:key,category:requirement.category,candidates:matches});
    if(!matches.length) missing.push(key);
  });
  if(missing.length) return {scope:'EVIDENCE_COMPLETENESS_ONLY',status:'MISSING_REQUIRED_EVIDENCE',
    required:groups,missing:missing,minimal_witnesses:[],
    warning:'This is NOT a witness basis for all compiler outputs or SQL query rewriting.'};
  var witnesses=[[]];
  groups.forEach(function(g) {
    if(witnesses.length * g.candidates.length>max)
      throw new Error('PROVENANCE_WITNESS_LIMIT_EXCEEDED');
    var next=[];
    witnesses.forEach(function(w){g.candidates.forEach(function(id){next.push(w.concat([id]));});});
    witnesses=next;
  });
  return {scope:'EVIDENCE_COMPLETENESS_ONLY',status:'REQUIREMENTS_WITNESSED',
    required:groups,missing:[],minimal_witnesses:minimalProvenanceWitnesses(witnesses),
    warning:'Evidence completeness is not data authenticity, methodological validity, or certification.'};
}
function provenanceAncestors(graph,target) {
  if(!graph||graph.edge_direction!=='dependency_to_dependent'||
     !Array.isArray(graph.nodes)||!Array.isArray(graph.edges))
    throw new Error('PROVENANCE_GRAPH_INVALID');
  var map=new Map(graph.nodes.map(function(n){return [n.id,n];}));
  if(map.size!==graph.nodes.length||!map.has(target)||
     graph.edges.some(function(e){return !map.has(e.from)||!map.has(e.to);}))
    throw new Error('PROVENANCE_GRAPH_INCONSISTENT');
  var seen=new Set([target]), queue=[target];
  while(queue.length) {
    var at=queue.shift();
    graph.edges.forEach(function(e) {
      if(e.to===at&&!seen.has(e.from)) {seen.add(e.from);queue.push(e.from);}
    });
  }
  return Array.from(seen).sort().map(function(id){return {id:id,type:map.get(id).type,hash:map.get(id).hash};});
}
function compilerWhereCopy(pkg,input,pack,outputPath) {
  var doc=pkg.document, source=null, target;
  function where(kind,path) {source={kind:kind,path:path};}
  // Copy provenance deliberately excludes computed aggregates and hashes.
  if(outputPath==='document.calculation.arithmetic_preview') {
    return {status:'DERIVED_NOT_COPIED',locations:[],note:'Value is calculated; inspect dependencies, not copied-cell provenance.'};
  }
  var field=outputPath.match(/^document\.field_identity\.([a-zA-Z0-9_]+)$/);
  var activity=outputPath.match(/^document\.activity_identity\.([a-zA-Z0-9_]+)$/);
  var val=outputPath.match(/^document\.calculation_inputs\.values\.(\d+)$/);
  var param=outputPath.match(/^document\.calculation_inputs\.parameters\.([a-zA-Z0-9_]+)$/);
  if(field) where('compiler_input','field.'+field[1]);
  else if(activity) where('compiler_input','activity.'+activity[1]);
  else if(param) {
    if(!Object.prototype.hasOwnProperty.call(pack.parameters,param[1]))
      throw new Error('PROVENANCE_UNKNOWN_PARAMETER');
    var overridden=Object.prototype.hasOwnProperty.call(input.parameter_overrides||{},param[1]);
    where(overridden?'compiler_input':'methodology_pack',
      (overridden?'parameter_overrides.':'parameters.')+param[1]+(overridden?'':'.value'));
  } else if(val) {
    var n=Number(val[1]),spec=pack.calculation_spec;
    var paths=spec.inputs||[],params=spec.parameters||[];
    if(n<paths.length) {
      if(!/^(field|activity)\.[a-zA-Z0-9_.]+$/.test(paths[n]))
        return {status:'UNSUPPORTED_COPY_MAPPING',locations:[],note:'Input path outside supported origin classes.'};
      where('compiler_input',paths[n]);
    } else if(n-paths.length<params.length) {
      var name=params[n-paths.length];
      if(!Object.prototype.hasOwnProperty.call(pack.parameters,name))
        throw new Error('PROVENANCE_UNKNOWN_PARAMETER');
      var override=Object.prototype.hasOwnProperty.call(input.parameter_overrides||{},name);
      where(override?'compiler_input':'methodology_pack',
        (override?'parameter_overrides.':'parameters.')+name+(override?'':'.value'));
    }
  }
  if(!source) return {status:'UNSUPPORTED_COPY_MAPPING',locations:[],
    note:'No verified direct-copy mapping for this output path; do not infer origin from equality.'};
  target=getPath({document:doc},outputPath);
  var origin=source.kind==='compiler_input'?getPath(input,source.path):getPath(pack,source.path);
  if(origin===undefined||target===undefined||canonicalize(target)!==canonicalize(origin))
    throw new Error('PROVENANCE_COPY_VALUE_MISMATCH');
  return {status:'DIRECT_COPY',locations:[{source:source.kind,path:source.path}],
    note:'Syntactic direct-copy origin for this exact compiler expression; not invariant under rewrites.'};
}
function explainCompilerProvenance(pkg,input,pack,outputPath) {
  if(typeof outputPath!=='string'||outputPath.length>180||
     !/^document\.[a-zA-Z0-9_.]+$/.test(outputPath))
    throw new Error('PROVENANCE_INVALID_OUTPUT_PATH');
  if(!packageCurrent(pkg,input,pack)) throw new Error('PROVENANCE_STALE_PACKAGE');
  var doc=pkg.document, claim=doc.claim_id;
  var kind=outputPath.indexOf('document.field_identity.')===0?'field':
    outputPath.indexOf('document.activity_identity.')===0?'activity':
    outputPath.indexOf('document.calculation_inputs.parameters.')===0?'parameter':'calculation';
  var target=kind==='field'?'field:'+input.field.id:
    kind==='activity'?'activity:'+input.activity.id:
    kind==='parameter'?'parameter:'+compilerKey(pack)+':'+outputPath.split('.').slice(-1)[0]:
    'calculation:'+claim;
  var where=compilerWhereCopy(pkg,input,pack,outputPath);
  return {
    schema:NAFT_PROVENANCE_EXPLAIN_SCHEMA,claim_id:claim,package_hash:pkg.package_hash,
    output_path:outputPath,
    why:{scope:'CONSERVATIVE_COMPILER_DEPENDENCIES_NOT_DATABASE_WITNESS_BASIS',
      nodes:provenanceAncestors(doc.provenance_graph,target),
      note:'Graph ancestor closure can over-approximate causal requirements; it is not a minimal database witness proof.'},
    where:where,
    evidence_requirements:compilerRequirementWitnesses(pkg,input,pack),
    how_provenance:'NOT_IMPLEMENTED',
    source_data_authenticated:false,formal_certification:false,certified_tco2e:null
  };
}
