/**
 * NaFT PoC スモークテスト(46項目)
 * 実行: python3 tests/extract-app-js.py && node tests/smoke.test.js
 * ブラウザ環境を最小限スタブし、全ロールの主要フローをNode上で検証する。
 * 依存パッケージなし(Node 18+ 標準機能のみ)。
 */
global.window = { addEventListener(){}, scrollTo(){}, QRCode: undefined, storage: undefined };
global.location = { hash: '#/' };
global.document = {
  _els: {},
  getElementById(id){ if(!this._els[id]) this._els[id] = { id, value:'', innerHTML:'', files:[], checked:true, select(){}, remove(){}, dataset:{} }; return this._els[id]; },
  querySelectorAll(){ return []; },
  createElement(){ return { href:'', download:'', click(){}, remove(){} }; },
  body: { appendChild(){} }
};
global.URL = { createObjectURL(){ return ''; } };
global.Blob = function(){};

const vm = require('vm'), fs = require('fs'), path = require('path');
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '_app.js'), 'utf-8'));

let pass = 0, fail = 0;
const assert = (cond, msg) => { if(!cond){ console.error('  FAIL:', msg); fail++; process.exitCode = 1; } else { console.log('  ok:', msg); pass++; } };

(async function(){
  await new Promise(r => setTimeout(r, 50)); // init IIFE 完了待ち

  // --- シード & 公開ページ ---
  assert(db && db.projects.length === 10, 'db seeded with 10 projects');
  assert(pgLanding().length > 2000, 'landing renders');
  assert(pgPublicMarket().indexOf('承認済みプロジェクト 8件') >= 0, 'market shows 8 approved');
  assert(pgProjectDetail('pj1', true).indexOf('道北森林保全') >= 0, 'project detail renders');
  assert(pgLogin().indexOf('demo1234') >= 0, 'login renders');

  // --- 市民 ---
  document.getElementById('lg-email').value = 'citizen@naft.demo';
  document.getElementById('lg-pw').value = 'demo1234';
  await doLogin();
  assert(S.user && S.user.role === 'citizen', 'citizen login works');
  assert(route(['app']).indexOf('佐藤 みどり') >= 0, 'citizen home renders');
  assert(route(['app','wallet']).indexOf('NAFT-WLT-8F3K9Q2L') >= 0, 'wallet renders');
  assert(route(['app','rewards']).length > 200, 'rewards renders');
  assert(route(['app','transactions']).indexOf('TX-SEED') >= 0, 'tx ledger renders');
  assert(route(['app','regions']).indexOf('応援') >= 0, 'regions renders');
  assert(route(['app','profile']).indexOf('citizen@naft.demo') >= 0, 'profile renders');

  // --- 支援フロー(残高減算・台帳・チケット発行) ---
  const balBefore = walletOf('u1').naft_point_balance;
  openSupport('pj2');
  document.getElementById('sp-amt').value = '1000';
  confirmSupport();
  assert(S.modal.step === 2, 'support confirm step');
  await execSupport();
  assert(walletOf('u1').naft_point_balance === balBefore - 1000, 'balance deducted');
  assert(projectOf('pj2').current_amount === 319000, 'project amount incremented');
  assert(S.modal.result && S.modal.result.reward && S.modal.result.reward.id === 'rw1', 'related reward issued');
  assert(db.transactions[0].transaction_type === 'reward_issue' || db.transactions[1].transaction_type === 'reward_issue', 'reward tx recorded');

  // --- 購入予約(意思表示) ---
  openReserve('pj1');
  document.getElementById('rv-qty').value = '1.5';
  await execReserve();
  assert(db.reservations.length === 1 && db.reservations[0].total_expected_price === 4500, 'reservation recorded');

  // --- 事業者 ---
  document.getElementById('lg-email').value = 'producer@naft.demo'; document.getElementById('lg-pw').value = 'demo1234';
  await doLogin();
  assert(route(['producer']).indexOf('会津グリーンファーム') >= 0, 'producer home renders');
  assert(route(['producer','new']).indexOf('新規プロジェクト登録') >= 0, 'project form renders');
  assert(route(['producer','new','pj10']).indexOf('プロジェクトを編集') >= 0, 'edit prefill renders');
  assert(route(['producer','project','pj9']).indexOf('審査') >= 0, 'producer project detail renders');
  const vals = {'pf-title':'会津 雪室活用・低温貯蔵省エネプロジェクト','pf-region':'r3','pf-area':'会津豪雪地区','pf-cat':'Energy Saving','pf-co2':'6.2','pf-target':'260000','pf-desc':'説明','pf-method':'根拠','pf-rtype':'削減','pf-start':'2026-07-01','pf-end':'2027-03-31','pf-plan':'還元','pf-url':'','pf-mail':'a@b.jp','pf-evdesc':''};
  Object.keys(vals).forEach(i => document.getElementById(i).value = vals[i]);
  document.getElementById('pf-nw').checked = true;
  await saveProject('pj10', true);
  assert(projectOf('pj10').review_status === 'pending_review', 'draft submitted to review');

  // --- 地域管理者(審査 HITL) ---
  document.getElementById('lg-email').value = 'admin@naft.demo'; document.getElementById('lg-pw').value = 'demo1234';
  await doLogin();
  assert(route(['admin']).indexOf('会津地域') >= 0, 'admin dashboard renders');
  assert(route(['admin','reviews']).indexOf('審査待ち・差し戻し中（2件）') >= 0, 'review queue shows 2');
  S.modal = { type:'review', pjId:'pj9' };
  assert(renderModal().indexOf('営農型ソーラー') >= 0, 'review modal renders');
  document.getElementById('rv-comment').value = '証憑を確認、承認します。';
  await reviewAction('pj9','approve');
  assert(projectOf('pj9').review_status === 'approved' && projectOf('pj9').trust_score === 70, 'approve works, trust set');
  assert(route(['admin','transactions']).length > 200, 'admin tx renders');
  assert(route(['admin','rewards']).indexOf('チケット照合') >= 0, 'admin rewards renders');
  assert(route(['admin','audit']).indexOf('project_approve') >= 0, 'audit log renders');
  assert(route(['admin','reports']).indexOf('PoC実証レポート') >= 0, 'admin reports render');
  const urAvail = db.user_rewards.find(u => u.status === 'available');
  document.getElementById('rd-code').value = urAvail.qr_code_value;
  await redeemByCode();
  assert(urAvail.status === 'used', 'redeem by QR code works');

  // --- 加盟店 / 金融パートナー(複数地域) ---
  document.getElementById('lg-email').value = 'merchant@naft.demo'; document.getElementById('lg-pw').value = 'demo1234';
  await doLogin();
  assert(route(['merchant']).indexOf('QRコード照合') >= 0, 'merchant renders');
  document.getElementById('lg-email').value = 'bank@naft.demo'; document.getElementById('lg-pw').value = 'demo1234';
  await doLogin();
  assert(route(['admin']).indexOf('会津') >= 0, 'financial partner defaults to first region');
  S.adminRegion = 'r8';
  assert(route(['admin']).indexOf('瀬戸内') >= 0, 'region switcher works');

  // --- 全国プラットフォーム ---
  document.getElementById('lg-email').value = 'platform@naft.demo'; document.getElementById('lg-pw').value = 'demo1234';
  await doLogin();
  assert(route(['platform']).indexOf('都道府県別') >= 0, 'platform dashboard renders');
  assert(route(['platform','regions']).indexOf('新しい地域を登録') >= 0, 'platform regions renders');
  const m = {'rg2-name':'広島県 しまなみGXエリア','rg2-pref':'広島県','rg2-muni':'尾道・しまなみ','rg2-type':'wide_area','rg2-optype':'shinkin_bank','rg2-op':'しまなみGX協議会','rg2-desc':'x','rg2-mail':'a@b.jp'};
  Object.keys(m).forEach(k => document.getElementById(k).value = m[k]);
  await createRegion();
  assert(db.regions.length === 11, 'region created');
  assert(route(['platform','projects']).length > 500, 'platform projects renders');
  assert(route(['platform','transactions']).length > 500, 'platform tx renders');
  assert(route(['platform','reports']).indexOf('全国取引台帳CSV') >= 0, 'platform reports renders');
  assert(route(['platform','settings']).indexOf('リセット') >= 0, 'settings renders');

  // --- CSV / 新規登録・オンボーディング ---
  assert(txCSV(db.transactions).split('\n').length === db.transactions.length + 1, 'tx CSV rows match');
  document.getElementById('rg-name').value = 'テスト 太郎';
  document.getElementById('rg-email').value = 'test@example.jp';
  document.getElementById('rg-pw').value = 'pass123';
  document.getElementById('rg-role').value = 'citizen';
  await doRegister();
  assert(S.user.email === 'test@example.jp' && S.user.onboarded === false, 'register works');
  document.getElementById('ob-home').value = 'r2'; obNext1();
  S.ob.support = ['r1']; obNext2();
  S.ob.cats = ['Forest'];
  await obFinish();
  assert(walletOf(S.user.id).naft_point_balance === 5000, 'initial grant 5000pt');
  assert(db.transactions[0].transaction_type === 'initial_grant', 'grant recorded in ledger');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed / tx=${db.transactions.length}, audit=${db.audit_logs.length}`);
})().catch(e => { console.error('RUNTIME ERROR:', e); process.exit(1); });
