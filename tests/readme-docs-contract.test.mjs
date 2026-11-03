import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const r=readFileSync('README.md','utf8');
const docs=readFileSync('docs/README.md','utf8');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.equal(pkg.scripts.test,'bash tests/run.sh');
assert.equal(pkg.engines.node,'>=20');
assert.equal(pkg.private,true);
assert.equal(pkg.license,'MIT');

const sections=[
'## 解決する課題','## NaFTがやること','## やらないこと・限界',
'## クイックスタート','## 入口の一覧','## 品質・再現性',
'## アーキテクチャ','## ドキュメント索引','## 関連リポジトリ',
'## ライセンス・作者','## English summary'
];
let prior=-1;
for(const s of sections){const i=r.indexOf(s);assert(i>prior,'Missing or out-of-order README section: '+s);prior=i;}
assert(!/Pack|oracle|TP\/FN|アサーション|方法論/.test(r.split('\n').slice(0,5).join('\n')));
assert(r.includes('docs/assets/demo.gif'));
assert(r.includes('https://takzin1.github.io/NaFT/naft-app.html#/reviewer-demo'));
assert(r.includes('npm test'));
assert(r.includes('bash tests/run.sh'));
assert(r.includes('headless Chrome'));
assert(r.includes('`result`')&&r.includes('`null`'));
assert(r.includes('`UNKNOWN`')&&r.includes('`UNSUPPORTED`'));
assert(r.includes('```mermaid'));
assert(r.includes('NaFT-IEEE_Climate_Hackathon_Edition'));
for(const file of ['index.html','naft-app.html','gikuten.html','gikuten-pitch.html','LICENSE',
 'docs/architecture.md','docs/data-model.md','docs/known-limitations.md',
 'docs/demo-script.md','docs/test-report.md','docs/impact-soundness.md',
 'docs/README.md','docs/readme-research-log-2026-11-03.md'])assert(existsSync(file),'Missing linked file: '+file);
assert(docs.includes('[新README]')===false);
assert(docs.includes('## まず見る'));
assert(docs.includes('## 公開データ・原本検証'));
const english=r.split('## English summary')[1].trim().split('\n').filter(Boolean);
assert.equal(english.length,5,'English summary must have five lines');
assert(english.every(s=>s.startsWith('- ')));
console.log('README_DOCS_CONTRACT_PASS: layout, true source links, limitations, npm entry point, English five-line summary');
