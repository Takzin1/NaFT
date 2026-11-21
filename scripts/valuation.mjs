#!/usr/bin/env node
import {readFile,stat} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {historicalAg005Preview} from './p9-prefecture-rice-source-guard.mjs';
import {importBlueCarbonBundle} from '../src/edition-bridge.mjs';
import {valueAsset,replay,sha256} from '../src/environmental-valuation.mjs';
import {applyCompilerImpact,compilerAsset,reconcile} from '../src/valuation-lineage.mjs';
import {scenario} from '../src/valuation-demo.mjs';

async function read(path) {
  if ((await stat(path)).size > 8*1024*1024) throw new Error('INPUT_SIZE');
  return JSON.parse(await readFile(path,'utf8'));
}
export function agricultureAsset(input, id) {
  const r = historicalAg005Preview(input);
  const pass = r.drainage_duration_7day_precheck === 'CANDIDATE_ONLY_REQUIRE_RECORD_REVIEW';
  return {asset_id:id,asset_category:'AGRICULTURE',methodology_id:'AG-005',methodology_version:r.method_version,
    evidence_package_sha256:r.input_sha256,source_record_sha256:r.receipt_sha256,
    verification_status:pass ? 'REFERENCE' : 'UNSUPPORTED',quantity:pass ? String(r.display_preview_difference_tco2e) : null,
    quantity_unit:'tCO2e',rights_status:'UNVERIFIED'};
}
export function coastalAsset(bundle) {
  const r = importBlueCarbonBundle(bundle), ready = r.claims.every(c => c.readiness === 'RESEARCH_ESTIMATE');
  return {asset_id:r.project_id,asset_category:'BLUE_CARBON',methodology_id:r.methodology.id,
    methodology_version:r.methodology.version,evidence_package_sha256:r.source_package_hash,source_record_sha256:r.receipt_hash,
    verification_status:ready ? 'REFERENCE' : 'EVIDENCE_REQUIRED',quantity:ready ? String(r.total_research_estimate_tco2e) : null,
    quantity_unit:'tCO2e',rights_status:'UNVERIFIED'};
}
// FO-001 field estimates are externally supplied research scenarios. A stand area
// or a tree count cannot be converted without a separately established basis.
export async function forestAsset(record) {
  if (record.schema !== 'naft-forest-research-estimate/1' || record.methodology_id !== 'FO-001' ||
      record.formal_certification !== false) throw new Error('FOREST_RECORD');
  return {asset_id:record.stand_id,asset_category:'FORESTRY',methodology_id:record.methodology_id,
    methodology_version:record.methodology_version,evidence_package_sha256:record.evidence_package_sha256,
    source_record_sha256:await sha256(record),verification_status:record.verification_status,
    quantity:record.quantity,quantity_unit:record.quantity_unit,rights_status:record.rights_status};
}
async function run([cmd,...args]) {
  const now = () => new Date().toISOString();
  switch (cmd) {
    case 'demo': {
      const at = args[0] ?? now();
      const raw = await read(new URL('../fixtures/p9-synthetic-ag005-v1-preview.json',import.meta.url));
      return valueAsset(scenario(agricultureAsset(raw,'P9-DEMO-07'),at),at);
    }
    case 'quote': return valueAsset(await read(args[0]),args[1] ?? now());
    case 'replay': return replay(await read(args[0]));
    case 'ledger': return reconcile(args[0] === '-' ? [] : await read(args[0]),await read(args[1]),args[2] ?? now());
    case 'impact': return applyCompilerImpact(await read(args[0]),await read(args[1]));
    case 'ag005': return agricultureAsset(await read(args[0]),args[1]);
    case 'forest': return forestAsset(await read(args[0]));
    case 'blue': return coastalAsset(await read(args[0]));
    case 'compiler': return compilerAsset(await read(args[0]));
    default: throw new Error('Use demo [UTC], quote INPUT [UTC], replay RECEIPT, ledger HISTORY|- INPUTS [UTC], impact INPUTS REPORT, ag005 FILE ID, forest|blue|compiler FILE');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await run(process.argv.slice(2)),null,2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
