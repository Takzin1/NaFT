'use strict';

var CLIMATECHAIN_ROUTE='climatechain';
var ZERO_BYTES32='0x'+'0'.repeat(64);
var ClimateChainDemo={impact:null,anchorPlan:null,message:''};

function hex32(value) {
  if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value)) throw new Error('INVALID_BYTES32_HEX');
  return '0x'+value;
}

function climateReferenceScenario() {
  return {
    domain:'Japanese rice-paddy methane MRV',
    methodology:'AG-005 reference context',
    source_status:'The retained repository reference is AG-005 3.1-reference. The currently adopted edition and coefficient applicability are not asserted by this demo.',
    evidence_examples:[
      'pre-project baseline records',
      'project record',
      'drainage start and end evidence',
      'heading-date record',
      'field-area record',
      'sustainability record'
    ],
    experiment_boundary:'The real-world context motivates the problem. The hackathon impact experiment itself uses NAFT-SYNTHETIC@1 -> @2 so the demo does not pretend to implement an official methodology revision.'
  };
}

function climateAdoptionRoles() {
  return [
    {role:'Project aggregator',need:'Collect evidence across many farms / fields and know which claims need attention after a rule change.'},
    {role:'MRV / verification operator',need:'Inspect only the affected claims, missing evidence and version lineage instead of silently reusing stale decisions.'},
    {role:'Registry / carbon program',need:'Verify package lineage and hashes without receiving raw private evidence on-chain.'}
  ];
}

function climateTrustModel() {
  return {
    on_chain:['claim hash','package hash','methodology hash','previous package hash','submitter','block timestamp'],
    off_chain:['raw evidence bytes','methodology interpretation','deterministic evaluation','human decisions','package construction'],
    never_claimed:['formal certification','observation truth','credit issuance','credit price','registry acceptance'],
    design_rule:'Blockchain witnesses version lineage; it does not decide climate truth.'
  };
}
function climateTestnetStatus() {
  var record=climateChainTestnetRecord();
  validateClimateChainTestnetRecord(record);
  return record;
}

function climateTestnetStatusCard(record) {
  var verified=record.status==='VERIFIED_TESTNET';
  var cls=verified?'verified':'pending';
  var label=verified?'VERIFIED TESTNET':'NOT SUBMITTED';
  var detail=verified
    ? esc(record.network)+' · chain '+esc(record.chain_id)+' · '+esc(record.contract_address)
    : 'No public-testnet transaction is claimed yet. Exact deployment and lineage fields remain empty until confirmed.';
  var links='';
  if(verified) {
    var explorer=climateChainExplorerLinks(record);
    links='<span class="climate-chain-links">'+
      '<a href="'+esc(explorer.contract)+'" target="_blank" rel="noopener noreferrer">Contract</a> · '+
      '<a href="'+esc(explorer.deployment)+'" target="_blank" rel="noopener noreferrer">Deploy Tx</a> · '+
      '<a href="'+esc(explorer.genesis)+'" target="_blank" rel="noopener noreferrer">P1 Tx</a> · '+
      '<a href="'+esc(explorer.successor)+'" target="_blank" rel="noopener noreferrer">P2 Tx</a> · '+
      '<a href="https://github.com/Takzin1/NaFT/commit/'+esc(record.source_commit)+'" target="_blank" rel="noopener noreferrer">Deployment source</a> · '+
      '<a href="https://github.com/Takzin1/NaFT/blob/hackathon/ieee-climatechain-2026/scripts/verify-climatechain-testnet.mjs" target="_blank" rel="noopener noreferrer">Read-only verifier</a>'+
      '</span>';
  }
  return '<div class="climate-status"><span class="pill '+cls+'">'+label+'</span><span>'+detail+'</span>'+links+'</div>';
}


function climateChainClaims() {
  var claims=[];
  for(var i=1;i<=100;i++) {
    var variant=i<=70?'standard':i<=85?'intensive':'intensive_complete';
    claims.push(syntheticClaim('CLIMATE-'+String(i).padStart(3,'0'),variant));
  }
  return claims;
}

function runClimateChainImpact() {
  return analyzeImpact(
    climateChainClaims(),
    {type:'methodology',old_key:'NAFT-SYNTHETIC@1',new_key:'NAFT-SYNTHETIC@2'}
  );
}

function climateChainRepresentative(impact) {
  if(!impact) return null;
  return impact.claims.find(function(row) {
    return row.requires_reverification&&row.status==='AUTO_REEVALUATED'&&row.successor;
  })||impact.claims.find(function(row) {
    return row.requires_reverification&&row.successor;
  })||null;
}

function buildClimateChainAnchorPlan(impact) {
  var row=climateChainRepresentative(impact);
  if(!row) throw new Error('NO_SUCCESSOR_PACKAGE_FOR_ANCHOR');
  var oldPack=COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
  var nextPack=COMPILER_REGISTRY['NAFT-SYNTHETIC@2'];
  var claimHash=hex32(digestText(row.claim_id));

  return {
    schema:'naft-climatechain-anchor-plan-1',
    purpose:'External provenance witness for versioned MRV packages',
    boundary:'Prepared transaction arguments only. NOT_SUBMITTED means no blockchain transaction has been sent by this browser demo. Anchoring does not certify climate impact or issue a carbon credit.',
    contract:'NaFTMRVAnchor',
    function:'anchorPackage(bytes32,bytes32,bytes32,bytes32)',
    chain_status:'NOT_SUBMITTED',
    formal_certification:false,
    carbon_credit_issued:false,
    claim_id:row.claim_id,
    transition:'NAFT-SYNTHETIC@1 -> @2',
    genesis:{
      claim_id_hash:claimHash,
      package_hash:hex32(row.previous_package_hash),
      methodology_hash:hex32(hashObject(oldPack)),
      previous_package_hash:ZERO_BYTES32
    },
    successor:{
      claim_id_hash:claimHash,
      package_hash:hex32(row.successor.package_hash),
      methodology_hash:hex32(hashObject(nextPack)),
      previous_package_hash:hex32(row.previous_package_hash)
    },
    lineage_checks:{
      successor_supersedes_previous:!!(row.successor.document&&row.successor.document.provenance_graph&&row.successor.document.provenance_graph.edges.some(function(edge) {
        return edge.type==='supersedes';
      })),
      previous_package_stale:row.previous_package_stale===true,
      requires_reverification:row.requires_reverification===true
    }
  };
}

function climateMetric(label,value,note) {
  return '<div class="metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note||'')+'</small></div>';
}

function climateRoleCard(item) {
  return '<article class="card"><span class="eyebrow">'+esc(item.role)+'</span><p>'+esc(item.need)+'</p></article>';
}

function climateChainHeader() {
  return '<header class="reviewer-header"><a class="reviewer-home" href="#/methodologies">Research UI</a><span class="eyebrow">IEEE ClimateChain Hackathon · NaFT</span><h1>Version-Aware Climate MRV</h1><p>Carbon markets need evidence that survives methodology change.</p></header>';
}

function pgClimateChainDemo() {
  var impact=ClimateChainDemo.impact;
  var reference=climateReferenceScenario();
  var trust=climateTrustModel();
  var testnet=climateTestnetStatus();
  var out='<section class="card reviewer-hero"><span class="eyebrow">Carbon Markets & Emissions Transparency</span>'+
    '<h2>When climate MRV rules change, which existing claims actually need re-verification?</h2>'+
    '<p><b>NaFT turns methodology change into a traceable engineering decision:</b> re-verify the claims whose semantics changed, preserve the unaffected claims, and create an auditable successor lineage.</p>'+
    climateTestnetStatusCard(testnet)+
    '<div class="climate-proof-strip"><div class="climate-proof"><strong>5</strong><span>change classes</span></div><div class="climate-proof"><strong>614</strong><span>adversarial cases</span></div><div class="climate-proof"><strong>0 FN</strong><span>tested synthetic state space</span></div></div>'+
    '<div class="reviewer-boundary"><b>Research prototype boundary.</b> The impact experiment uses synthetic methodology versions and synthetic claims. It does not certify emission reductions, issue credits, or connect to an external registry.</div>'+
    '<div class="flow"><span>Rule changes</span><span>→</span><span>Trace dependencies</span><span>→</span><span>Re-verify affected claims</span><span>→</span><span>Anchor lineage</span></div>'+
    button('Run 100-claim methodology update','climatechain-run',false)+
    '<p class="muted">Scenario: NAFT-SYNTHETIC@1 → @2 adds requirements that apply only to intensive claims.</p></section>';

  out+='<section class="card climate-reference"><span class="eyebrow">Real-world reference context</span><h2>Why this problem exists outside the demo</h2>'+
    '<p>NaFT is motivated by evidence-heavy climate programs such as <b>'+esc(reference.domain)+'</b>. The repository retains an '+esc(reference.methodology)+' in which evidence categories include:</p>'+
    '<div class="grid">'+reference.evidence_examples.map(function(item){return '<div class="metric"><span>Evidence</span><strong style="font-size:18px">'+esc(item)+'</strong></div>';}).join('')+'</div>'+
    '<div class="notice"><b>Boundary:</b> '+esc(reference.source_status)+' '+esc(reference.experiment_boundary)+'</div></section>';

  if(impact) {
    var c=impact.counts,row=climateChainRepresentative(impact);
    out+='<section class="card climate-impact"><span class="eyebrow">Selective re-verification</span><h2>Impact analysis result</h2>'+
      '<div class="metric-grid">'+
      climateMetric('Candidate claims',c.potentially_affected,'same methodology family')+
      climateMetric('Re-verify',c.require_reverification,'semantic dependency changed')+
      climateMetric('Unaffected',c.UNAFFECTED,'no successor generated')+
      climateMetric('Auto re-evaluated',c.AUTO_REEVALUATED,'deterministic successor')+
      climateMetric('New evidence needed',c.EVIDENCE_REQUIRED,'fail closed')+
      '</div>'+
      '<div class="notice"><b>30 / 70 is fixture-derived, not a performance claim.</b> The synthetic workload contains 70 standard and 30 intensive claims. Changing the workload changes this ratio.</div>'+
      '<h3>Representative lineage</h3>'+
      (row?'<div class="flow"><span>'+esc(row.claim_id)+'</span><span>old package '+esc(row.previous_package_hash.slice(0,12))+'…</span><span>→ re-verify →</span><span>successor '+esc(row.successor.package_hash.slice(0,12))+'…</span></div>'+
      '<details><summary>Why this claim changed</summary>'+jsonView({status:row.status,reasons:row.reasons,affected_nodes:row.affected_nodes,supersedes:row.successor.document.provenance_graph.edges.filter(function(e){return e.type==='supersedes';})})+'</details>':'')+
      button('Prepare blockchain anchor plan','climatechain-anchor-plan',!row)+
      button('Download impact JSON','climatechain-export-impact',false)+
      '</section>';
  }

  if(ClimateChainDemo.anchorPlan) {
    var plan=ClimateChainDemo.anchorPlan;
    out+='<section class="card climate-anchor"><span class="eyebrow">Blockchain provenance witness</span><h2>Two-step anchor plan</h2>'+
      '<p>The contract stores package hashes and lineage only. MRV logic remains deterministic and off-chain.</p>'+
      '<div class="flow"><span>Genesis package</span><span>→</span><span>Successor package</span><span>→</span><span>Claim head</span></div>'+
      '<p><b>Browser planner status:</b> '+esc(plan.chain_status)+' (this button prepares arguments locally; it never sends a transaction).</p>'+
      climateTestnetStatusCard(testnet)+
      (testnet.status==='VERIFIED_TESTNET'
        ? '<div class="reviewer-boundary"><b>Previously anchored on Ethereum Sepolia · '+esc(plan.claim_id)+'.</b> '+
          'P1 package <code>'+esc(plan.genesis.package_hash.slice(0,16))+'…</code> → '+
          'P2 package <code>'+esc(plan.successor.package_hash.slice(0,16))+'…</code>. '+
          'The independent read-only verifier reconstructed this lineage from the deployment source commit and checked bytecode, transaction calldata, events and final head. '+
          'The browser itself does not broadcast a transaction. Blockchain witnesses lineage; it cannot certify climate truth.</div>'
        : '<div class="notice"><b>No public testnet transaction recorded.</b> This browser demo only prepares exact <code>bytes32</code> arguments for <code>NaFTMRVAnchor.anchorPackage</code>.</div>')+
      '<details open><summary>Prepared transaction arguments</summary>'+jsonView(plan)+'</details>'+
      button('Download anchor plan JSON','climatechain-export-anchor',false)+
      '</section>';
  }

  out+='<section class="card climate-trust"><span class="eyebrow">Trust model</span><h2>External witness, not climate truth</h2>'+
    '<div class="grid"><article><h3>On-chain</h3><p>'+trust.on_chain.map(esc).join(' · ')+'</p></article>'+
    '<article><h3>Off-chain</h3><p>'+trust.off_chain.map(esc).join(' · ')+'</p></article>'+
    '<article><h3>Never claimed</h3><p>'+trust.never_claimed.map(esc).join(' · ')+'</p></article></div>'+
    '<p><b>'+esc(trust.design_rule)+'</b> The anchor contract rejects duplicate package hashes, missing parents and lineage forks.</p></section>';

  out+='<section class="card climate-adoption"><span class="eyebrow">Practical adoption</span><h2>Who uses NaFT?</h2><div class="grid">'+
    climateAdoptionRoles().map(climateRoleCard).join('')+
    '</div><div class="flow"><span>Project aggregator</span><span>→</span><span>NaFT compiler</span><span>→</span><span>Verification operator</span><span>→</span><span>Registry / program</span></div>'+
    '<p class="muted">NaFT is infrastructure for evidence and verification operations; it is not a consumer carbon-credit wallet.</p></section>';

  out+='<section class="card climate-engineering"><span class="eyebrow">Engineering evidence</span><h2>Designed to fail closed</h2>'+
    '<div class="grid">'+
    climateMetric('Adversarial cases','614','independent full-recomputation oracle')+
    climateMetric('False negatives','0','within the tested synthetic state space')+
    climateMetric('Change classes','5','methodology · evidence · parameter · field · activity')+
    '</div>'+
    '<p>Unknown institutional requirements remain unsupported; missing evidence does not become a pass; stale human decisions do not silently survive input or methodology changes.</p>'+
    '<p class="muted">These are engineering results, not field accuracy, measured cost savings, verifier acceptance, or universal proof.</p></section>';

  return out+'<p role="status">'+esc(ClimateChainDemo.message)+'</p>';
}

function handleClimateChainAction(action) {
  if(action==='climatechain-run') {
    ClimateChainDemo.impact=runClimateChainImpact();
    ClimateChainDemo.anchorPlan=null;
    ClimateChainDemo.message='Synthetic 100-claim impact analysis completed.';
  }
  if(action==='climatechain-anchor-plan') {
    if(!ClimateChainDemo.impact) throw new Error('RUN_IMPACT_ANALYSIS_FIRST');
    ClimateChainDemo.anchorPlan=buildClimateChainAnchorPlan(ClimateChainDemo.impact);
    ClimateChainDemo.message='Anchor arguments prepared locally; no transaction broadcast from this browser. Public Sepolia reference evidence is shown separately.';
  }
  if(action==='climatechain-export-impact'&&ClimateChainDemo.impact) {
    downloadJSON(canonicalize(ClimateChainDemo.impact),'naft-climatechain-impact.json');
  }
  if(action==='climatechain-export-anchor'&&ClimateChainDemo.anchorPlan) {
    downloadJSON(canonicalize(ClimateChainDemo.anchorPlan),'naft-climatechain-anchor-plan.json');
  }
}
