import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const folder='data/japan-crops-1883-2022/remastered-v1/';
const manifest=JSON.parse(readFileSync(folder+'MANIFEST.json','utf8'));
const receipt=JSON.parse(readFileSync('research/p16-japan-six-crop-1883-2022-original-source-receipt.json','utf8'));
assert.equal(manifest.schema,'naft-p17-remastered-1883-2022-v1');
assert.equal(manifest.source_original_zip_sha256,receipt.archive_sha256);
assert.equal(manifest.source_original_csv_sha256,receipt.main_csv_sha256);
assert.equal(manifest.raw_source_row_count,146160);
assert.equal(manifest.remastered_rows,48720);
assert.equal(manifest.license,'ORIGINAL_SOURCE_RIGHTS_NOT_VERIFIED;NO_NEW_LICENSE_GRANTED');
const crops=['Barley','Potato','Rice','Soybean','SweetPotato','Wheat'];
assert.deepEqual(manifest.crops,crops);
const headers=['crop','year','era','region_code','region','prefecture_code','prefecture','production_tonnes','area_ha','reported_yield_t_ha','production_source','area_source','yield_source','quality_flag'];
assert.deepEqual(manifest.columns,headers);
function csvParse(line){
 let out=[],value='',quote=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(c==='"'){if(quote&&line[i+1]==='"'){value+='"';i++;}else quote=!quote;}
  else if(c===','&&!quote){out.push(value);value='';}
  else value+=c;
 }
 out.push(value);
 assert.equal(quote,false);
 assert.equal(out.length,14);
 return out;
}
const stage={};const flags={};const series=new Map();let rows=0;
for(const crop of crops){
 const m=manifest.files[crop];
 assert.equal(m.path,folder+crop.toLowerCase()+'.csv');
 const buf=readFileSync(m.path);
 assert.equal(buf.length,m.size,crop+' size');
 assert.equal(createHash('sha256').update(buf).digest('hex'),m.sha256,crop+' sha256');
 assert.equal(createHash('sha1').update('blob '+buf.length+'\\0').update(buf).digest('hex'),m.git_blob_sha1,crop+' git sha');
 const lines=buf.toString('utf8').trimEnd().split('\n');
 assert.equal(lines.length,8121,crop+' lines');
 assert.deepEqual(csvParse(lines[0]),headers);
 let national=0;
 const unique=new Set();
 for(let i=1;i<lines.length;i++){
  const parts=csvParse(lines[i]);
  const r=Object.fromEntries(headers.map((k,n)=>[k,parts[n]]));
  assert.equal(r.crop,crop);rows++;
  const year=Number(r.year);
  assert.ok(Number.isInteger(year)&&year>=1883&&year<=2022);
  assert.match(r.region_code,/^r\d{2}$/);
  assert.match(r.prefecture_code,/^p\d{2}$/);
  assert.ok(r.era.length>0);
  assert.ok(r.production_source.length>0);
  assert.ok(r.area_source.length>0);
  assert.equal(r.yield_source,'Calculated data');
  const p=Number(r.production_tonnes),a=Number(r.area_ha),y=Number(r.reported_yield_t_ha);
  assert.ok([p,a,y].every(x=>Number.isFinite(x)&&x>=0));
  if(a>0)assert.ok(Math.abs(y-p/a)<=0.00501,crop+' '+year+' reported-yield rounding');
  else if(p>0)assert.equal(r.quality_flag,'POSITIVE_PRODUCTION_ZERO_REPORTED_AREA');
  const id=r.crop+'|'+year+'|'+r.region_code+'|'+r.prefecture_code;
  assert.equal(unique.has(id),false);
  unique.add(id);
  flags[r.quality_flag]=(flags[r.quality_flag]||0)+1;
  if(r.prefecture_code==='p99'){
   national++;
   assert.equal(r.region_code,'r99');
   series.set(crop+'|'+year,{production:p,area:a,yield:y});
  }
 }
 assert.equal(unique.size,8120);
 assert.equal(national,140);
 stage[crop]=national;
}
assert.equal(rows,48720);
assert.deepEqual(flags,manifest.flag_counts);
assert.deepEqual(stage,Object.fromEntries(crops.map(k=>[k,140])));
const sandbox={};vm.createContext(sandbox);
vm.runInContext(readFileSync('src/gx-japan-crop-history.js','utf8'),sandbox,{timeout:6000});
for(const crop of crops){
 const packed=JSON.parse(JSON.stringify(sandbox.gxCropHistoryData(crop)));
 assert.equal(packed.length,140);
 for(const row of packed){
  const s=series.get(crop+'|'+row.year);assert.ok(s);
  assert.equal(row.production,Math.round(s.production),crop+' '+row.year+' national production parity');
  assert.equal(row.surface,Math.round(s.area),crop+' '+row.year+' national area parity');
  assert.ok(Math.abs(row.yield100/100-s.yield)<=0.0051,crop+' '+row.year+' original yield parity');
 }
}
const py=spawnSync('python3',['-c',"import ast,pathlib;ast.parse(pathlib.Path('scripts/p17-japan-crop-full-remaster.py').read_text())"],{encoding:'utf8',timeout:15000});
assert.equal(py.status,0,py.stderr);
const help=spawnSync('python3',['scripts/p17-japan-crop-full-remaster.py','--help'],{encoding:'utf8',timeout:15000});
assert.equal(help.status,0,help.stderr);
const code=readFileSync('scripts/p17-japan-crop-full-remaster.py','utf8');
for(const name of ['P16','require_original','git_blob_sha1','--verify-committed','SOURCE_COVERAGE_GAP_SUSPECTED'])assert.ok(code.includes(name));
const doc=readFileSync(folder+'README.md','utf8');
assert.ok(doc.includes('rights'));
assert.ok(doc.includes('59'));
assert.ok(doc.includes('not')||doc.includes('NOT'));
console.log('NAFT_P17_FULL_HISTORICAL_REMASTER_PASS: 6 public crop CSVs, 48,720 records, 146,160 original metric values, SHA256 and Git SHA1 matched, original-national parity; no certification');
