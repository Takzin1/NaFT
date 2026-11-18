#!/usr/bin/env node
/* P78 · private, local-first forest stand CLI (森林簿 CSV + 森林計画図 → stand_id → Evidence Compiler).
 * State always lives OUTSIDE the repository. No network. No owner data. No automatic identity approval.
 * GeoPackage/Shapefile are converted locally with GDAL ogr2ogr (argument array, no shell) when available.
 */
import {readFileSync,existsSync,statSync,writeFileSync,renameSync,realpathSync,createReadStream} from 'node:fs';
import {dirname,resolve,sep,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import vm from 'node:vm';
import {digest,decodeRegisterBytes,validateProfile,normalizeRegister,normalizePlanFeature,applyPlanMap,emptyStandRegistry,assertStandRegistry,
 addStand,newStandId,stageObservations,suggestContinuity,proposeLink,reviewLink,addStandEvidence,standClaims,buildPublicReceipt} from './lib/forest-stand-identity.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ACTIONS=['init','import-register','import-map','add-stand','suggest','propose','review','evidence','receipt','claims','impact'];
const OPTIONS=['action','state','input','profile','pref','year','payload','out','claims','from','to'];
function fail(c){throw new Error('P78_FOREST_CLI_BLOCKED:'+c);}
function must(x,c){if(!x)fail(c);}
function parseArgs(raw){
 const o={};must(raw.length%2===0,'ARGUMENT_PAIRS');
 for(let i=0;i<raw.length;i+=2){const k=raw[i].slice(2);must(raw[i].startsWith('--')&&OPTIONS.includes(k)&&!(k in o),'UNKNOWN_OPTION:'+raw[i]);o[k]=raw[i+1];}
 must(ACTIONS.includes(o.action),'UNKNOWN_ACTION');
 must(o.action==='impact'||o.state,'STATE_REQUIRED');
 return o;
}
function outsideRepo(p,code){
 must(typeof p==='string'&&p.trim(),code+'_PATH_REQUIRED');
 const f=resolve(p),parent=realpathSync(dirname(f));
 must(f!==ROOT&&!f.startsWith(ROOT+sep)&&parent!==ROOT&&!parent.startsWith(ROOT+sep),code+'_CANNOT_BE_INSIDE_REPOSITORY');
 if(existsSync(f))must(realpathSync(f)===f,code+'_SYMLINK_NOT_ALLOWED');
 return f;
}
function load(f){must(existsSync(f)&&statSync(f).isFile()&&statSync(f).size<64*1024*1024,'STATE_MISSING_OR_TOO_LARGE');let s;try{s=JSON.parse(readFileSync(f,'utf8'));}catch{fail('STATE_JSON');}return assertStandRegistry(s);}
function save(f,state,{create=false}={}){
 assertStandRegistry(state);
 if(create)must(!existsSync(f),'STATE_EXISTS');
 const tmp=f+'.tmp-'+process.pid;writeFileSync(tmp,JSON.stringify(state,null,1)+'\n',{mode:0o600,flag:'wx'});renameSync(tmp,f);
}
function json(p,code){must(p&&existsSync(p)&&statSync(p).isFile()&&statSync(p).size<4*1024*1024,code+'_FILE');try{return JSON.parse(readFileSync(p,'utf8'));}catch{fail(code+'_JSON');}}
function pref(v){must(/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(v||''),'PREF');return v;}
function year(v){const n=Number(v);must(Number.isSafeInteger(n)&&n>=1990&&n<=2100,'YEAR');return n;}
function fileSha(p){return digest(readFileSync(p));}

async function *geojsonSeq(stream){
 const r=createInterface({input:stream,crlfDelay:Infinity});
 try{for await(let line of r){line=line.replace(/^\u001e/,'').trim();if(!line)continue;must(line.length<=4*1024*1024,'FEATURE_TOO_LARGE');let f;try{f=JSON.parse(line);}catch{fail('BAD_GEOJSON_SEQUENCE');}yield f;}}
 finally{r.close();}
}
async function *ogrFeatures(path){
 const child=spawn('ogr2ogr',['-f','GeoJSONSeq','-t_srs','EPSG:4326','/vsistdout/',path],{shell:false,stdio:['ignore','pipe','pipe']});
 let err=null;child.on('error',e=>{err=e;});
 for await(const f of geojsonSeq(child.stdout))yield f;
 const code=await new Promise(r=>child.once('close',r));must(!err&&code===0,'OGR2OGR_UNAVAILABLE_OR_DECODE_FAILED');
}
async function readMap(path,profile,prefCode){
 must(profile.map_properties&&['municipality_cd','rinpan','shohan'].every(k=>typeof profile.map_properties[k]==='string'),'PROFILE_MAP_PROPERTIES');
 const ext=extname(path).toLowerCase(),out=[];
 must(['.geojson','.json','.geojsons','.geojsonseq','.ndjson','.gpkg','.shp'].includes(ext),'MAP_FORMAT');
 const take=f=>{must(out.length<200000,'MAP_TOO_MANY_FEATURES');out.push(normalizePlanFeature(f,{prefecture_code:prefCode,properties:profile.map_properties}));};
 if(ext==='.gpkg'||ext==='.shp'){for await(const f of ogrFeatures(path))take(f);}
 else if(ext==='.geojson'||ext==='.json'){must(statSync(path).size<=32*1024*1024,'GEOJSON_TOO_LARGE_USE_GEOJSONSEQ');const d=JSON.parse(readFileSync(path,'utf8'));must(d.type==='FeatureCollection'&&Array.isArray(d.features),'FEATURE_COLLECTION');d.features.forEach(take);}
 else for await(const f of geojsonSeq(createReadStream(path)))take(f);
 must(out.length>0,'MAP_EMPTY');return out;
}
function compilerContext(){
 const ctx={console,TextEncoder,TextDecoder,Uint8Array,Math,JSON,Object,Array,Set,Map,Number,String,Error};vm.createContext(ctx);
 for(const f of ['src/mrv-core.js','src/methodology-packs.js','src/mrv-compiler.js','src/forest-packs.js'])vm.runInContext(readFileSync(join(ROOT,f),'utf8'),ctx,{filename:f});
 return ctx;
}

export async function main(argv){
 const o=parseArgs(argv);
 if(o.action==='impact'){
  const claims=json(o.claims,'CLAIMS');must(Array.isArray(claims)&&claims.length>0,'CLAIMS_ARRAY');
  must(/^[A-Z0-9-]+@[A-Za-z0-9.-]+$/.test(o.from||'')&&/^[A-Z0-9-]+@[A-Za-z0-9.-]+$/.test(o.to||''),'PACK_KEYS');
  const ctx=compilerContext();ctx.__claims=claims;ctx.__change={type:'methodology',old_key:o.from,new_key:o.to};
  const r=vm.runInContext('analyzeImpact(__claims,__change,FOREST_REGISTRY)',ctx);
  return {schema:'naft-p78-forest-impact-v1',change:{from:o.from,to:o.to},counts:r.counts,
   claims:r.claims.map(c=>({claim_id:c.claim_id,requires_reverification:c.requires_reverification,status:c.status,reasons:c.reasons})),formal_certification:false};
 }
 const state=outsideRepo(o.state,'STATE');
 if(o.action==='init'){save(state,emptyStandRegistry(),{create:true});return buildPublicReceipt(load(state));}
 let s=load(state),extra=null;
 if(o.action==='import-register'){
  const profile=validateProfile(json(o.profile,'PROFILE')),input=resolve(o.input||'');
  must(existsSync(input)&&statSync(input).isFile()&&statSync(input).size<=256*1024*1024,'INPUT_FILE');
  const bytes=readFileSync(input),src=digest(bytes);
  const r=normalizeRegister(decodeRegisterBytes(bytes,profile.encoding),profile,{prefecture_code:pref(o.pref),plan_year:year(o.year),source_file_sha256:src});
  s=stageObservations(s,r.observations);extra={register_file_sha256:src,anomalies:r.anomalies,source_terms:{publisher:profile.source.publisher,redistribution:profile.source.redistribution}};
 }else if(o.action==='import-map'){
  const profile=validateProfile(json(o.profile,'PROFILE')),input=resolve(o.input||'');must(existsSync(input)&&statSync(input).isFile(),'INPUT_FILE');
  const feats=await readMap(input,profile,pref(o.pref)),r=applyPlanMap(s,year(o.year),feats,fileSha(input));s=r.state;extra={anomalies:r.anomalies};
 }else if(o.action==='add-stand'){
  const p=json(o.payload,'PAYLOAD');s=addStand(s,{stand_id:p.stand_id||newStandId(),prefecture_code:p.prefecture_code,reference_hash:p.reference_hash});extra={stand_id:s.stands.at(-1).stand_id};
 }else if(o.action==='suggest'){
  const p=json(o.payload,'PAYLOAD');return {suggestions:suggestContinuity(s,p.observation_id)};
 }else if(o.action==='propose'){s=proposeLink(s,json(o.payload,'PAYLOAD'));extra={candidate_id:s.candidates.at(-1).candidate_id};}
 else if(o.action==='review'){s=reviewLink(s,json(o.payload,'PAYLOAD'));}
 else if(o.action==='evidence'){
  const p=json(o.payload,'PAYLOAD'),f=resolve(p.input||'');must(existsSync(f)&&statSync(f).isFile(),'EVIDENCE_FILE');
  s=addStandEvidence(s,{evidence_id:p.evidence_id,stand_id:p.stand_id,category:p.category,evidence_sha256:fileSha(f),period_start:p.period_start,period_end:p.period_end,local_path:f});
 }else if(o.action==='claims'){
  const p=json(o.payload,'PAYLOAD'),out=outsideRepo(o.out,'CLAIMS_OUT');must(!existsSync(out),'CLAIMS_OUT_EXISTS');
  const rechecked=new Set(s.evidence.filter(e=>e.local_path&&existsSync(e.local_path)&&fileSha(e.local_path)===e.evidence_sha256).map(e=>e.evidence_id));
  const claims=standClaims(s,p,rechecked);writeFileSync(out,JSON.stringify(claims,null,1)+'\n',{mode:0o600,flag:'wx'});
  return {claims_written:claims.length,evidence_rechecked:rechecked.size,evidence_unverified:s.evidence.length-rechecked.size,formal_certification:false};
 }
 if(o.action!=='receipt')save(state,s);
 return {...buildPublicReceipt(s,extra&&extra.anomalies||null),...(extra?{result:{...extra,anomalies:undefined}}:{})};
}
if(import.meta.url===`file://${process.argv[1]}`){
 main(process.argv.slice(2)).then(r=>{console.log(JSON.stringify(r,null,1));},e=>{console.error(e.message);process.exitCode=2;});
}
