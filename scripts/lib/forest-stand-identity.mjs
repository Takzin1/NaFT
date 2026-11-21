/* NaFT P78 · research-only, local-first forest stand (小班) identity for FO-001-style MRV.
 *
 * 森林簿 rows and 森林計画図 polygons are ANNUAL / PLAN-PERIOD OBSERVATIONS keyed by 林班-小班-枝番.
 * Those keys are renumbered when regional forest plans are revised, and 小班 are split/merged, so a
 * local key is never a durable identity. NaFT issues its own stand_id and links observations to it only
 * through an explicit, hashed human decision. No ownership, cadastral, official-area or credit claims.
 * No raw geometry or personal data is persisted; only hashes and the register attributes the profile maps.
 */
import {createHash,randomUUID} from 'node:crypto';

export const FOREST_SCHEMA='naft-p78-forest-stand-registry-v1';
export const PROFILE_SCHEMA='naft-p78-forest-register-profile-1';
const ZERO='0'.repeat(64);
const SHA=/^[0-9a-f]{64}$/;
const SID=/^std_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLASSES=new Set(['IKUSEI','TENNEN','BAMBOO','TREELESS','UNKNOWN']);
const RIGHTS=new Set(['PERMITTED','PROHIBITED','NOT_VERIFIED']);
const REQUIRED_COLUMNS=['municipality_cd','rinpan','shohan','forest_type','species','age','area_ha'];
const OPTIONAL_COLUMNS=['edaban','restricted'];
// Owner names/addresses must never enter NaFT, even if a local extract still contains them.
const PERSONAL_HEADER=/(所有者|森林所有者|氏名|住所|owner|address|電話)/i;
const MAX_ROWS=200000;

function fail(code){throw new Error('P78_FOREST_BLOCKED:'+code);}
function must(c,code){if(!c)fail(code);}
export function digest(x){return createHash('sha256').update(typeof x==='string'||ArrayBuffer.isView(x)?x:JSON.stringify(x)).digest('hex');}
function dup(s){return JSON.parse(JSON.stringify(s));}
const sha=v=>typeof v==='string'&&SHA.test(v);
const text=(v,max=200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;

/* ---------- 森林簿 CSV ---------- */
export function decodeRegisterBytes(bytes,encoding){
 must(['utf-8','shift_jis'].includes(encoding),'ENCODING_UNSUPPORTED');
 let s;
 try{s=new TextDecoder(encoding,{fatal:true}).decode(bytes);}catch{fail('ENCODING_DECODE_FAILED');}
 return s.replace(/^﻿/,'');
}
export function parseCsv(textValue){
 must(typeof textValue==='string','CSV_TEXT');
 const rows=[];let row=[],cell='',q=false,i=0;
 const push=()=>{row.push(cell);cell='';};
 while(i<textValue.length){
  const ch=textValue[i];
  if(q){
   if(ch==='"'){if(textValue[i+1]==='"'){cell+='"';i+=2;continue;}q=false;i++;continue;}
   cell+=ch;i++;continue;
  }
  if(ch==='"'){must(cell==='','CSV_QUOTE_POSITION');q=true;i++;continue;}
  if(ch===','){push();i++;continue;}
  if(ch==='\r'||ch==='\n'){push();rows.push(row);row=[];if(ch==='\r'&&textValue[i+1]==='\n')i++;i++;must(rows.length<=MAX_ROWS+1,'CSV_TOO_MANY_ROWS');continue;}
  cell+=ch;i++;
 }
 must(!q,'CSV_UNTERMINATED_QUOTE');
 if(cell!==''||row.length){push();rows.push(row);}
 return rows.filter(r=>!(r.length===1&&r[0]===''));
}
export function validateProfile(p){
 must(p&&p.schema===PROFILE_SCHEMA&&text(p.profile_id,80),'PROFILE_SCHEMA');
 must(['utf-8','shift_jis'].includes(p.encoding),'PROFILE_ENCODING');
 must(p.columns&&typeof p.columns==='object','PROFILE_COLUMNS');
 for(const k of REQUIRED_COLUMNS)must(text(p.columns[k],60),'PROFILE_COLUMN_MISSING:'+k);
 for(const k of Object.keys(p.columns))must(REQUIRED_COLUMNS.includes(k)||OPTIONAL_COLUMNS.includes(k),'PROFILE_COLUMN_UNKNOWN:'+k);
 must(p.forest_class_map&&Object.keys(p.forest_class_map).length>0&&Object.values(p.forest_class_map).every(v=>CLASSES.has(v)&&v!=='UNKNOWN'),'PROFILE_FOREST_CLASS_MAP');
 must(p.columns.restricted===undefined||(Array.isArray(p.restricted_values)&&p.restricted_values.length>0),'PROFILE_RESTRICTED_VALUES');
 must(p.mature_age_by_species===null||(typeof p.mature_age_by_species==='object'&&Object.values(p.mature_age_by_species).every(n=>Number.isInteger(n)&&n>0&&n<300)),'PROFILE_MATURE_AGE');
 const s=p.source||{};
 must(text(s.publisher)&&text(s.terms_url,400)&&RIGHTS.has(s.redistribution)&&s.personal_info_removed===true,'PROFILE_SOURCE_TERMS');
 return p;
}
function num(v,code){const t=String(v).trim().replace(/,/g,'');must(/^-?\d+(\.\d+)?$/.test(t),code);const n=Number(t);must(Number.isFinite(n),code);return n;}
function code(v,code){const t=String(v).trim();must(/^[0-9A-Za-z-]{1,12}$/.test(t),code);return t;}

export function normalizeRegister(csvText,profile,{prefecture_code,plan_year,source_file_sha256}){
 validateProfile(profile);
 must(/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(prefecture_code||''),'PREF_CODE');
 must(Number.isSafeInteger(plan_year)&&plan_year>=1990&&plan_year<=2100,'PLAN_YEAR');
 must(sha(source_file_sha256),'SOURCE_FILE_HASH');
 const rows=parseCsv(csvText);
 must(rows.length>=2,'CSV_EMPTY');
 const header=rows[0].map(h=>h.trim());
 must(new Set(header).size===header.length,'CSV_DUPLICATE_HEADER');
 must(!header.some(h=>PERSONAL_HEADER.test(h)),'PERSONAL_DATA_COLUMNS_PRESENT');
 const col={};
 for(const [k,name] of Object.entries(profile.columns)){const i=header.indexOf(name);must(i>=0,'CSV_COLUMN_NOT_FOUND:'+k);col[k]=i;}
 const observations=[],anomalies={unmapped_forest_type:{},unknown_maturity_species:{},duplicate_local_keys:[]},seen=new Map();
 rows.slice(1).forEach((r,idx)=>{
  must(r.length===header.length,'CSV_ROW_WIDTH:'+(idx+2));
  const g=k=>col[k]===undefined?'':r[col[k]].trim();
  const municipality_cd=g('municipality_cd');must(/^\d{5,6}$/.test(municipality_cd)&&municipality_cd.startsWith(prefecture_code),'MUNICIPALITY_CODE:'+(idx+2));
  const rinpan=code(g('rinpan'),'RINPAN:'+(idx+2)),shohan=code(g('shohan'),'SHOHAN:'+(idx+2)),edaban=col.edaban===undefined||g('edaban')===''?'0':code(g('edaban'),'EDABAN:'+(idx+2));
  const rawType=g('forest_type');let forest_class=profile.forest_class_map[rawType];
  if(!forest_class){forest_class='UNKNOWN';anomalies.unmapped_forest_type[rawType]=(anomalies.unmapped_forest_type[rawType]||0)+1;}
  const species=g('species');must(species.length<=40,'SPECIES:'+(idx+2));
  const age=g('age')===''?null:num(g('age'),'AGE:'+(idx+2));must(age===null||(Number.isInteger(age)&&age>=0&&age<1000),'AGE_RANGE:'+(idx+2));
  const area_ha=num(g('area_ha'),'AREA:'+(idx+2));must(area_ha>=0&&area_ha<100000,'AREA_RANGE:'+(idx+2));
  const restricted_forest=col.restricted===undefined?null:profile.restricted_values.includes(g('restricted'));
  // Maturity (標準伐期齢 reached) is only meaningful for 育成林; other classes are NOT_APPLICABLE, unknown stays UNKNOWN.
  let age_class=forest_class==='IKUSEI'?'UNKNOWN':forest_class==='UNKNOWN'?'UNKNOWN':'NOT_APPLICABLE';
  const threshold=profile.mature_age_by_species?profile.mature_age_by_species[species]:undefined;
  if(forest_class==='IKUSEI'&&age!==null&&Number.isInteger(threshold))age_class=age>=threshold?'MATURE':'IMMATURE';
  else if(forest_class==='IKUSEI')anomalies.unknown_maturity_species[species||'(blank)']=(anomalies.unknown_maturity_species[species||'(blank)']||0)+1;
  const local_key=[municipality_cd,rinpan,shohan,edaban].join('-');
  const row_sha256=digest(r);
  const o={observation_id:'fobs_'+digest([plan_year,local_key,row_sha256,source_file_sha256,idx+2]).slice(0,32),source_row:idx+2,plan_year,prefecture_code,municipality_cd,local_key,
   forest_class,forest_type_raw:rawType,species,age,age_class,area_ha,restricted_forest,row_sha256,source_file_sha256,profile_id:profile.profile_id,geometry_sha256:null,map_state:'NOT_JOINED',review_state:'STAGED'};
  if(seen.has(local_key)){anomalies.duplicate_local_keys.push(local_key);o.review_state='DUPLICATE_LOCAL_KEY';observations[seen.get(local_key)].review_state='DUPLICATE_LOCAL_KEY';}
  else seen.set(local_key,observations.length);
  observations.push(o);
 });
 anomalies.duplicate_local_keys=[...new Set(anomalies.duplicate_local_keys)].sort();
 return {observations,anomalies};
}

/* ---------- 森林計画図 polygons (GeoJSON features; coordinates are hashed then discarded) ---------- */
export function normalizePlanFeature(feature,{prefecture_code,properties}){
 must(feature?.type==='Feature'&&feature.properties&&typeof feature.properties==='object','GEOJSON_FEATURE');
 const g=feature.geometry;must(g&&['Polygon','MultiPolygon'].includes(g.type)&&Array.isArray(g.coordinates),'NOT_POLYGON_GEOMETRY');
 const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;must(polys.length>0,'POLYGON_EMPTY');
 for(const poly of polys){must(Array.isArray(poly)&&poly.length>0,'POLYGON_RING_MISSING');for(const ring of poly){
  must(Array.isArray(ring)&&ring.length>=4&&JSON.stringify(ring[0])===JSON.stringify(ring.at(-1)),'POLYGON_RING_INVALID');
  for(const pt of ring)must(Array.isArray(pt)&&pt.length===2&&pt.every(Number.isFinite)&&pt[0]>=122&&pt[0]<=154&&pt[1]>=20&&pt[1]<=46,'COORDINATE_OUTSIDE_JAPAN_LONLAT');
 }}
 const p=feature.properties,get=k=>p[properties[k]]==null?'':String(p[properties[k]]).trim();
 const municipality_cd=get('municipality_cd');must(/^\d{5,6}$/.test(municipality_cd)&&municipality_cd.startsWith(prefecture_code),'MAP_MUNICIPALITY_CODE');
 const local_key=[municipality_cd,code(get('rinpan'),'MAP_RINPAN'),code(get('shohan'),'MAP_SHOHAN'),properties.edaban&&get('edaban')!==''?code(get('edaban'),'MAP_EDABAN'):'0'].join('-');
 return {local_key,geometry_sha256:digest(g)};
}
export function joinPlanMap(observations,mapFeatures){
 const byKey=new Map();const dupMap=new Set();
 for(const f of mapFeatures){if(byKey.has(f.local_key))dupMap.add(f.local_key);byKey.set(f.local_key,f.geometry_sha256);}
 const out=observations.map(o=>{const c=dup(o);
  if(dupMap.has(o.local_key)){c.geometry_sha256=null;c.map_state='MULTIPLE_POLYGONS_REQUIRE_REVIEW';}
  else if(byKey.has(o.local_key)){c.geometry_sha256=byKey.get(o.local_key);c.map_state='MATCHED_BY_LOCAL_KEY';}
  else {c.geometry_sha256=null;c.map_state='NO_POLYGON';}
  return c;});
 const regKeys=new Set(observations.map(o=>o.local_key));
 return {observations:out,anomalies:{polygons_without_register:[...byKey.keys()].filter(k=>!regKeys.has(k)).sort(),register_without_polygon:out.filter(o=>o.map_state==='NO_POLYGON').length,multi_polygon_keys:[...dupMap].sort()}};
}

/* ---------- stand registry with hashed human decisions ---------- */
function updated(s,event,data){
 const copy=dup(s),previous=copy.events.at(-1)?.event_hash||ZERO;
 const e={seq:copy.events.length+1,event,body_sha256:digest(data),previous_hash:previous};
 e.event_hash=digest(e);copy.events.push(e);return copy;
}
export function newStandId(){return 'std_'+randomUUID();}
export function emptyStandRegistry(){return {schema:FOREST_SCHEMA,stands:[],observations:[],candidates:[],lineage:[],evidence:[],events:[],formal_certification:false,certified_tco2_removals:null};}
export function addStand(state,{stand_id,prefecture_code,reference_hash}){
 assertStandRegistry(state);
 must(SID.test(stand_id||''),'STAND_ID');must(/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(prefecture_code||''),'PREF_CODE');must(sha(reference_hash),'REFERENCE_HASH');
 must(!state.stands.some(s=>s.stand_id===stand_id),'STAND_EXISTS');
 const s=updated(state,'ADD_STAND',{stand_id,prefecture_code,reference_hash});
 s.stands.push({stand_id,prefecture_code,reference_hash,status:'ACTIVE'});return s;
}
export function stageObservations(state,observations){
 assertStandRegistry(state);must(Array.isArray(observations)&&observations.length>0,'OBSERVATIONS');
 const ids=new Set(state.observations.map(o=>o.observation_id));
 for(const o of observations){must(o&&typeof o.observation_id==='string'&&!ids.has(o.observation_id),'OBSERVATION_DUPLICATE');ids.add(o.observation_id);}
 const s=updated(state,'STAGE_OBSERVATIONS',observations.map(o=>o.observation_id));
 for(const o of observations)s.observations.push({...dup(o),approved_stand_id:null});
 return s;
}
/* Same local_key in an earlier plan period is only a SUGGESTION; renumbering makes it unsafe to auto-link. */
export function suggestContinuity(state,observation_id){
 const o=state.observations.find(x=>x.observation_id===observation_id);must(o,'OBSERVATION_MISSING');
 return state.observations.filter(x=>x.approved_stand_id&&x.local_key===o.local_key&&x.plan_year<o.plan_year)
  .map(x=>({stand_id:x.approved_stand_id,from_observation_id:x.observation_id,basis:'SAME_LOCAL_KEY_EARLIER_PLAN',auto_approved:false,
   geometry_changed:x.geometry_sha256===null||o.geometry_sha256===null?null:x.geometry_sha256!==o.geometry_sha256,
   area_changed:x.area_ha!==o.area_ha}));
}
export function proposeLink(state,{stand_id,observation_id,reason,basis_sha256}){
 assertStandRegistry(state);
 must(state.stands.some(s=>s.stand_id===stand_id),'STAND_MISSING');
 const o=state.observations.find(x=>x.observation_id===observation_id);must(o,'OBSERVATION_MISSING');
 must(o.review_state!=='DUPLICATE_LOCAL_KEY','DUPLICATE_LOCAL_KEY_REQUIRES_SOURCE_CORRECTION');
 must(['MANUAL_REVIEW','SAME_LOCAL_KEY_EARLIER_PLAN','SPLIT_CANDIDATE','MERGE_CANDIDATE'].includes(reason),'PROPOSAL_REASON');must(sha(basis_sha256),'BASIS_HASH');
 must(!state.candidates.some(c=>c.observation_id===observation_id&&c.status==='PENDING_HUMAN_REVIEW'),'PENDING_EXISTS');
 const candidate_id='fcand_'+digest([stand_id,observation_id,state.events.length]).slice(0,32);
 const s=updated(state,'PROPOSE_LINK',{candidate_id,stand_id,observation_id,reason,basis_sha256});
 s.candidates.push({candidate_id,stand_id,observation_id,reason,basis_sha256,status:'PENDING_HUMAN_REVIEW'});return s;
}
export function reviewLink(state,{candidate_id,decision,reviewer_reference_hash,decision_evidence_sha256,reason}){
 assertStandRegistry(state);
 const c=state.candidates.find(x=>x.candidate_id===candidate_id);must(c&&c.status==='PENDING_HUMAN_REVIEW','CANDIDATE_NOT_PENDING');
 must(['APPROVE','REJECT'].includes(decision),'DECISION');must(sha(reviewer_reference_hash)&&sha(decision_evidence_sha256),'DECISION_HASHES');
 must(typeof reason==='string'&&reason.trim().length>=20&&reason.length<=1000,'DECISION_REASON_TOO_SHORT');
 const o=state.observations.find(x=>x.observation_id===c.observation_id);
 if(decision==='APPROVE'){
  must(!o.approved_stand_id,'OBSERVATION_ALREADY_LINKED');
  must(!state.observations.some(x=>x.approved_stand_id===c.stand_id&&x.plan_year===o.plan_year),'STAND_ALREADY_HAS_OBSERVATION_FOR_PLAN_YEAR');
 }
 const s=updated(state,'REVIEW_LINK',{candidate_id,decision,reviewer_reference_hash,decision_evidence_sha256,reason_sha256:digest(reason)});
 const cc=s.candidates.find(x=>x.candidate_id===candidate_id);
 cc.status=decision==='APPROVE'?'APPROVED_RESEARCH_LINK':'REJECTED';cc.decision={reviewer_reference_hash,decision_evidence_sha256,reason_sha256:digest(reason)};
 if(decision==='APPROVE'){const oo=s.observations.find(x=>x.observation_id===c.observation_id);oo.approved_stand_id=c.stand_id;oo.review_state='LINKED';}
 return s;
}
export function addStandEvidence(state,{evidence_id,stand_id,category,evidence_sha256,period_start,period_end,local_path=null}){
 assertStandRegistry(state);
 must(/^[A-Za-z0-9_.:-]{1,80}$/.test(evidence_id||'')&&!state.evidence.some(e=>e.evidence_id===evidence_id),'EVIDENCE_ID');
 must(state.stands.some(s=>s.stand_id===stand_id),'STAND_MISSING');
 must(['forest_management_plan','operation_record','protection_record','final_harvest_review'].includes(category),'EVIDENCE_CATEGORY');
 must(sha(evidence_sha256),'EVIDENCE_HASH');must(/^\d{4}-\d{2}-\d{2}$/.test(period_start||'')&&/^\d{4}-\d{2}-\d{2}$/.test(period_end||'')&&period_start<=period_end,'EVIDENCE_PERIOD');
 must(local_path===null||(typeof local_path==='string'&&local_path.startsWith('/')&&local_path.length<=1000),'EVIDENCE_LOCAL_PATH');
 const s=updated(state,'ADD_EVIDENCE',{evidence_id,stand_id,category,evidence_sha256,period_start,period_end});
 s.evidence.push({evidence_id,stand_id,category,evidence_sha256,period_start,period_end,local_path});return s;
}
export function assertStandRegistry(state){
 must(state?.schema===FOREST_SCHEMA&&['stands','observations','candidates','lineage','evidence','events'].every(k=>Array.isArray(state[k])),'SCHEMA');
 must(state.formal_certification===false&&state.certified_tco2_removals===null,'FALSE_CERTIFICATION_CLAIM');
 let prev=ZERO;
 state.events.forEach((e,i)=>{
  must(e.seq===i+1&&e.previous_hash===prev&&sha(e.body_sha256)&&sha(e.event_hash),'AUDIT_EVENT_CHAIN');
  must(digest({seq:e.seq,event:e.event,body_sha256:e.body_sha256,previous_hash:e.previous_hash})===e.event_hash,'AUDIT_EVENT_TAMPER');prev=e.event_hash;
 });
 must(new Set(state.stands.map(s=>s.stand_id)).size===state.stands.length,'STAND_DUPLICATES');
 must(new Set(state.observations.map(o=>o.observation_id)).size===state.observations.length,'OBSERVATION_DUPLICATES');
 const linked=new Set();
 for(const o of state.observations)if(o.approved_stand_id){
  must(state.stands.some(s=>s.stand_id===o.approved_stand_id),'BROKEN_OBSERVATION_LINK');
  const k=o.approved_stand_id+'|'+o.plan_year;must(!linked.has(k),'STAND_PLAN_YEAR_DUPLICATE');linked.add(k);
  must(state.candidates.some(c=>c.observation_id===o.observation_id&&c.stand_id===o.approved_stand_id&&c.status==='APPROVED_RESEARCH_LINK'),'NO_HUMAN_LINK_DECISION');
 }
 return state;
}

/* ---------- Compiler claims: only human-linked stands; evidence content never leaves the machine ---------- */
export function standClaims(state,{plan_id,manager_id,methodology_id,methodology_version,period_start,period_end,activities},rechecked){
 assertStandRegistry(state);
 must(text(plan_id,80)&&text(manager_id,80)&&text(methodology_id,40)&&text(methodology_version,40),'CLAIM_IDENTITY');
 must(/^\d{4}-\d{2}-\d{2}$/.test(period_start||'')&&/^\d{4}-\d{2}-\d{2}$/.test(period_end||'')&&period_start<=period_end,'CLAIM_PERIOD');
 must(activities&&typeof activities==='object','ACTIVITIES');
 const claims=[];
 for(const stand of state.stands){
  const act=activities[stand.stand_id];if(!act)continue;
  must(['THINNING','PROTECTION'].includes(act.operation),'OPERATION');
  const obs=state.observations.filter(o=>o.approved_stand_id===stand.stand_id).sort((a,b)=>b.plan_year-a.plan_year)[0];
  must(obs,'STAND_HAS_NO_APPROVED_OBSERVATION:'+stand.stand_id);
  const id='FCLAIM-'+stand.stand_id;
  // The register row is evidence by its canonical attributes; the compiler re-hashes this content.
  const registerContent=JSON.stringify({observation_id:obs.observation_id,row_sha256:obs.row_sha256,source_file_sha256:obs.source_file_sha256,geometry_sha256:obs.geometry_sha256,plan_year:obs.plan_year,local_key:obs.local_key});
  const base={activity_id:id,field_id:stand.stand_id,methodology_id,methodology_version,period:{start:period_start,end:period_end},source:'local:forest-register',provenance:'derived'};
  const evidence=[{id:id+'-forest_register',category:'forest_register',adapter:'gis-json-v1',content:registerContent,expected_hash:digest(registerContent),...base}];
  // Other evidence is registered by hash. Only when the caller re-read the original bytes during this build
  // (rechecked) does the claim carry a recheck receipt; otherwise it is content-less and the compiler
  // reports content_hash failure instead of trusting a stored hash.
  for(const e of state.evidence.filter(x=>x.stand_id===stand.stand_id)){
   const ok=rechecked instanceof Set&&rechecked.has(e.evidence_id);
   const receipt=ok?JSON.stringify({evidence_id:e.evidence_id,category:e.category,original_sha256:e.evidence_sha256,original_bytes_rechecked_at_build:true}):undefined;
   evidence.push({id:e.evidence_id,category:e.category,adapter:'text-v1',content:receipt,expected_hash:ok?digest(receipt):e.evidence_sha256,...base,period:{start:e.period_start,end:e.period_end}});
  }
  claims.push({provenance:'derived',program:{id:plan_id},
   field:{id:stand.stand_id,farmer_id:manager_id,program_id:plan_id,area_ha:obs.area_ha,ambiguous:obs.map_state!=='MATCHED_BY_LOCAL_KEY',local_key:obs.local_key,
    forest_class:obs.forest_class,restricted_forest:obs.restricted_forest===null?'UNKNOWN':obs.restricted_forest,age_class:obs.age_class,
    volume_table_period:Number.isInteger(act.volume_table_period)?act.volume_table_period:'UNKNOWN'},
   activity:{id,field_id:stand.stand_id,farmer_id:manager_id,program_id:plan_id,methodology_id,methodology_version,type:'forest_management',operation:act.operation,
    start:period_start,end:period_end,management_plan_certified:act.management_plan_certified===true,planned_thinning_sites:Number.isInteger(act.planned_thinning_sites)?act.planned_thinning_sites:0,
    land_conversion_planned:act.land_conversion_planned!==false,natural_disturbance:act.natural_disturbance===true,includes_final_harvest:act.includes_final_harvest===true},
   evidence,peers:[]});
 }
 return claims;
}
// Public receipts expose only aggregate anomaly counts, never local keys or raw source labels.
function publicAnomalyCounts(anomalies){
 if(!anomalies)return null;
 const out={};
 for(const key of ['duplicate_local_keys','polygons_without_register','multi_polygon_keys']){
  if(Array.isArray(anomalies[key]))out[key+'_count']=anomalies[key].length;
 }
 for(const key of ['unmapped_forest_type','unknown_maturity_species']){
  if(anomalies[key]&&typeof anomalies[key]==='object'&&!Array.isArray(anomalies[key]))
   out[key+'_count']=Object.values(anomalies[key]).reduce((sum,n)=>sum+(Number.isSafeInteger(n)&&n>=0?n:0),0);
 }
 if(Number.isSafeInteger(anomalies.register_without_polygon)&&anomalies.register_without_polygon>=0)
  out.register_without_polygon=anomalies.register_without_polygon;
 return out;
}
export function buildPublicReceipt(state,anomalies){
 assertStandRegistry(state);
 const by=k=>state.observations.reduce((m,o)=>(m[o[k]]=(m[o[k]]||0)+1,m),{});
 return {schema:'naft-p78-public-forest-receipt-v1',audit_head_sha256:state.events.at(-1)?.event_hash||ZERO,
  counts:{stands:state.stands.length,observations:state.observations.length,links_approved:state.candidates.filter(c=>c.status==='APPROVED_RESEARCH_LINK').length,
   review_pending:state.candidates.filter(c=>c.status==='PENDING_HUMAN_REVIEW').length,evidence_hashes:state.evidence.length,
   by_forest_class:by('forest_class'),by_age_class:by('age_class'),by_map_state:by('map_state')},
  anomalies:publicAnomalyCounts(anomalies),local_keys_disclosed:false,original_geometry_disclosed:false,personal_data_ingested:false,formal_certification:false,certified_tco2_removals:null};
}
export function applyPlanMap(state,plan_year,mapFeatures,map_file_sha256,prefecture_code){
 assertStandRegistry(state);must(sha(map_file_sha256),'MAP_FILE_HASH');
 must(typeof prefecture_code==='string'&&/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(prefecture_code),'MAP_PREF_CODE');
 must(Array.isArray(mapFeatures)&&mapFeatures.length>0&&mapFeatures.every(f=>typeof f.local_key==='string'&&f.local_key.startsWith(prefecture_code)&&sha(f.geometry_sha256)),'MAP_PREF_SCOPE');
 const targets=state.observations.filter(o=>o.plan_year===plan_year&&o.prefecture_code===prefecture_code);must(targets.length>0,'NO_OBSERVATIONS_FOR_PLAN_YEAR');
 must(targets.every(o=>!o.approved_stand_id),'MAP_AFTER_LINKING_REQUIRES_NEW_OBSERVATIONS');
 const joined=joinPlanMap(targets,mapFeatures);
 const s=updated(state,'APPLY_PLAN_MAP',{plan_year,prefecture_code,map_file_sha256,polygons:mapFeatures.length});
 const byId=new Map(joined.observations.map(o=>[o.observation_id,o]));
 s.observations=s.observations.map(o=>byId.has(o.observation_id)?{...byId.get(o.observation_id),map_file_sha256}:o);
 return {state:s,anomalies:joined.anomalies};
}
