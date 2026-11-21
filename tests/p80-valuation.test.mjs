import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {agricultureAsset,forestAsset,coastalAsset} from '../scripts/valuation.mjs';
import {replay,sha256,valueAsset} from '../src/environmental-valuation.mjs';
import {compilerAsset,applyCompilerImpact,reconcile} from '../src/valuation-lineage.mjs';
import {scenario,assumption} from '../src/valuation-demo.mjs';
const at = '2026-11-21T00:00:00.000Z', later = '2026-11-21T00:01:00.000Z';
const load = p => JSON.parse(readFileSync(p));
const asset = load('fixtures/p80-ag005-research-asset.json');
const input = () => scenario(structuredClone(asset),at);
const run = i => valueAsset(i,at);
test('P9 historical adapter regenerates the dashboard fixture from original input',()=>{
  assert.deepEqual(agricultureAsset(load('fixtures/p9-synthetic-ag005-v1-preview.json'),'P9-DEMO-07'),asset);
});
test('reproduce the exact reference value, USD and synthetic units from fixed observations',async()=>{
  const r = await run(input()); assert.equal(r.quote.reference_value_jpy,'3360');
  const missingSource=input();missingSource.snapshot.price.source='UNKNOWN';
  assert.equal((await run(missingSource)).states.price,'SOURCE_UNVERIFIED');
  assert.equal(r.quote.reference_value_usd,'22.362728'); assert.equal(r.quote.net_amount,'22.306822');
  assert.deepEqual(await replay(JSON.parse(JSON.stringify(r))),r);
});
test('JPY peg and USD peg use their own currency; market, redemption and assumption stay distinct',async()=>{
  for (const [symbol,currency,expected] of [['JPYC','JPY','3360'],['USDC','USD','22.362728']]) {
    const i=input(); i.asset_symbol=symbol; i.snapshot.peg.pair=currency+'/'+symbol;
    i.snapshot.peg.fixed_redemption_value='1'; i.snapshot.peg.market_price='0.99';
    assert.equal((await run(i)).quote.gross_amount,expected);
    i.snapshot.peg.selected='market_price'; assert.notEqual((await run(i)).quote.gross_amount,expected);
    i.snapshot.peg.selected='fixed_redemption_value'; await assert.rejects(run(i),/PRICE_BASIS/);
  }
});
for (const [name,mutate,lane,expected] of [
  ['zero FX',i=>i.snapshot.fx.user_assumption='0','fx','BLOCKED'],
  ['missing FX',i=>i.snapshot.fx=null,'fx','MISSING'],
  ['missing price',i=>i.snapshot.price.user_assumption=null,'price','MISSING'],
  ['unverified',i=>i.snapshot.fx.source_kind='UNKNOWN','fx','SOURCE_UNVERIFIED'],
  ['conflict',i=>i.snapshot.fx.conflicting=true,'fx','CONFLICTING_QUOTES'],
  ['depeg',i=>i.snapshot.peg.user_assumption='0.9499','peg','PEG_DEVIATION'],
  ['expired',i=>Object.assign(i.snapshot.fx,{as_of:'2026-11-20T00:00:00.000Z',observed_at:'2026-11-20T00:00:00.000Z',expires_at:at}),'fx','STALE'],
  ['future observation',i=>i.snapshot.price.observed_at=later,'price','BLOCKED'],
  ['missing quantity even with override',i=>{i.asset.quantity=null;i.quantity_override='5'},'evidence','MISSING_QUANTITY'],
  ['wrong unit',i=>i.asset.quantity_unit='tC','evidence','INCOMPATIBLE_UNIT'],
  ['revoked',i=>i.asset.verification_status='REVOKED','evidence','BLOCKED_EVIDENCE'],
  ['expired rights',i=>i.asset.rights_status='EXPIRED','evidence','BLOCKED_RIGHTS'],
  ['unverified issuance claim',i=>i.asset.rights_status='ISSUED','evidence','BLOCKED_RIGHTS'],
  ...['UNKNOWN','CONFIG_REQUIRED','UNSUPPORTED','CERTIFIED'].map(s=>[s,i=>i.asset.verification_status=s,'evidence','BLOCKED_METHODOLOGY'])
]) test(name,async()=>{const i=input();mutate(i);const r=await run(i);assert.equal(r.states[lane],expected);
  assert.equal(r.quote,null);assert.equal(r.classification,'RESEARCH_SCENARIO_ONLY');});
for (const [name,mutate,err] of [
  ['negative FX',i=>i.snapshot.fx.user_assumption='-1',/DECIMAL/],
  ['fx inversion',i=>i.snapshot.fx.pair='USD/JPY',/MISMATCH/],
  ['JPY peg treated as USD',i=>i.asset_symbol='JPYC',/MISMATCH/],
  ['rate precision',i=>i.snapshot.peg.user_assumption='0.99999',/DECIMAL_RANGE/],
  ['overflow',i=>i.quantity_override='999999999999',/OVERFLOW/],
  ['false rights field',i=>i.asset.formal_certification=true,/INVALID_FIELDS/],
  ['fee overflow',i=>i.fee_bps='10001',/FEE_RANGE/]
]) test(name,async()=>{const i=input();mutate(i);await assert.rejects(run(i),err)});
test('Python Fraction oracle: zero, sub-yen, boundary peg, maximum principal, long integers and rounding',async()=>{
  const rows=[];
  for (const [qty,price] of [['0','1'],['0.000000000000000001','0.000001'],['999999999999.999999999999999999','1'],
    ['123456789.123456789123456789','100.000001'],['0.999999999999999999','10']])
    for (const fx of ['0.0001','150.25','999999999.9999'])
      for (const [symbol,peg] of [['SIM-USD','0.95'],['USDC','1.05'],['JPYC','0.9999']])
        for (const fee of ['0','17','10000']) rows.push([qty,price,fx,peg,symbol,fee]);
  const oracle=spawnSync('python3',['tests/p80-decimal-oracle.py'],{input:JSON.stringify(rows),encoding:'utf8'});
  assert.equal(oracle.status,0,oracle.stderr);
  const expected=JSON.parse(oracle.stdout);
  for (const [index,[qty,price,fx,peg,symbol,fee]] of rows.entries()) {
    const i=input();i.quantity_override=qty;i.asset_symbol=symbol;i.fee_bps=fee;
    i.snapshot.price.user_assumption=price;i.snapshot.fx.user_assumption=fx;
    i.snapshot.peg=assumption((symbol==='JPYC'?'JPY':'USD')+'/'+symbol,peg,at);
    const q=(await run(i)).quote;
    assert.deepEqual([q.fx_principal_jpy,q.reference_value_usd,q.gross_amount,q.estimated_fee,q.net_amount],expected[index]);
  }
});
test('ledger rejects duplicate evidence, stale revisions and modified history',async()=>{
  const i=input(),copy=structuredClone(i);copy.asset.asset_id='second';
  await assert.rejects(reconcile([],[i,copy],at),/DUPLICATE/);
  const h=await reconcile([],[i],later);
  await assert.rejects(reconcile(h,[i],at),/BACKDATED/);
  h[0].quote.net_amount='0';await assert.rejects(replay(h[0]),/REPLAY/);
  await assert.rejects(reconcile(h,[i],later),/DIGEST/);
});
test('selective revisions preserve old heads, track market and evidence changes, suspend on expiry',async()=>{
  const a=input(),b=input();b.asset.asset_id='other';b.asset.evidence_package_sha256=await sha256('another record');
  let h=await reconcile([],[a,b],at);let prev=h[0];
  for(const edit of [i=>i.asset.methodology_version='research v2',i=>i.asset.source_record_sha256='d'.repeat(64),
    i=>i.asset.evidence_package_sha256='e'.repeat(64),i=>i.asset.quantity='3',i=>i.snapshot.price.user_assumption='1800',
    i=>i.snapshot.fx.user_assumption='151',i=>i.snapshot.peg.user_assumption='1.01',i=>i.asset.rights_status='REVOKED']){
    edit(a);const newHistory=await reconcile(h,[a,b],later);assert.equal(newHistory.length,h.length+1);
    assert.deepEqual(newHistory.slice(0,-1),h);assert.equal(newHistory.at(-1).previous_receipt_sha256,prev.receipt_sha256);
    h=newHistory;prev=h.at(-1);
  }
  assert.equal(prev.quote,null);assert.deepEqual(await reconcile(h,[a,b],later),h);
  const expired=await reconcile(h,[a,b],b.snapshot.price.expires_at);
  assert.equal(expired.at(-1).states.price,'STALE');
});
test('compiler impact uses real version diff and leaves identical dependencies at their old heads',async()=>{
  const ctx=vm.createContext({TextEncoder,structuredClone,console});
  for(const f of ['mrv-core','methodology-packs','mrv-compiler','compiler-demo'])
    vm.runInContext(readFileSync('src/'+f+'.js','utf8'),ctx);
  const data=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
    const p=clone(COMPILER_REGISTRY['NAFT-SYNTHETIC@1']),q=clone(COMPILER_REGISTRY['NAFT-SYNTHETIC@2']);
    p.calculation_spec.unit=q.calculation_spec.unit='tCO2e'; q.parameters.factor=clone(p.parameters.factor); delete q.exceptions.sensitive;
    const claims=demoClaims(),reg=createMethodologyRegistry([p,q]);
    const impact=analyzeImpact(claims,{type:'methodology',old_key:compilerKey(p),new_key:compilerKey(q)},reg);
    const target=impact.claims.find(row=>row.requires_reverification);
    const follow=analyzeImpact([target.next_input],{type:'field',field_id:target.next_input.field.id,patch:{area_ha:7}},reg);
    return {packages:claims.map(c=>compileEvidence(c,p)),impact,follow};
  })())`,ctx));
  const inputs=await Promise.all(data.packages.map(async p=>scenario(await compilerAsset(p),at)));
  const h=await reconcile([],inputs,at),next=await applyCompilerImpact(inputs,data.impact);
  const revised=await reconcile(h,next,later),affected=data.impact.claims.filter(r=>r.requires_reverification);
  assert.ok(affected.length>0 && affected.length<inputs.length);
  assert.deepEqual(revised.slice(h.length).map(r=>r.input.asset.asset_id).sort(),affected.map(r=>r.claim_id).sort());
  const second=await applyCompilerImpact(next,data.follow);
  const twice=await reconcile(revised,second,later);
  assert.equal(twice.length,revised.length+1);
  const revisedId=data.follow.claims[0].claim_id;
  assert.equal(twice.at(-1).previous_receipt_sha256,revised.findLast(r=>r.input.asset.asset_id===revisedId).receipt_sha256);
  const fake=structuredClone(data.packages[0]);fake.document.claim_id='wrong';
  await assert.rejects(compilerAsset(fake),/INTEGRITY/);
});
test('forest accepts explicit tCO2e; area alone is blocked; Blue Carbon requires the original replayable bundle',async()=>{
  const raw={schema:'naft-forest-research-estimate/1',stand_id:'S1',methodology_id:'FO-001',
    methodology_version:'research-v1',formal_certification:false,evidence_package_sha256:'a'.repeat(64),
    verification_status:'REFERENCE',quantity:'12',quantity_unit:'tCO2e',rights_status:'UNVERIFIED'};
  const i=input();i.asset=await forestAsset(raw);assert.equal((await run(i)).quote.reference_value_jpy,'18000');
  i.asset=await forestAsset({...raw,quantity_unit:'ha'});assert.equal((await run(i)).quote,null);
  assert.throws(()=>coastalAsset({}),/BUNDLE_REQUIRED/);
});
