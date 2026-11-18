import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

/* P79 gate: any committed data-bearing file must be registered in the rights ledger exactly once. */
const ledger=JSON.parse(readFileSync('research/p79-data-rights-ledger-v1.json','utf8'));
assert.equal(ledger.schema,'naft-p79-data-rights-ledger-v1');
const kinds=Object.keys(ledger.content_kind_values),rights=Object.keys(ledger.rights_status_values);
const ids=new Set();
const entries=ledger.entries.map(e=>{
 assert.ok(/^[a-z0-9-]+$/.test(e.id)&&!ids.has(e.id),'entry id '+e.id);ids.add(e.id);
 assert.ok(kinds.includes(e.content_kind)&&rights.includes(e.rights_status),'enums '+e.id);
 assert.ok(['NONE','LOW','MEDIUM','HIGH'].includes(e.risk)&&e.origin&&e.action,'fields '+e.id);
 // Honesty: SYNTHETIC rights only for synthetic content, and nothing third-party may claim a verified state.
 assert.equal(e.content_kind==='SYNTHETIC',e.rights_status==='SYNTHETIC','synthetic consistency '+e.id);
 if(e.content_kind==='RAW_OR_ROW_LEVEL'&&e.rights_status==='NOT_VERIFIED')assert.equal(e.risk,'HIGH','row-level unverified data must be HIGH risk '+e.id);
 return {...e,re:new RegExp(e.pattern)};
});

let tracked;
try{tracked=execFileSync('git',['ls-files'],{encoding:'utf8'}).split('\n').filter(Boolean);}
catch{console.log('P79_DATA_RIGHTS_LEDGER_SKIPPED_NO_GIT');process.exit(0);}

const DATA_SCOPE=[
 /^data\//,/^fixtures\//,
 /^research\/.*\.(csv|tsv|txt|geojson|geojsons|ndjson|tif|tiff|zip|xlsx|xls|gpkg|shp|dbf|nc)$/i,
 /^research\/p\d+-[a-z]+-soil-shapefile-source-v1\.json$/,/^research\/p76-national-soil-evidence-registry-v1\.json$/,/^research\/p2[1-5]-jaxa-lulc-.*\.json$/,
 /^src\/gx-[a-z]+-soil\.js$/,/^src\/gx-national-soil-registry\.js$/,/^src\/gx-(ch4-.*|rice-ch4-asia|jaxa-landcover-2024|rice-history|2025-prefecture|japan-crop-history|prefecture-candidates)\.js$/,/^src\/gimje-.*\.js$/
];
const LARGE=256*1024;
const scoped=tracked.filter(f=>DATA_SCOPE.some(r=>r.test(f))||(!f.startsWith('docs/assets/')&&!f.startsWith('.git')&&statSync(f).size>LARGE));
const unregistered=[],ambiguous=[],used=new Map();
for(const f of scoped){
 const hits=entries.filter(e=>e.re.test(f));
 if(!hits.length)unregistered.push(f);else if(hits.length>1)ambiguous.push(f+' → '+hits.map(h=>h.id).join(','));
 else used.set(hits[0].id,(used.get(hits[0].id)||0)+1);
}
assert.deepEqual(unregistered,[],'Data-bearing files without a rights-ledger entry (add one to research/p79-data-rights-ledger-v1.json)');
assert.deepEqual(ambiguous,[],'Files matching more than one ledger entry');
const stale=entries.filter(e=>!used.has(e.id)).map(e=>e.id);
assert.deepEqual(stale,[],'Ledger entries matching no committed file');
// Soil: one ledger file and one UI module per prefecture.
assert.equal(used.get('soil-ledgers'),47);assert.equal(used.get('soil-ui-modules'),47);
const high=entries.filter(e=>e.risk==='HIGH');
const highBytes=tracked.filter(f=>high.some(e=>e.re.test(f))).reduce((a,f)=>a+statSync(f).size,0);
console.log('NAFT_P79_DATA_RIGHTS_LEDGER_PASS',JSON.stringify({scoped_files:scoped.length,entries:entries.length,high_risk_entries:high.map(e=>e.id),high_risk_bytes:highBytes,
 not_verified_files:tracked.filter(f=>entries.some(e=>e.rights_status==='NOT_VERIFIED'&&e.re.test(f))).length}));
