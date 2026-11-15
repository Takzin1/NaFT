'use strict';
/**
 * NaFT Evidence Intelligence — version and scope registers.
 *
 * - Standards scope register: which accounting context a referenced standard belongs to.
 * - Coefficient (factor) registry: immutable `factor_id@version` entries with effective
 *   periods and supersession, resolved deterministically and fail closed.
 * - Methodology candidates by date (advisory; a Claim still pins an exact `id@version`).
 * - Evidence revision lineage.
 *
 * Data only + pure functions. Requires canonicalize/hashObject/isoDay/clone/validatePack/
 * compilerKey/deepFreeze from the Core and Compiler, and evidence-intel-calc.js.
 */
var EI_ACCOUNTING_CONTEXTS = Object.freeze({
  CORPORATE_INVENTORY: 'Entity-level annual GHG inventory accounting and reporting (Scope 1/2/3). Not implemented by NaFT.',
  PROJECT_CREDITING: 'Activity/project-level baseline-versus-project quantification under a crediting programme methodology. NaFT performs reference pre-checks only; certification belongs to the programme.',
  SYNTHETIC_ENGINEERING: 'Engineered fixture without institutional meaning.'
});
var EI_INTENDED_USES = Object.freeze(['ENGINEERING_RESEARCH', 'PROJECT_CREDITING_PRECHECK', 'CORPORATE_INVENTORY']);

// Scope reference only. `primary_text_verified:false` means original bytes were not pinned
// in this repository; statements are limited to what the cited check could establish.
var EI_STANDARDS_SCOPE = Object.freeze([
  {
    id: 'GHGP-LSRS', version: '1.1', title: 'GHG Protocol Land Sector and Removals Standard',
    publisher: 'GHG Protocol (WRI / WBCSD)', accounting_context: 'CORPORATE_INVENTORY',
    version_history: [{version: '1.0', published: '2026-01-30'}, {version: '1.1', published: '2026-06', note: 'Minor non-substantive edits to v1.0; exact day unconfirmed'}],
    effective_from: '2027-01-01',
    scope_summary: 'Corporate (entity-level) annual inventory accounting and reporting of land-sector emissions and removals; a supplement to the Corporate Standard and the Scope 3 Standard.',
    out_of_scope_for_naft_use: ['project- or activity-level credit quantification', 'issuance or certification of carbon credits', 'J-Credit methodology eligibility'],
    credit_relation: 'Secondary summaries state that purchased or sold credits are reported separately from the physical inventory and are not netted against it.',
    source_url: 'https://ghgprotocol.org/sites/default/files/2026-06/Land-Sector-and-Removals-Standard-v1.1.pdf',
    source_hash: 'UNKNOWN', primary_text_verified: false,
    verification: 'SEARCH_INDEX_AND_SECONDARY_SUMMARIES_ONLY', checked_at: '2026-11-14',
    naft_use: 'SCOPE_REFERENCE_ONLY', executable: false
  },
  {
    id: 'J-CREDIT-AG-005', version: '3.1-reference', title: 'J-Credit methodology AG-005 (public-comment reference)',
    publisher: 'J-Credit Scheme', accounting_context: 'PROJECT_CREDITING',
    scope_summary: 'Activity-level methodology of a crediting programme. Latest adoption unconfirmed; coefficients CONFIG_REQUIRED.',
    source_url: 'https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460',
    source_hash: 'f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050', primary_text_verified: true,
    verification: 'REPOSITORY_PINNED_HASH', checked_at: '2026-09-20',
    naft_use: 'REFERENCE_PRECHECK_RESULT_NULL', executable: false
  },
  {
    id: 'J-CREDIT-AG-004', version: 'UNKNOWN', title: 'J-Credit methodology AG-004',
    publisher: 'J-Credit Scheme', accounting_context: 'PROJECT_CREDITING',
    scope_summary: 'UNKNOWN / UNSUPPORTED in NaFT. No Executable Pack.',
    source_url: 'https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000298548',
    source_hash: 'UNKNOWN', primary_text_verified: false,
    verification: 'NOT_PINNED', checked_at: '2026-09-23',
    naft_use: 'UNSUPPORTED', executable: false
  },
  {
    id: 'NAFT-SYNTHETIC', version: 'engineering', title: 'NaFT synthetic engineering protocols',
    publisher: 'NaFT repository', accounting_context: 'SYNTHETIC_ENGINEERING',
    scope_summary: 'Synthetic rules and data for engineering tests. No institutional requirement, inventory or credit meaning.',
    source_url: 'urn:naft:synthetic', source_hash: 'SYNTHETIC', primary_text_verified: true,
    verification: 'DECLARED_IN_REPOSITORY', checked_at: '2026-11-14',
    naft_use: 'ENGINEERING_TEST', executable: true
  }
].map(function(x) { return deepFreeze(x); }));

function eiPackAccountingContext(pack) {
  if(pack.accounting_context !== undefined) {
    if(!Object.prototype.hasOwnProperty.call(EI_ACCOUNTING_CONTEXTS, pack.accounting_context)) throw new Error('EI_UNKNOWN_ACCOUNTING_CONTEXT');
    return pack.accounting_context;
  }
  if(pack.status === 'SYNTHETIC') return 'SYNTHETIC_ENGINEERING';
  if(/^AG-\d+$/.test(pack.methodology_id)) return 'PROJECT_CREDITING';
  return 'UNKNOWN';
}
/** Inventory accounting and credit certification are different activities; never relabel one as the other. */
function eiAssertIntendedUse(context, intendedUse) {
  if(EI_INTENDED_USES.indexOf(intendedUse) < 0) throw new Error('EI_UNKNOWN_INTENDED_USE');
  if(intendedUse === 'CORPORATE_INVENTORY') throw new Error('EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED');
  if(intendedUse === 'PROJECT_CREDITING_PRECHECK' && context !== 'PROJECT_CREDITING') throw new Error('EI_ACCOUNTING_CONTEXT_MISMATCH');
  return true;
}
function eiContextStatement(context) {
  var base = 'This output is neither a GHG inventory under a corporate accounting standard nor a carbon-credit certification.';
  if(context === 'PROJECT_CREDITING') return base + ' It is a reference pre-check against a crediting-programme methodology; the certified result is null.';
  if(context === 'SYNTHETIC_ENGINEERING') return base + ' It is a synthetic engineering result without institutional meaning.';
  return base + ' The accounting context of the methodology is UNKNOWN.';
}

// ---- Coefficient (factor) registry -------------------------------------------------
function eiFactorKey(f) { return f.factor_id + '@' + f.version; }
function eiValidateFactor(f) {
  ['factor_id', 'version', 'value', 'unit_label', 'status', 'effective_from', 'effective_to', 'source_url', 'source_hash', 'source_checked_at', 'supersedes'].forEach(function(k) {
    if(!f || !Object.prototype.hasOwnProperty.call(f, k)) throw new Error('EI_FACTOR_FIELD_REQUIRED:' + k);
  });
  if(typeof f.factor_id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(f.factor_id) || typeof f.version !== 'string' || !f.version || f.version.indexOf('@') >= 0) throw new Error('EI_INVALID_FACTOR_ID');
  if(['SYNTHETIC', 'REFERENCE', 'CONFIG_REQUIRED'].indexOf(f.status) < 0) throw new Error('EI_UNSUPPORTED_FACTOR_STATUS');
  if(f.status === 'SYNTHETIC' && (typeof f.value !== 'string' || !eiIsDecimal(f.value) || eiDecimal(f.value).n < 0n)) throw new Error('EI_INVALID_FACTOR_VALUE');
  if(f.supersedes !== null && typeof f.supersedes !== 'string') throw new Error('EI_INVALID_FACTOR_SUPERSEDES');
  if(f.unit !== undefined && !eiUnitValid(f.unit)) throw new Error('EI_INVALID_FACTOR_UNIT');
  return f;
}
function createFactorRegistry(entries) {
  var map = Object.create(null);
  entries.forEach(function(f) {
    eiValidateFactor(f);
    var key = eiFactorKey(f);
    if(map[key]) throw new Error('EI_DUPLICATE_FACTOR_VERSION');
    map[key] = deepFreeze(clone(f));
  });
  var successors = Object.create(null);
  Object.keys(map).forEach(function(key) {
    var f = map[key];
    if(f.supersedes === null) return;
    var parent = map[f.supersedes];
    if(!parent || parent.factor_id !== f.factor_id) throw new Error('EI_FACTOR_LINEAGE_BROKEN');
    if(successors[f.supersedes]) throw new Error('EI_FACTOR_LINEAGE_CONFLICT');
    successors[f.supersedes] = key;
  });
  Object.keys(map).forEach(function(key) {
    var seen = new Set(), cursor = map[key];
    while(cursor && cursor.supersedes !== null) {
      if(seen.has(eiFactorKey(cursor))) throw new Error('EI_FACTOR_LINEAGE_CONFLICT');
      seen.add(eiFactorKey(cursor)); cursor = map[cursor.supersedes];
    }
  });
  return Object.freeze(map);
}
function eiFactorRegistryHash(registry) {
  return hashObject(Object.keys(registry).sort().map(function(k) { return [k, hashObject(registry[k])]; }));
}
function eiPeriodCovers(from, to, start, end) {
  return isoDay(from) !== null && isoDay(to) !== null && isoDay(start) !== null && isoDay(end) !== null && from <= start && end <= to && start <= end;
}
/**
 * Exactly one version must cover the whole period after removing versions superseded by
 * another covering version. A period straddling two versions is NOT split: it fails closed.
 */
function resolveFactor(registry, factorId, start, end) {
  var covering = Object.keys(registry).sort().filter(function(k) {
    var f = registry[k];
    return f.factor_id === factorId && eiPeriodCovers(f.effective_from, f.effective_to, start, end);
  });
  var superseded = new Set(covering.map(function(k) { return registry[k].supersedes; }).filter(function(k) { return k !== null && covering.indexOf(k) >= 0; }));
  var candidates = covering.filter(function(k) { return !superseded.has(k); });
  if(candidates.length === 1) return {status: 'RESOLVED', factor_id: factorId, key: candidates[0], version: registry[candidates[0]].version, superseded: Array.from(superseded).sort()};
  var known = Object.keys(registry).some(function(k) { return registry[k].factor_id === factorId; });
  return {status: !known ? 'UNKNOWN_FACTOR' : candidates.length ? 'AMBIGUOUS' : 'NOT_EFFECTIVE', factor_id: factorId, key: null, version: null, candidates: candidates};
}
function eiFactorLineage(registry, factorId) {
  return Object.keys(registry).sort().filter(function(k) { return registry[k].factor_id === factorId; }).map(function(k) {
    var f = registry[k];
    return {key: k, version: f.version, status: f.status, effective_from: f.effective_from, effective_to: f.effective_to, supersedes: f.supersedes, factor_hash: hashObject(f)};
  });
}

// ---- Methodology candidates (advisory) ---------------------------------------------
/** Lists versions effective for a period. UNKNOWN periods never match. Claims still pin an exact key. */
function eiPackCandidates(registry, methodologyId, start, end) {
  var covering = Object.keys(registry).sort().filter(function(k) {
    var p = registry[k];
    return p.methodology_id === methodologyId && eiPeriodCovers(p.effective_from, p.effective_to, start, end);
  });
  var superseded = new Set(covering.map(function(k) { return registry[k].supersedes; }).filter(function(k) { return typeof k === 'string' && covering.indexOf(k) >= 0; }));
  var candidates = covering.filter(function(k) { return !superseded.has(k); });
  return {methodology_id: methodologyId, period: {start: start, end: end}, candidates: candidates,
    status: candidates.length === 1 ? 'SINGLE_CANDIDATE' : candidates.length ? 'AMBIGUOUS_PIN_REQUIRED' : 'NO_EFFECTIVE_VERSION',
    note: 'Advisory only. A Claim must pin an exact methodology_id@version.'};
}
function eiVersionCatalog(packs, factors) {
  return {
    schema: 'naft-version-catalog-1',
    methodologies: Object.keys(packs).sort().map(function(k) {
      var p = packs[k];
      return {key: k, pack_hash: hashObject(p), rule_pack_version: p.rule_pack_version, status: p.status, effective_from: p.effective_from, effective_to: p.effective_to,
        supersedes: typeof p.supersedes === 'string' ? p.supersedes : null, accounting_context: eiPackAccountingContext(p), source: {url: p.source_url, hash: p.source_hash, checked_at: p.source_checked_at}};
    }),
    factors: Object.keys(factors).sort().map(function(k) {
      var f = factors[k];
      return {key: k, factor_hash: hashObject(f), status: f.status, value: f.value, unit_label: f.unit_label, effective_from: f.effective_from, effective_to: f.effective_to, supersedes: f.supersedes, source: {url: f.source_url, hash: f.source_hash, checked_at: f.source_checked_at}};
    }),
    factor_registry_hash: eiFactorRegistryHash(factors)
  };
}

// ---- Evidence revision lineage ------------------------------------------------------
function eiLineageAppend(lineage, contentHash, metaHash, changeHash) {
  var prev = lineage.length ? lineage[lineage.length - 1] : null;
  var entry = {revision: lineage.length + 1, content_hash: contentHash, meta_hash: metaHash, supersedes: prev ? prev.revision_hash : null, change_hash: changeHash || null};
  entry.revision_hash = hashObject(entry);
  return lineage.concat([entry]);
}
function eiLineageValid(lineage) {
  var prev = null;
  return Array.isArray(lineage) && lineage.every(function(e, i) {
    var body = Object.assign({}, e); delete body.revision_hash;
    var ok = e.revision === i + 1 && e.supersedes === (prev ? prev.revision_hash : null) && e.revision_hash === hashObject(body);
    prev = e; return ok;
  });
}

// ---- Extended synthetic Packs (exact arithmetic + versioned coefficient) -------------
var EI_PACKS = [
  {
    methodology_id: 'NAFT-SYNTHETIC-EI', methodology_version: '1', rule_pack_version: 'synthetic-ei-rules-1',
    effective_from: '2026-01-01', effective_to: '2026-12-31', source_url: 'urn:naft:synthetic:ei-protocol:1',
    source_hash: 'SYNTHETIC', source_checked_at: '2026-11-14', status: 'SYNTHETIC', provenance: 'synthetic',
    accounting_context: 'SYNTHETIC_ENGINEERING', supersedes: null,
    scope: 'Engineering experiment for exact arithmetic, versioned coefficients and fine-grained dependencies. Not an institutional methodology.',
    parameters: {minimum_days: {value: 7, status: 'SYNTHETIC'}, synthetic_factor: {factor_ref: 'SYN-EF', status: 'SYNTHETIC'}, scale: {value: '0.001', status: 'SYNTHETIC'}, unused: {value: 1, status: 'SYNTHETIC'}},
    evidence_requirements: {record: {category: 'record', required: true}, sensor: {category: 'sensor', required: true, when: {path: 'activity.stratum', equals: 'intensive'}}},
    rules: {duration: {op: 'gte', input: 'activity.days', parameter: 'minimum_days'}, area: {op: 'gt', input: 'field.area_ha', value: 0}},
    calculation_spec: {operation: 'expression', unit: 'synthetic-index', inputs: ['field.area_ha', 'activity.days'], parameters: ['synthetic_factor', 'scale'],
      unit_dimensions: {index: 1},
      expression: {op: 'round', dp: 6, mode: 'HALF_EVEN', args: [{op: 'mul', args: [
        {input: 'field.area_ha', unit: {ha: 1}}, {input: 'activity.days', unit: {day: 1}},
        {param: 'synthetic_factor', unit: {index: 1, ha: -1, day: -1}}, {param: 'scale', unit: {}}]}]}},
    exceptions: {expert: {input: 'activity.expert_case', equals: true, disposition: 'HUMAN_REVIEW_REQUIRED'}},
    unsupported_conditions: {special_process: {input: 'activity.special_process', equals: true}}
  },
  {
    methodology_id: 'NAFT-SYNTHETIC-EI', methodology_version: '2', rule_pack_version: 'synthetic-ei-rules-2',
    effective_from: '2026-01-01', effective_to: '2026-12-31', source_url: 'urn:naft:synthetic:ei-protocol:2',
    source_hash: 'SYNTHETIC', source_checked_at: '2026-11-14', status: 'SYNTHETIC', provenance: 'synthetic',
    accounting_context: 'SYNTHETIC_ENGINEERING', supersedes: 'NAFT-SYNTHETIC-EI@1',
    scope: 'Engineered version transition of the exact-arithmetic protocol. Not an official revision of any methodology.',
    parameters: {minimum_days: {value: 7, status: 'SYNTHETIC'}, intensive_min_days: {value: 9, status: 'SYNTHETIC'}, synthetic_factor: {factor_ref: 'SYN-EF', status: 'SYNTHETIC'}, scale: {value: '0.001', status: 'SYNTHETIC'}, unused: {value: 1, status: 'SYNTHETIC'}},
    evidence_requirements: {record: {category: 'record', required: true}, sensor: {category: 'sensor', required: true, when: {path: 'activity.stratum', equals: 'intensive'}}, photo: {category: 'photo', required: true, when: {path: 'activity.stratum', equals: 'intensive'}}},
    rules: {duration: {op: 'gte', input: 'activity.days', parameter: 'minimum_days'}, area: {op: 'gt', input: 'field.area_ha', value: 0}, extended: {op: 'gte', input: 'activity.days', parameter: 'intensive_min_days', when: {path: 'activity.stratum', equals: 'intensive'}}},
    calculation_spec: {operation: 'expression', unit: 'synthetic-index', inputs: ['field.area_ha', 'activity.days'], parameters: ['synthetic_factor', 'scale'],
      unit_dimensions: {index: 1},
      expression: {op: 'round', dp: 6, mode: 'HALF_EVEN', args: [{op: 'mul', args: [
        {input: 'field.area_ha', unit: {ha: 1}}, {input: 'activity.days', unit: {day: 1}},
        {param: 'synthetic_factor', unit: {index: 1, ha: -1, day: -1}}, {param: 'scale', unit: {}}]}]}},
    exceptions: {expert: {input: 'activity.expert_case', equals: true, disposition: 'HUMAN_REVIEW_REQUIRED'}},
    unsupported_conditions: {special_process: {input: 'activity.special_process', equals: true}}
  }
];
EI_PACKS.forEach(function(p) { p.source_hash_scope = 'canonical_pack_without_source_hash'; delete p.source_hash; p.source_hash = hashObject(p); });

var EI_FACTORS = [
  {factor_id: 'SYN-EF', version: '2026.1', value: '2.5', unit_label: 'index/ha/day', unit: {index: 1, ha: -1, day: -1}, status: 'SYNTHETIC',
    effective_from: '2026-01-01', effective_to: '2026-12-31', source_url: 'urn:naft:synthetic:factor:SYN-EF:2026.1', source_hash: 'SYNTHETIC', source_checked_at: '2026-11-14', supersedes: null,
    note: 'Synthetic coefficient. Not an emission factor.'},
  // Explicit absence: no AG-005 coefficient is invented. Any Pack bound to this entry fails closed.
  {factor_id: 'AG005-EF', version: 'UNKNOWN', value: 'UNKNOWN', unit_label: 'UNKNOWN', status: 'CONFIG_REQUIRED',
    effective_from: 'UNKNOWN', effective_to: 'UNKNOWN', source_url: 'UNKNOWN', source_hash: 'UNKNOWN', source_checked_at: '2026-11-14', supersedes: null,
    note: 'CONFIG REQUIRED: applicable coefficients and adoption are unconfirmed.'}
];
// A synthetic correction of the same period, used to demonstrate coefficient re-verification.
var EI_FACTOR_CORRECTION = {factor_id: 'SYN-EF', version: '2026.2', value: '2.4', unit_label: 'index/ha/day', unit: {index: 1, ha: -1, day: -1}, status: 'SYNTHETIC',
  effective_from: '2026-01-01', effective_to: '2026-12-31', source_url: 'urn:naft:synthetic:factor:SYN-EF:2026.2', source_hash: 'SYNTHETIC', source_checked_at: '2026-11-14', supersedes: 'SYN-EF@2026.1',
  note: 'Synthetic corrected coefficient superseding 2026.1 for the same period.'};

var EI_FACTOR_REGISTRY = createFactorRegistry(EI_FACTORS);
var EI_FACTOR_REGISTRY_NEXT = createFactorRegistry(EI_FACTORS.concat([EI_FACTOR_CORRECTION]));
var EI_PACK_REGISTRY = createMethodologyRegistry(VERSIONED_PACKS.concat(EI_PACKS));
function eiDefaultContext() { return {packs: EI_PACK_REGISTRY, factors: EI_FACTOR_REGISTRY}; }
