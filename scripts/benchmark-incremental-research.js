#!/usr/bin/env node
'use strict';
/**
 * Research-only local timing harness. No production speedup claim.
 * Execute from repo root: node scripts/benchmark-incremental-research.js
 */
const fs=require('node:fs'),vm=require('node:vm');
for (const name of ['mrv-core','methodology-packs','mrv-compiler','compiler-demo',
                   'incremental-compiler-research']) {
  vm.runInThisContext(fs.readFileSync('src/'+name+'.js','utf8'),{filename:name+'.js'});
}
const pack=COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
const registry={'NAFT-SYNTHETIC@1':pack};
const original=Array.from({length:60},(_,i)=>syntheticClaim('BENCH-'+String(i).padStart(3,'0')));
const base=compileIncrementalResearch(original,registry);
const changed=original.map(x=>clone(x));
changed[0].field.area_ha+=1;
const one=compileIncrementalResearch(changed,registry,base.snapshot);
const oracle=compareIncrementalWithFull(one.snapshot,changed,registry);
if(oracle.status!=='MATCH'||one.change_report.recomputed.length!==1) {
  throw new Error('BENCHMARK_ORACLE_MISMATCH');
}
function timed(fn) {
  const start=process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint()-start)/1e6;
}
function median(xs) {
  const s=xs.slice().sort((a,b)=>a-b);
  return s[Math.floor(s.length/2)];
}
function samples(fn) {
  fn(); // warm-up excluded
  return Array.from({length:5},()=>timed(fn));
}
const full=samples(()=>changed.forEach(x=>compileEvidence(x,pack)));
const incremental=samples(()=>compileIncrementalResearch(changed,registry,base.snapshot));
const replayOracle=samples(()=>compareIncrementalWithFull(one.snapshot,changed,registry));
const baseline=samples(()=>compileIncrementalResearch(original,registry));
const result={
  schema:'naft-incremental-research-benchmark-1',
  fixture:'SYNTHETIC_ONLY',claims:original.length,changed_claims:1,
  samples_per_metric:5,unit:'milliseconds',statistic:'median',
  runtime:process.version,platform:process.platform,
  initial_snapshot_build_ms:median(baseline),
  incremental_update_ms:median(incremental),
  full_compile_all_ms:median(full),
  full_oracle_check_ms:median(replayOracle),
  observed_full_over_incremental_ratio:median(full)/median(incremental),
  reused_claims:one.change_report.reused.length,
  recomputed_claims:one.change_report.recomputed.length,
  independent_full_oracle:oracle.status,
  limitations:'Single process and synthetic inputs. No GC control or confidence intervals; environment dependent. No official GHG method, production safety or generalized asymptotic improvement proven.'
};
console.log(JSON.stringify(result,null,2));
