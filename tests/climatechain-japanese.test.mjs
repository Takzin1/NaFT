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
// Interactive status messages must be localized without changing machine identifiers.
handleClimateChainAction('climatechain-run');
assert.match(pgClimateChainDemo(),/合成申請100件の変更影響解析が完了しました/);
handleClimateChainAction('climatechain-filter',{dataset:{filter:'EVIDENCE_REQUIRED'}});
assert.match(pgClimateChainDemo(),/合成申請の表示条件：EVIDENCE_REQUIRED/);
handleClimateChainAction('climatechain-select-claim',{dataset:{claimId:'CLIMATE-086'}});
assert.match(pgClimateChainDemo(),/合成申請の変更履歴を表示：CLIMATE-086/);
handleClimateChainAction('climatechain-tamper');
assert.match(pgClimateChainDemo(),/合成証拠の改ざんを検知し、処理を停止しました/);
const invariant='<button data-action="climatechain-run" aria-label="Inspect package hash"><code>package hash</code></button>';
const translated=climateJapaneseHtml(invariant);
assert.match(translated,/data-action="climatechain-run"/);
assert.match(translated,/aria-label="Inspect package hash"/);
assert.ok(translated.includes('<code>package hash</code>'));
assert.match(climateJapaneseHtml('<p>Blockchain witnesses version lineage; it does not decide climate truth.</p>'),/ブロックチェーンは版の継承関係を記録します/);
// Full-coverage pass: scenario, explorer, trace and trust-boundary text is Japanese.
const full=pgClimateChainDemo();
assert.match(full,/1人の統括者。100件の申請。変わった方法論。/);
assert.match(full,/気候影響の測定ではありません：/);
assert.match(full,/出典準拠の変更影響エクスプローラー・合成/);
assert.match(full,/申請を選んで、変わった理由/);
assert.match(full,/自動再評価/);
assert.ok(!full.includes('One operator.'));
assert.ok(!full.includes('Select any claim.'));
assert.ok(!full.includes('パッケージハッシュes'));
assert.ok(!full.includes('影響なし claims'));
assert.ok(!full.includes('claim hash ·'));
assert.ok(!full.includes('submitter'));
// Blind spot 1: keys containing "->" must match the esc()-rendered "-&gt;" form.
assert.match(climateJapaneseHtml('<p>The real-world context motivates the problem. The hackathon impact experiment itself uses NAFT-SYNTHETIC@1 -&gt; @2 so the demo does not pretend to implement an official methodology revision.</p>'),/合成ルールNAFT-SYNTHETIC@1→@2を使用します/);
// Blind spot 2: visible text right after </code> (start of a split part) is translated.
const afterCode=climateJapaneseHtml('<p>P2 package <code>abc123</code>. The independent read-only verifier reconstructed this lineage from the deployment source commit and checked bytecode, transaction calldata, events and final head. The browser itself does not broadcast a transaction. Blockchain witnesses lineage; it cannot certify climate truth.</p>');
assert.match(afterCode,/。独立した読み取り専用検証器は/);
assert.ok(!afterCode.includes('The browser itself'));
assert.ok(afterCode.includes('<code>abc123</code>'));
// Machine-readable payloads stay byte-identical even for status-code words.
assert.equal(climateJapaneseHtml('<pre>{"status":"AUTO_REEVALUATED"}</pre>'),'<pre>{"status":"AUTO_REEVALUATED"}</pre>');
console.log('CLIMATECHAIN_JA_PORT_PASS: source-bound logic, Japanese text, 100 synthetic claims, tamper and Sepolia witness');