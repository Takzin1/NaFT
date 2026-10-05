'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const name of ['mrv-core','methodology-packs','mrv-compiler','compiler-demo','climatechain-demo']) {
  vm.runInThisContext(fs.readFileSync('src/'+name+'.js','utf8'));
}
let passed=0,failed=0;
function check(value,label){try{assert.ok(value,label);passed++;}catch(e){failed++;console.error('FAIL: '+label);process.exitCode=1;}}
function eq(a,b,label){check(canonicalize(a)===canonicalize(b),label);}

const impact=runClimateChainImpact();
eq(impact.counts.total,100,'100 synthetic claims evaluated');
eq(impact.counts.require_reverification,30,'30 claims require re-verification');
eq(impact.counts.UNAFFECTED,70,'70 claims unaffected by intensive-only change');
eq(impact.counts.AUTO_REEVALUATED,15,'15 claims auto re-evaluated');
eq(impact.counts.EVIDENCE_REQUIRED,15,'15 claims fail closed for new evidence');

const row=climateChainRepresentative(impact);
check(!!row,'representative successor exists');
eq(row.status,'AUTO_REEVALUATED','representative is deterministic successor');
check(row.requires_reverification===true,'representative requires re-verification');
check(!!row.successor&&typeof row.successor.package_hash==='string','representative has successor package');

const plan=buildClimateChainAnchorPlan(impact);
eq(plan.chain_status,'NOT_SUBMITTED','browser never claims blockchain submission');
check(plan.formal_certification===false,'anchor is not formal certification');
check(plan.carbon_credit_issued===false,'anchor does not issue a carbon credit');
eq(plan.genesis.previous_package_hash,ZERO_BYTES32,'genesis has zero parent');
eq(plan.successor.previous_package_hash,plan.genesis.package_hash,'successor binds exact prior package');
check(plan.successor.package_hash!==plan.genesis.package_hash,'successor hash differs from prior package');
eq(plan.successor.claim_id_hash,plan.genesis.claim_id_hash,'lineage binds same claim');
check(plan.lineage_checks.successor_supersedes_previous===true,'compiler provenance contains supersedes edge');
check(plan.lineage_checks.previous_package_stale===true,'prior package marked stale after semantic change');
check(plan.lineage_checks.requires_reverification===true,'anchor plan comes from impacted claim');

const hashes=[
  plan.genesis.claim_id_hash,plan.genesis.package_hash,plan.genesis.methodology_hash,
  plan.successor.claim_id_hash,plan.successor.package_hash,plan.successor.methodology_hash,
  plan.successor.previous_package_hash
];
check(hashes.every(h=>/^0x[a-f0-9]{64}$/.test(h)),'all contract arguments are bytes32 hex');
eq(plan,buildClimateChainAnchorPlan(runClimateChainImpact()),'anchor plan deterministic for deterministic fixture');

const contract=fs.readFileSync('contracts/NaFTMRVAnchor.sol','utf8');
check(contract.includes('function anchorPackage('),'anchorPackage contract entrypoint present');
check(contract.includes('PackageAlreadyAnchored(packageHash)'),'duplicate package guard present');
check(contract.includes('PreviousPackageMissing(previousPackageHash)'),'missing-parent guard present');
check(contract.includes('LineageHeadMismatch(currentHead, previousPackageHash)'),'lineage fork guard present');
check(!contract.includes(' payable'),'contract has no payable path');
check(!/function\s+mint\s*\(/.test(contract),'contract does not mint tokens');
check(!/function\s+transfer\s*\(/.test(contract),'contract does not implement token transfer');

console.log('CLIMATECHAIN RESULT: '+passed+' passed, '+failed+' failed');
if(failed) process.exitCode=1;
