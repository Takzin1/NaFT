import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
for(const name of ['mrv-core','methodology-packs','mrv-compiler','compiler-demo',
  'climatechain-testnet-record','climatechain-demo','mrv-ui','climatechain-ja']){
  vm.runInThisContext(fs.readFileSync('src/'+name+'.js','utf8'),{filename:name+'.js'});
}
const c=runClimateChainImpact().counts;
assert.deepEqual([c.total,c.require_reverification,c.UNAFFECTED,c.AUTO_REEVALUATED,c.EVIDENCE_REQUIRED],[100,30,70,15,15]);
let ui=pgClimateChainDemo(),headerText=climateChainHeader();
assert.match(ui,/合成100件の方法論改定を実行/);
assert.match(ui,/data-action="climatechain-run"/);
assert.match(ui,/sepolia.etherscan.io/);
assert.match(headerText,/版管理型 気候MRV/);
assert.match(ui,/方法論が変わっても|改定されても|再検証/);
assert.equal(climateChainTestnetRecord().chain_id,11155111);
assert.equal(climateJapaneseHtml('<p>Download impact analysis JSON</p><code>CLIMATE-086</code>'),
  '<p>影響解析JSONを保存</p><code>CLIMATE-086</code>');
assert.match(fs.readFileSync('naft-app.html','utf8'),/src="src\/climatechain-ja.js"/);
const routing=fs.readFileSync('src/mrv-ui.js','utf8');
assert.ok(routing.includes('page=pgClimateChainDemo()'));
assert.ok(routing.includes("handleClimateChainAction(action,el)"));
assert.ok(routing.includes('route===CLIMATECHAIN_ROUTE'));
const base=climateChainTestnetRecord();
assert.equal(validateClimateChainTestnetRecord(base).ok,true);
assert.equal(base.status,'VERIFIED_TESTNET');
const evidence=runClimateChainTamperChallenge();
assert.equal(evidence.fail_closed,true);
console.log('CLIMATECHAIN_JA_PORT_PASS: source-bound logic, Japanese text, 100 synthetic claims, tamper and Sepolia witness');