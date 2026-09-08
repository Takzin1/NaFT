/**
 * NaFT PoC スモークテスト（既存フロー + IEEE ClimateChain MRV）
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
  assert(pgIEEEDemo().indexOf('Eight stages, with a hard human gate') >= 0, 'IEEE demo landing renders');
  assert(db.verification_runs.length === 3, 'verification runs seeded');
  assert(db.environmental_records.length === 2, 'environmental records seeded');
  const readyA = buildVerificationAssessment(projectOf('pj2'), db.evidences.filter(e => e.project_id === 'pj2'));
  const readyB = buildVerificationAssessment(projectOf('pj2'), db.evidences.filter(e => e.project_id === 'pj2'));
  assert(readyA.outcome === 'ready_for_human_review', 'complete evidence is ready for human review');
  assert(readyA.input_fingerprint === readyB.input_fingerprint, 'verification fingerprint is deterministic');
  assert(buildVerificationAssessment(projectOf('pj10'), []).outcome === 'abstain', 'missing evidence makes engine abstain');
  assert(verificationRunIsCurrent(projectOf('pj2'), latestVerificationRun('pj2')), 'seeded verification run matches current evidence');
  const originalMethod = projectOf('pj2').calculation_method;
  projectOf('pj2').calculation_method += ' changed';
  assert(!verificationRunIsCurrent(projectOf('pj2'), latestVerificationRun('pj2')), 'edited input invalidates stale verification run');
  projectOf('pj2').calculation_method = originalMethod;

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
  assert(route(['producer','verification','pj9']).indexOf('Deterministic Verification') >= 0, 'MRV workbench renders');
  const vals = {'pf-title':'会津 雪室活用・低温貯蔵省エネプロジェクト','pf-region':'r3','pf-area':'会津豪雪地区','pf-cat':'Energy Saving','pf-co2':'6.2','pf-target':'260000','pf-desc':'説明','pf-method':'根拠','pf-rtype':'削減','pf-start':'2026-07-01','pf-end':'2027-03-31','pf-plan':'還元','pf-url':'','pf-mail':'a@b.jp','pf-evdesc':''};
  Object.keys(vals).forEach(i => document.getElementById(i).value = vals[i]);
  document.getElementById('pf-nw').checked = true;
  await saveProject('pj10', true);
  assert(projectOf('pj10').review_status === 'pending_review', 'draft submitted to review');
  await runVerificationAssist('pj10');
  assert(latestVerificationRun('pj10').outcome === 'abstain', 'assist run records abstain');
  assert(projectOf('pj10').review_status === 'pending_review', 'assist run never auto-approves');

  // --- 地域管理者(審査 HITL) ---
  document.getElementById('lg-email').value = 'admin@naft.demo'; document.getElementById('lg-pw').value = 'demo1234';
  await doLogin();
  assert(route(['admin']).indexOf('会津地域') >= 0, 'admin dashboard renders');
  assert(route(['admin','reviews']).indexOf('審査待ち・差し戻し中（2件）') >= 0, 'review queue shows 2');
  S.modal = { type:'review', pjId:'pj9' };
  assert(renderModal().indexOf('営農型ソーラー') >= 0, 'review modal renders');
  assert(renderModal().indexOf('Deterministic Verification Assist') >= 0, 'review modal shows assist disclosure');
  document.getElementById('rv-comment').value = '証憑を確認、承認します。';
  await reviewAction('pj9','approve');
  assert(projectOf('pj9').review_status === 'approved' && projectOf('pj9').trust_score === 70, 'approve works, trust set');
  assert(environmentalRecordFor('pj9') && /^NAFT-ER-[0-9A-F]{64}$/.test(environmentalRecordFor('pj9').record_hash), 'human approval creates hashed candidate record');
  assert(db.environmental_records[0].previous_record_hash === db.environmental_records[1].record_hash, 'environmental records form a hash chain');
  document.getElementById('rv-comment').value = '短い理由';
  await reviewAction('pj10','approve');
  assert(projectOf('pj10').review_status === 'pending_review', 'abstain requires documented human override');
  assert(route(['admin','transactions']).length > 200, 'admin tx renders');
  assert(route(['admin','rewards']).indexOf('チケット照合') >= 0, 'admin rewards renders');
  assert(route(['admin','records']).indexOf('Verified Environmental Record') >= 0, 'admin verification records render');
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
  assert(route(['platform','records']).indexOf('NAFT-ER-') >= 0, 'platform verification ledger renders');
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

  // --- IEEE v3 lifecycle regression suite; original 63 cases above remain intact. ---
  db=seedDB(); S.user=findUser('u3'); S.ieeeProject='pj9';
  const cryptoModule=require('crypto');
  assert(digestText('abc')==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad','SHA-256 known abc vector');
  assert(digestText('')===cryptoModule.createHash('sha256').update('').digest('hex'),'SHA-256 empty vector');
  assert(digestText('環境🌍'.repeat(100))===cryptoModule.createHash('sha256').update('環境🌍'.repeat(100)).digest('hex'),'SHA-256 Unicode multiblock vector');
  assert(canonicalize({b:2,a:{d:4,c:3}})===canonicalize({a:{c:3,d:4},b:2}),'canonical object key ordering');
  assert(canonicalize(['a|b','c'])!==canonicalize(['a','b|c']),'canonical encoding avoids delimiter ambiguity');
  const cryptoDescriptor=Object.getOwnPropertyDescriptor(global,'crypto');
  Object.defineProperty(global,'crypto',{configurable:true,value:undefined});
  const fallbackHash=await sha256Canonical({b:'🌍',a:1});
  assert(fallbackHash===digestText(canonicalize({a:1,b:'🌍'})),'offline fallback equals SHA-256');
  let cryptoCalls=0;
  Object.defineProperty(global,'crypto',{configurable:true,value:{subtle:{digest(...args){cryptoCalls++;return cryptoModule.webcrypto.subtle.digest(...args);}}}});
  assert(await sha256Canonical({a:1,b:'🌍'})===fallbackHash&&cryptoCalls===1,'Web Crypto path matches deterministic fallback');
  const evidence2=db.evidences.filter(e=>e.project_id==='pj2');
  assert(buildVerificationAssessment(projectOf('pj2'),evidence2).evidence_set_hash===buildVerificationAssessment(projectOf('pj2'),evidence2.slice().reverse()).evidence_set_hash,'evidence order independent hash');
  assert(buildVerificationAssessment(projectOf('pj2'),evidence2).input_fingerprint===buildVerificationAssessment({...projectOf('pj2'),id:'other-id'},evidence2).input_fingerprint,'same claim under a new project id has identical fingerprint');
  for(const field of ['start_date','end_date','area_name','producer_id','location','estimated_co2_reduction']){
    const original=projectOf('pj9')[field];projectOf('pj9')[field]=field==='estimated_co2_reduction'?999:'changed';
    assert(!verificationRunIsCurrent(projectOf('pj9'),latestVerificationRun('pj9')),'stale detection includes '+field);
    projectOf('pj9')[field]=original;
  }
  const originalDate=projectOf('pj9').start_date;projectOf('pj9').start_date='2000-01-01';
  document.getElementById('rv-comment').value='Reviewed source evidence and documented limitations.';
  await reviewAction('pj9','approve');
  assert(projectOf('pj9').review_status==='pending_review'&&!environmentalRecordFor('pj9'),'stale human approval blocked');
  projectOf('pj9').start_date=originalDate;
  const draftRecord=buildEnvironmentalRecord(projectOf('pj9'),latestVerificationRun('pj9'),'u3','Reviewed evidence for this claim.',null);
  db.environmental_records.unshift(draftRecord);
  assert((await issueCandidateUnit(draftRecord.id)).code==='HUMAN_APPROVAL_REQUIRED','issue before human approval blocked');
  db.environmental_records=db.environmental_records.filter(r=>r!==draftRecord);
  S.user=findUser('u1');await reviewAction('pj9','approve');
  assert(projectOf('pj9').review_status==='pending_review','citizen cannot invoke human approval');
  S.user=findUser('u3');await runVerificationAssist('pj9');
  assert(projectOf('pj9').review_status==='pending_review'&&db.candidate_units.length===0,'readiness does not approve or issue');
  document.getElementById('rv-comment').value='I reviewed the supplied evidence and acknowledge the draft limitations.';
  await reviewAction('pj9','approve');
  const record9=environmentalRecordFor('pj9');
  assert(record9&&record9.environmental_record_hash===await sha256Canonical(recordPayload(record9)),'human record canonical hash verified via Web Crypto');
  const beforeTamper=record9.estimated_co2_reduction;record9.estimated_co2_reduction=999;
  assert((await issueCandidateUnit(record9.id)).code==='RECORD_INTEGRITY_BLOCKED','edited approved quantity rejected');record9.estimated_co2_reduction=beforeTamper;
  const oldArea=projectOf('pj9').area_name;projectOf('pj9').area_name+=' edited';
  assert((await issueCandidateUnit(record9.id)).code==='STALE_VERIFICATION_BLOCKED','issuance rejects stale approved input');projectOf('pj9').area_name=oldArea;
  const issues=await Promise.all([issueCandidateUnit(record9.id),issueCandidateUnit(record9.id)]);
  const unit=issues.find(r=>r.ok).unit;
  assert(issues.filter(r=>r.ok).length===1&&db.candidate_units.length===1,'concurrent issue allows only one after human approval');
  assert(issues.some(r=>r.code==='DUPLICATE_ISSUANCE_BLOCKED'),'duplicate issuance blocked');
  assert(unit.credit_status==='candidate_not_formally_issued'&&unit.status==='active_candidate','candidate boundary persisted');
  const clonedRecord={...record9,id:'er_same_claim'};clonedRecord.environmental_record_hash=digestText(canonicalize(recordPayload(clonedRecord)));clonedRecord.record_hash='NAFT-ER-'+clonedRecord.environmental_record_hash.toUpperCase();db.environmental_records.unshift(clonedRecord);
  assert((await issueCandidateUnit(clonedRecord.id)).code==='DUPLICATE_ISSUANCE_BLOCKED','same input under different record id blocked');db.environmental_records.shift();
  const total=unit.quantity_total;
  assert(quantityAtoms(0.10000000001)===null,'unsupported fractional precision is not silently rounded');
  assert(!txAmountCell(db.transactions[0]).includes(' pt')&&txAmountCell(db.transactions[0]).includes('simulation'),'candidate ledger amounts never render as points');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',total+1)).code==='AVAILABLE_QUANTITY_EXCEEDED','transfer above available blocked');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',0)).code==='INVALID_QUANTITY','zero transfer blocked');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',-1)).code==='INVALID_QUANTITY','negative transfer blocked');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',NaN)).code==='INVALID_QUANTITY','NaN transfer blocked');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',Infinity)).code==='INVALID_QUANTITY','infinite transfer blocked');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',0.0000001)).code==='INVALID_QUANTITY','subprecision quantity blocked');
  assert((await transferCandidateUnit(unit.id,'demo_operator','__proto__',1)).code==='INVALID_DEMO_HOLDER','unrecognized holder blocked');
  S.user=findUser('u2');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',1)).code==='HUMAN_REVIEWER_REQUIRED','producer cannot control custody ledger');
  S.user=findUser('u3');const move=await transferCandidateUnit(unit.id,'demo_operator','demo_partner',total);
  assert(move.ok&&holderBalance(unit,'demo_partner')===total&&holderBalance(unit,'demo_operator')===0,'transfer success updates both holders');
  assert(unit.quantity_available===total&&unit.quantity_retired===0,'transfer conserves unretired total');
  assert(move.transfer.transfer_hash===await sha256Canonical(transferPayload(move.transfer)),'transfer canonical SHA-256 integrity');
  assert((await transferCandidateUnit(unit.id,'demo_operator','demo_partner',1)).code==='HOLDER_BALANCE_EXCEEDED','previous holder cannot spend transferred balance twice');
  assert((await retireCandidateUnit(unit.id,total+1,'Test removal')).code==='AVAILABLE_QUANTITY_EXCEEDED','retirement above available blocked');
  assert((await retireCandidateUnit(unit.id,1,'  ')).code==='RETIREMENT_REASON_REQUIRED','retirement requires reason');
  assert((await retireCandidateUnit(unit.id,0,'Test removal')).code==='INVALID_QUANTITY','zero retirement blocked');
  S.user=null;
  assert((await retireCandidateUnit(unit.id,1,'Test removal')).code==='HUMAN_REVIEWER_REQUIRED','retirement requires human reviewer session');
  S.user=findUser('u3');
  const retirement=await retireCandidateUnit(unit.id,0.1,'<script>demo reason</script>');
  assert(retirement.ok&&unit.quantity_retired===0.1,'partial retirement success');
  assert(quantityAtoms(unit.quantity_available)+quantityAtoms(unit.quantity_retired)===quantityAtoms(total),'retirement conserves quantity exactly');
  assert((await transferCandidateUnit(unit.id,'demo_partner','demo_operator',total)).code==='AVAILABLE_QUANTITY_EXCEEDED','partially retired quantity cannot be transferred');
  assert(db.unit_transfers[0].previous_transfer_hash===move.transfer.transfer_hash,'retirement links preceding transfer hash');
  assert(pgIEEEDemo().includes('&lt;script&gt;demo reason&lt;/script&gt;'),'ledger reason escaped against HTML injection');
  assert((await retireCandidateUnit(unit.id,unit.quantity_available,'Remove remainder from demo')).ok,'remaining balance retired');
  assert(unit.status==='fully_retired'&&unit.quantity_available===0&&unit.quantity_retired===total,'fully retired status and exact totals');
  const state=JSON.stringify(unit);
  assert((await transferCandidateUnit(unit.id,'demo_partner','demo_operator',1)).code==='RETIRED_UNITS_CANNOT_BE_REUSED','fully retired transfer blocked');
  assert((await retireCandidateUnit(unit.id,1,'Again')).code==='RETIRED_UNITS_CANNOT_BE_REUSED','fully retired reuse blocked');
  assert(JSON.stringify(unit)===state,'blocked operations do not change balances');
  assert((await issueCandidateUnit(record9.id)).code==='DUPLICATE_ISSUANCE_BLOCKED','retired claim cannot be reissued');
  assert(db.audit_logs.some(a=>a.action==='candidate_unit_issue_blocked'&&a.note.includes('DUPLICATE_ISSUANCE_BLOCKED')),'duplicate issue audit log created');
  assert(db.audit_logs.some(a=>a.action==='candidate_unit_retired')&&db.audit_logs.some(a=>a.action==='candidate_unit_transferred'),'lifecycle audit logs created');
  assert(db.transactions.filter(t=>t.token_type==='CANDIDATE_SIMULATION').length===4,'issue transfer and both retirements recorded in transaction ledger');
  assert(pgIEEEDemo().includes('Not a formally issued carbon credit')&&pgIEEEDemo().includes(RETIREMENT_BOUNDARY),'simulation disclaimer rendered');
  assert(pgIEEEDemo().includes('Duplicate issuance blocked')&&pgIEEEDemo().includes('Retired units cannot be reused'),'double-counting block visible');
  assert(!pgIEEEDemo().includes('AI-style')&&!pgIEEEDemo().includes('AIによる参考情報'),'IEEE deterministic naming rendered');
  S.user=findUser('u2');S.ieeeProject='pj10';await ieeeSubmit();S.user=findUser('u3');
  await runVerificationAssist('pj10');
  document.getElementById('rv-comment').value='short';await reviewAction('pj10','approve');
  assert(!environmentalRecordFor('pj10'),'ABSTAIN short override produces no record');
  document.getElementById('rv-comment').value='I accept responsibility for the missing evidence in this simulation only.';await reviewAction('pj10','approve');
  assert(environmentalRecordFor('pj10')&&latestVerificationRun('pj10').final_decision==='approved','explicit sufficient ABSTAIN override accepted');
  assert((await issueCandidateUnit(environmentalRecordFor('pj10').id)).ok,'human ABSTAIN override can issue simulation candidate');
  const saved=db;const legacy=seedDB();legacy.version=2;delete legacy.candidate_units;delete legacy.unit_transfers;delete legacy.unit_retirements;
  legacy.verification_runs[0].input_fingerprint='0123456789abcdef';
  await store.set(DB_KEY,JSON.stringify(legacy));await loadDB();
  assert(db.version===3&&db.candidate_units.length===0&&db.unit_transfers.length===0&&db.unit_retirements.length===0,'v2 migration adds lifecycle collections');
  assert(db.verification_runs[0].input_fingerprint==='0123456789abcdef'&&!verificationRunIsCurrent(projectOf('pj1'),latestVerificationRun('pj1')),'legacy provenance retained and stale, never silently rehashed');
  db=saved;await saveDB();
  if(cryptoDescriptor) Object.defineProperty(global,'crypto',cryptoDescriptor);else delete global.crypto;

  // Exercise the actual IEEE HTML action bindings in the DOM-stub harness.
  db=seedDB();S.user=null;S.modal=null;S.ieeeProject='pj9';location.hash='#/ieee';
  async function ieeeClick(label){
    const html=pgIEEEDemo();
    const button=Array.from(html.matchAll(/<button\b([^>]*)>([^<]*)<\/button>/g)).find(m=>m[2]===label);
    if(!button||/\bdisabled\b/.test(button[1])) throw new Error('Missing or disabled demo control: '+label);
    const handler=button[1].match(/onclick="([^"]+)"/)[1];
    await vm.runInThisContext(handler);
  }
  await ieeeClick('1. Project Operator');
  assert(S.user.role==='producer'&&location.hash==='#/ieee','IEEE operator switch returns to judging route');
  await ieeeClick('Run Deterministic MRV Readiness');
  assert(latestVerificationRun('pj9').outcome==='needs_review','IEEE readiness control surfaces NEEDS_REVIEW');
  await ieeeClick('2. Human Reviewer');
  document.getElementById('rv-comment').value='I reviewed the simulated evidence, methodology and remaining limitations.';
  await ieeeClick('Human: approve evidence');
  assert(!!environmentalRecordFor('pj9'),'IEEE human control produces record');
  await ieeeClick('Issue Candidate Unit');
  const demoUnit=db.candidate_units[0];
  assert(!!demoUnit,'IEEE issue control produces candidate');
  document.getElementById('ieee-from').value='demo_operator';document.getElementById('ieee-to').value='demo_partner';document.getElementById('ieee-quantity').value=String(demoUnit.quantity_total);
  await ieeeClick('Record demo transfer');
  assert(holderBalance(demoUnit,'demo_partner')===demoUnit.quantity_total,'IEEE transfer control moves custody');
  document.getElementById('ieee-from').value='demo_partner';document.getElementById('ieee-reason').value='Remove this claim from the demonstration balance.';
  await ieeeClick('Human: retire candidate quantity');
  assert(demoUnit.status==='fully_retired','IEEE retirement control removes balance');
  await ieeeClick('Try retired-unit transfer → BLOCKED');
  assert(S.candidateMessage.code==='RETIRED_UNITS_CANNOT_BE_REUSED','IEEE retired reuse control shows BLOCKED');
  await ieeeClick('Try duplicate issuance → BLOCKED');
  assert(S.candidateMessage.code==='DUPLICATE_ISSUANCE_BLOCKED','IEEE duplicate control shows BLOCKED');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed / tx=${db.transactions.length}, audit=${db.audit_logs.length}`);
})().catch(e => { console.error('RUNTIME ERROR:', e); process.exit(1); });
