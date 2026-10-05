'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const name of ['mrv-core','methodology-packs','mrv-compiler','compiler-demo','climatechain-testnet-record','climatechain-demo']) {
  vm.runInThisContext(fs.readFileSync('src/'+name+'.js','utf8'));
}
let passed=0,failed=0;
function check(value,label){try{assert.ok(value,label);passed++;}catch(e){failed++;console.error('FAIL: '+label);process.exitCode=1;}}
function eq(a,b,label){check(canonicalize(a)===canonicalize(b),label);}

const testnet=climateChainTestnetRecord();
eq(testnet.status,'NOT_SUBMITTED','testnet record defaults to not submitted');
check(validateClimateChainTestnetRecord(testnet).ok===true,'default testnet record validates');
check(testnet.contract_address===null&&testnet.genesis_tx_hash===null&&testnet.successor_tx_hash===null,'unverified testnet record carries no chain evidence');
let invalidCaught=false;
try {
  validateClimateChainTestnetRecord(Object.assign({},testnet,{network:'Sepolia'}));
} catch(e) { invalidCaught=e.message.includes('UNVERIFIED_TESTNET_FIELDS_POPULATED'); }
check(invalidCaught,'partial unverified testnet evidence fails closed');
invalidCaught=false;
try {
  validateClimateChainTestnetRecord(Object.assign({},testnet,{status:'VERIFIED_TESTNET'}));
} catch(e) { invalidCaught=e.message.includes('TESTNET_NETWORK_REQUIRED'); }
check(invalidCaught,'verified status requires complete chain evidence');

const validTestnetRecord={
  schema:'naft-climatechain-testnet-record-1',
  status:'VERIFIED_TESTNET',
  network:'Example Public Testnet',
  chain_id:11155111,
  contract_address:'0x1111111111111111111111111111111111111111',
  deploy_tx_hash:'0x'+'1'.repeat(64),
  genesis_tx_hash:'0x'+'2'.repeat(64),
  successor_tx_hash:'0x'+'3'.repeat(64),
  explorer_base_url:'https://example.test',
  source_commit:'1'.repeat(40),
  compiler:'solc 0.8.24',
  verified_at:'2026-10-05T00:00:00Z',
  boundary:testnet.boundary
};
check(validateClimateChainTestnetRecord(validTestnetRecord).ok===true,'complete verified testnet record validates');
invalidCaught=false;
try { validateClimateChainTestnetRecord(Object.assign({},validTestnetRecord,{contract_address:'0x'+'0'.repeat(40)})); }
catch(e) { invalidCaught=e.message==='TESTNET_CONTRACT_ADDRESS_ZERO'; }
check(invalidCaught,'zero contract address rejected');
invalidCaught=false;
try { validateClimateChainTestnetRecord(Object.assign({},validTestnetRecord,{source_commit:'0'.repeat(40)})); }
catch(e) { invalidCaught=e.message==='TESTNET_SOURCE_COMMIT_ZERO'; }
check(invalidCaught,'zero source commit rejected');
invalidCaught=false;
try { validateClimateChainTestnetRecord(Object.assign({},validTestnetRecord,{successor_tx_hash:validTestnetRecord.genesis_tx_hash})); }
catch(e) { invalidCaught=e.message==='TESTNET_TX_HASHES_MUST_BE_DISTINCT'; }
check(invalidCaught,'duplicate deployment/lineage transaction hashes rejected');

const reference=climateReferenceScenario();
eq(reference.domain,'Japanese rice-paddy methane MRV','real-world reference domain is explicit');
check(reference.evidence_examples.length>=6,'real-world reference lists heterogeneous evidence');
check(reference.source_status.includes('not asserted'),'institutional version boundary remains explicit');
check(reference.experiment_boundary.includes('NAFT-SYNTHETIC@1 -> @2'),'real-world context is separated from synthetic experiment');

const roles=climateAdoptionRoles();
eq(roles.length,3,'three practical adoption roles');
check(roles.some(x=>x.role==='Project aggregator'),'aggregator adoption role present');
check(roles.some(x=>x.role==='Registry / carbon program'),'registry adoption role present');

const trust=climateTrustModel();
check(!trust.on_chain.some(x=>x.includes('raw evidence')),'raw evidence is not placed on-chain');
check(trust.never_claimed.includes('formal certification'),'formal certification remains outside trust claim');
check(trust.design_rule.includes('does not decide climate truth'),'blockchain trust boundary is explicit');

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
check(contract.includes('PreviousClaimMismatch(claimIdHash, previous.claimIdHash)'),'cross-claim parent guard present');
check(contract.includes('LineageHeadMismatch(currentHead, previousPackageHash)'),'lineage fork guard present');
check(!contract.includes(' payable'),'contract has no payable path');
check(!/function\s+mint\s*\(/.test(contract),'contract does not mint tokens');
check(!/function\s+transfer\s*\(/.test(contract),'contract does not implement token transfer');

console.log('CLIMATECHAIN RESULT: '+passed+' passed, '+failed+' failed');
if(failed) process.exitCode=1;
