// Research quote protocol v1. All monetary operands cross the wire as decimal strings.
export const SCHEMA = 'naft-environmental-valuation/1';
export const LABEL = '仮定に基づく参考値';
const MICRO = 1000000n;
const RATE = 10000n;
const HASH = /^[0-9a-f]{64}$/;
const ASSETS = new Map([
  ['SIM-USD', ['USD', 'UNKNOWN']], ['USDC', ['USD', 'https://www.circle.com/usdc']],
  ['JPYC', ['JPY', 'https://corporate.jpyc.co.jp/news/posts/jpyc-ex-launch']]
]);

function requireValue(ok, message) { if (!ok) throw new Error(message); }
export function canonical(x) {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k =>
    JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  const encoded = JSON.stringify(x);
  requireValue(encoded !== undefined, 'NON_JSON_INPUT');
  return encoded;
}
export async function sha256(x) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(x)));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
function fields(obj, names) {
  requireValue(obj && typeof obj === 'object' && !Array.isArray(obj) &&
    Object.keys(obj).length === names.length && names.every(k => Object.hasOwn(obj,k)), 'INVALID_FIELDS');
}
function label(x) { return typeof x === 'string' && x.trim().length > 0 && x.length <= 256; }
export function instant(x) {
  requireValue(typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) &&
    Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x, 'INVALID_TIMESTAMP');
  return x;
}
function fixed(s, places, maxWhole = 12) {
  requireValue(typeof s === 'string' && s.length <= maxWhole + places + 1 &&
    /^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(s), 'INVALID_DECIMAL');
  const [a,b=''] = s.split('.');
  requireValue(a.length <= maxWhole && b.length <= places, 'DECIMAL_RANGE');
  return BigInt(a + b.padEnd(places,'0'));
}
function display(n, places) {
  const s = n.toString().padStart(places + 1,'0');
  return (s.slice(0,-places) + '.' + s.slice(-places)).replace(/0+$/,'').replace(/\.$/,'');
}

const assetKeys = ['asset_id','asset_category','methodology_id','methodology_version',
  'evidence_package_sha256','source_record_sha256','verification_status','quantity','quantity_unit','rights_status'];
function assetGate(a) {
  fields(a,assetKeys);
  for (const k of ['asset_id','methodology_id','methodology_version','verification_status','quantity_unit','rights_status'])
    requireValue(label(a[k]), 'ASSET_IDENTITY');
  requireValue(typeof a.evidence_package_sha256 === 'string' && HASH.test(a.evidence_package_sha256) &&
    typeof a.source_record_sha256 === 'string' && HASH.test(a.source_record_sha256), 'EVIDENCE_HASH');
  requireValue(['AGRICULTURE','FORESTRY','BLUE_CARBON','SOIL_CARBON','METHANE','OTHER'].includes(a.asset_category),'CATEGORY');
  if (a.quantity !== null) fixed(a.quantity,18);
  if (a.rights_status !== 'UNVERIFIED') return 'BLOCKED_RIGHTS';
  if (['REVOKED','AUTHENTICITY_FAILED'].includes(a.verification_status)) return 'BLOCKED_EVIDENCE';
  if (a.verification_status === 'HUMAN_REVIEW_REQUIRED') return 'PENDING_HUMAN_REVIEW';
  if (a.verification_status === 'EVIDENCE_REQUIRED') return 'EVIDENCE_INCOMPLETE';
  if (!['REFERENCE','RESEARCH_ESTIMATE'].includes(a.verification_status) ||
      (a.methodology_id === 'AG-005' && a.methodology_version === '3.1-reference')) return 'BLOCKED_METHODOLOGY';
  if (!['AGRICULTURE','FORESTRY','BLUE_CARBON'].includes(a.asset_category)) return 'UNSUPPORTED_CATEGORY';
  if (a.quantity === null) return 'MISSING_QUANTITY';
  if (a.quantity_unit !== 'tCO2e') return 'INCOMPATIBLE_UNIT';
  return 'VALID';
}

// Providers return an immutable observation per lane. No external calls or implicit current time.
export class SnapshotProvider {
  constructor(snapshot) { this.snapshot = structuredClone(snapshot); }
  read(lane) { return structuredClone(this.snapshot[lane]); }
}
const observationKeys = ['pair','source','source_kind','observed_at','as_of','expires_at',
  'market_price','fixed_redemption_value','user_assumption','selected','conflicting'];
function observe(obs, pair, at, places) {
  if (obs === null) return {state:'MISSING'};
  fields(obs,observationKeys);
  requireValue(obs.pair === pair, 'CURRENCY_OR_UNIT_MISMATCH');
  requireValue(['market_price','user_assumption'].includes(obs.selected) && typeof obs.conflicting === 'boolean','PRICE_BASIS');
  for (const key of ['market_price','fixed_redemption_value','user_assumption'])
    if (obs[key] !== null) fixed(obs[key],places,9);
  requireValue(typeof obs.source === 'string' && obs.source.length <= 256 && label(obs.source_kind),'SOURCE_METADATA');
  const observed = instant(obs.observed_at), asOf = instant(obs.as_of), expires = instant(obs.expires_at);
  if (obs.conflicting) return {state:'CONFLICTING_QUOTES'};
  if (obs[obs.selected] === null) return {state:'MISSING'};
  if (!label(obs.source) || obs.source.trim().toUpperCase() === 'UNKNOWN' ||
      !['SYNTHETIC','USER_INPUT'].includes(obs.source_kind)) return {state:'SOURCE_UNVERIFIED'};
  if (observed > at || asOf > observed || expires <= observed) return {state:'BLOCKED'};
  if (at >= expires) return {state:'STALE'};
  const n = fixed(obs[obs.selected],places,9);
  return {state:n > 0n ? 'VALID' : 'BLOCKED', n, value:obs[obs.selected]};
}
const inputKeys = ['asset','valuation_scenario_id','snapshot','asset_symbol','fee_bps','quantity_override'];
export async function valueAsset(input, asOf, previous = null) {
  input = structuredClone(input);
  fields(input,inputKeys);
  requireValue(previous === null || typeof previous === 'string' && HASH.test(previous),'PREVIOUS_HASH');
  instant(asOf);
  const {asset, snapshot, asset_symbol:symbol} = input;
  requireValue(label(input.valuation_scenario_id) && ASSETS.has(symbol),'SCENARIO_OR_SYMBOL');
  const [currency,issuer] = ASSETS.get(symbol);
  const evidence = assetGate(asset);
  const fees = fixed(input.fee_bps,0,5);
  requireValue(fees <= RATE,'FEE_RANGE');
  if (input.quantity_override !== null) fixed(input.quantity_override,18);
  fields(snapshot,['price','fx','peg']);
  const provider = new SnapshotProvider(snapshot);
  const price = observe(provider.read('price'),'JPY/tCO2e',asOf,6);
  const fx = observe(provider.read('fx'),'JPY/USD',asOf,4);
  const peg = observe(provider.read('peg'),currency + '/' + symbol,asOf,4);
  // v1 policy: a move exceeding 5% in either direction suspends this quotation.
  if (peg.state === 'VALID' && (peg.n < 9500n || peg.n > 10500n)) peg.state = 'PEG_DEVIATION';
  const states = {evidence,price:price.state,fx:fx.state,peg:peg.state};
  const status = Object.values(states).every(s => s === 'VALID') ? 'VALID' : 'BLOCKED';
  let quote = null;
  if (status === 'VALID') {
    const q = fixed(input.quantity_override ?? asset.quantity,18);
    const raw = q * price.n;
    const jpy = raw / 10n**24n;
    requireValue(jpy < 10n**12n && raw < 10n**36n,'JPY_OVERFLOW');
    // Keep the exact pre-rounding value. Whole-yen scenario budget is the FX principal.
    const convert = (rate,unit) => jpy * RATE * RATE * MICRO / (rate * unit);
    const gross = convert(currency === 'JPY' ? RATE : fx.n,peg.n);
    const fee = gross * fees / RATE;
    quote = {
      eligible_quantity:input.quantity_override ?? asset.quantity, quantity_unit:'tCO2e',
      quantity_basis:input.quantity_override === null ? 'SOURCE_ESTIMATE' : 'SCENARIO_OVERRIDE',
      assumed_unit_price_jpy:price.value, price_source:snapshot.price.source,
      price_observed_at:snapshot.price.observed_at, price_as_of:snapshot.price.as_of,
      reference_value_jpy:display(raw,24), fx_principal_jpy:String(jpy),
      reference_value_usd:display(convert(fx.n,RATE),6), base_currency:'JPY',quote_currency:currency,
      asset_symbol:symbol,issuer_reference:issuer,network_reference:'UNKNOWN',chain_id:'UNKNOWN',
      token_contract_reference:'UNKNOWN',token_decimals:'UNKNOWN', reference_decimals:6,
      fx_rate:fx.value,fx_source:snapshot.fx.source,fx_timestamp:snapshot.fx.as_of,
      peg_reference:peg.value,peg_source:snapshot.peg.source,peg_timestamp:snapshot.peg.as_of,
      gross_amount:display(gross,6),estimated_fee:display(fee,6),net_amount:display(gross-fee,6),
      rounding_policy:'FLOOR_JPY_THEN_FLOOR_MICRO_UNITS_AND_FEE',
      quote_expiry:[snapshot.fx.expires_at,snapshot.price.expires_at,snapshot.peg.expires_at].sort()[0]
    };
  }
  const body = {schema:SCHEMA, calculation_version:'1.0.0',mode:'SIMULATION_ONLY',
    classification:'RESEARCH_SCENARIO_ONLY',formal_certification:false,certified_quantity:null,
    label:LABEL,as_of:asOf,previous_receipt_sha256:previous,input,states,status,quote};
  return {...body,receipt_sha256:await sha256(body)};
}
export async function replay(receipt) {
  const rebuilt = await valueAsset(receipt.input,receipt.as_of,receipt.previous_receipt_sha256);
  requireValue(canonical(rebuilt) === canonical(receipt),'RECEIPT_REPLAY_MISMATCH');
  return rebuilt;
}
