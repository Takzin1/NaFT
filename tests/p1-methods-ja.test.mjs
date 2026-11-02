import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildP1Comparison} from '../scripts/p1-method-family-comparison.mjs';
const report=buildP1Comparison();
const sandbox={location:{hash:'#/method-family'}};
vm.createContext(sandbox);
for(const path of ['src/rice-methods-ja.js','src/mrv-ui.js']){
 vm.runInContext(readFileSync(path,'utf8'),sandbox,{filename:path});
}
const snap=sandbox.RICE_METHODS_JA;
assert.equal(snap.snapshot,report.snapshot);
assert.equal(snap.programs.length,report.programs.length);
assert.deepEqual(JSON.parse(JSON.stringify(snap.programs.map(p=>p.id))),
 report.programs.map(p=>p.program));
for(let i=0;i<3;i++){
 const expected=report.programs[i],view=snap.programs[i];
 assert.equal(view.version,expected.version);
 assert.deepEqual(JSON.parse(JSON.stringify(view.lanes.map(x=>x.id))),
  expected.lanes.map(x=>x.label));
 for(let j=0;j<view.lanes.length;j++){
  assert.equal(view.lanes[j].formula,expected.lanes[j].formula_location);
 }
}
assert.equal(snap.official_approval,false);
assert.equal(snap.certified_tco2e,null);
assert.equal(snap.automatic_cross_standard_mapping,false);
assert.equal(vm.runInContext('activeRoute()',sandbox),'method-family');
const header=vm.runInContext('riceMethodsHeader()',sandbox);
assert.match(header,/水田MRV｜方法論と計算方式を比較/);
const page=vm.runInContext('pgRiceMethodsJa()',sandbox);
assert.match(page,/Tier 1\/3の分類が衝突/);
assert.match(page,/現行の正式採択版・適用係数はこの研究デモでは未確認/);
assert.match(page,/正式認証や実測の妥当性は証明できません/);
assert.equal((page.match(/data-rice-lane=/g)||[]).length,6);
assert.equal((page.match(/data-rice-program=/g)||[]).length,3);
const app=readFileSync('naft-app.html','utf8');
assert.ok(app.indexOf('src/rice-methods-ja.js')<app.indexOf('src/mrv-ui.js'));
snap.certified_tco2e='123';
assert.throws(()=>vm.runInContext('pgRiceMethodsJa()',sandbox),/UNSUPPORTED_CERTIFICATION/);
snap.certified_tco2e=null;
snap.automatic_cross_standard_mapping=true;
assert.throws(()=>vm.runInContext('pgRiceMethodsJa()',sandbox),/UNSUPPORTED_CERTIFICATION/);
snap.automatic_cross_standard_mapping=false;
snap.programs[0].lanes[0].name='<img src=x onerror=alert(1)>';
const escaped=vm.runInContext('pgRiceMethodsJa()',sandbox);
assert.ok(escaped.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert.ok(!escaped.includes('<img src=x onerror=alert(1)>'));
console.log('NAFT_P1_METHODS_JA_PASS: 3 namespaces, 6 referenced lanes, no fake approval, XSS escaped');
