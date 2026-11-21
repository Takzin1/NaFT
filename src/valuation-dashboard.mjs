import {LABEL,replay} from './environmental-valuation.mjs';
import {compilerAsset,reconcile} from './valuation-lineage.mjs';
import {assumption,scenario} from './valuation-demo.mjs';
const el = id => document.getElementById(id);
let input, history = [], generation = 0;
const now = () => new Date().toISOString();
function enable(ok) { el('export').disabled = el('history').disabled = !ok; }
function clear() {
  enable(false); el('amounts').replaceChildren(); el('gate').textContent = 'Blocked';
  for (const id of ['source','replay','audit']) el(id).textContent = '';
}
function metric(title,value) {
  const card = document.createElement('div');
  for (const [tag,txt] of [['span',title],['strong',value],['small',LABEL]]) {
    const n = document.createElement(tag); n.textContent = txt; card.append(n);
  }
  el('amounts').append(card);
}
function show(r) {
  const a = r.input.asset, q = r.quote;
  el('source').textContent = a.asset_id + ' · ' + a.methodology_id + ' ' + a.methodology_version +
    ' · MRV推定量 ' + (a.quantity ?? '未確定') + ' ' + a.quantity_unit;
  el('amounts').replaceChildren();
  if (q) {
    metric('評価に用いた数量',q.eligible_quantity + ' tCO2e');
    metric('参考単価',q.assumed_unit_price_jpy + ' 円 / tCO2e');
    metric('JPY 参考評価額',q.reference_value_jpy + ' 円');
    metric('USD 参考評価額',q.reference_value_usd + ' USD');
    metric('参考数量（手数料控除前）',q.gross_amount + ' ' + q.asset_symbol);
    metric('手数料控除後',q.net_amount + ' ' + q.asset_symbol);
  }
  el('gate').textContent = [r.classification,'External Certification Required',r.status,...new Set(Object.values(r.states))].join(' · ');
  el('audit').textContent = JSON.stringify({receipt:r,history:history.map(v=>v.receipt_sha256)},null,2);
  el('replay').textContent = '計算版 ' + r.calculation_version + ' · 再計算一致 · ' + r.as_of +
    ' · 単価出典 ' + (r.input.snapshot.price?.source ?? '不明') + ' · 観測 ' + (r.input.snapshot.price?.observed_at ?? '不明');
  enable(true);
}
function basisPoints(s) {
  if (typeof s !== 'string' || !/^(0|[1-9]\d{0,8})(\.\d{1,4})?$/.test(s)) return '';
  const [a,b=''] = s.split('.');
  return String(BigInt(a+b.padEnd(4,'0')) - 10000n);
}
const selected = o => o?.[o.selected] ?? '';
function fill(i) {
  el('quantity').value = i.quantity_override ?? ''; el('quantity').placeholder = i.asset.quantity ?? '未確定';
  el('price').value = selected(i.snapshot.price); el('fx').value = selected(i.snapshot.fx);
  el('deviation').value = basisPoints(selected(i.snapshot.peg)); el('symbol').value = i.asset_symbol;
  el('fee').value = i.fee_bps;
}
async function commit(next,at,token) {
  const result = await reconcile(history,[next],at);
  const verified = await replay(result.at(-1));
  if (token !== generation) return;
  history = result; input = next; show(verified); el('message').textContent = '';
}
function observation(old,pair,value,at) {
  if (old?.pair === pair && selected(old) === value) return old;
  return {...assumption(pair,value,at),source:'Dashboard user assumption',source_kind:'USER_INPUT'};
}
el('scenario').addEventListener('input',() => {
  ++generation; clear(); el('message').textContent = '入力を変更しました。再計算してください。';
});
el('scenario').onsubmit = async e => {
  e.preventDefault(); const token = ++generation; clear();
  try {
    if (!input) throw new Error('先に有効なデータを開いてください');
    const next = structuredClone(input), at = now(), dev = el('deviation').value;
    if (!/^-?\d{1,5}$/.test(dev) || BigInt(dev) <= -10000n) throw new Error('INVALID_PEG_DEVIATION');
    const n = 10000n + BigInt(dev), peg = String(n/10000n) + '.' + String(n%10000n).padStart(4,'0');
    next.quantity_override = el('quantity').value || null; next.asset_symbol = el('symbol').value;
    next.fee_bps = el('fee').value;
    next.snapshot.price = observation(next.snapshot.price,'JPY/tCO2e',el('price').value,at);
    next.snapshot.fx = observation(next.snapshot.fx,'JPY/USD',el('fx').value,at);
    const pair = (next.asset_symbol === 'JPYC' ? 'JPY/' : 'USD/') + next.asset_symbol;
    if (next.snapshot.peg?.pair !== pair || basisPoints(selected(next.snapshot.peg)) !== String(BigInt(dev)))
      next.snapshot.peg = observation(null,pair,peg,at);
    await commit(next,at,token);
  } catch (err) { if (token === generation) el('message').textContent = err.message; }
};
el('import').onchange = async e => {
  const token = ++generation; clear(); input = undefined; history = [];
  try {
    const f = e.target.files[0]; if (!f || f.size > 8*1024*1024) throw new Error('INPUT_SIZE');
    const obj = JSON.parse(await f.text());
    if (obj.document) {
      const at = now(), next = scenario(await compilerAsset(obj),at);
      if (token !== generation) return;
      fill(next); await commit(next,at,token);
    } else {
      const chain = Array.isArray(obj) ? obj : [obj];
      if (!chain.length || chain.length > 1024) throw new Error('HISTORY_SIZE');
      let previous = null;
      for (const entry of chain) {
        await replay(entry);
        if (Array.isArray(obj) && entry.previous_receipt_sha256 !== previous) throw new Error('BROKEN_LINEAGE');
        if (entry.input.asset.asset_id !== chain[0].input.asset.asset_id ||
            entry.input.valuation_scenario_id !== chain[0].input.valuation_scenario_id) throw new Error('SCENARIO_IDENTITY');
        previous = entry.receipt_sha256;
      }
      const r = chain.at(-1);
      if (token !== generation) return;
      input = r.input; history = chain; fill(input); show(r);
      if (chain[0].previous_receipt_sha256 !== null) {
        input = undefined; el('message').textContent = 'この後続レシートの再計算は一致しました。続けて変更するには全履歴JSONを開いてください。'; return;
      }
      el('message').textContent = '保存時点の履歴を再現しました。現在時点の判定には再計算してください。';
    }
  } catch (err) { if (token === generation) el('message').textContent = err.message; }
};
function download(data,name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
el('export').onclick = () => download(history.at(-1),'naft-valuation.json');
el('history').onclick = () => download(history,'naft-valuation-history.json');
try {
  const token = ++generation, at = now();
  const res = await fetch('./fixtures/p80-ag005-research-asset.json');
  if (!res.ok) throw new Error('DEMO_FIXTURE_UNAVAILABLE');
  const next = scenario(await res.json(),at);
  if (token === generation) { fill(next); await commit(next,at,token); }
} catch (err) { el('message').textContent = err.message; }
