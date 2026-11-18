/* NaFT P80 · AG-005 生産管理記録 (farm log) → Evidence Compiler claims. Local-only, research-only.
 *
 * Normalisation follows the AG-005 Ver.3.1/3.3 texts as read in P79:
 *  - 中干し期間: start and end dates each count as one day (inclusive); if heading (出穂) falls inside the period,
 *    the day before heading is the end date; heading before the start is invalid.
 *  - Baseline: the most recent ≥2 consecutive years before the project year; in years with ≥2 cropping cycles the
 *    days are summed and divided by the total number of cycles; fractions are rounded UP to a whole day.
 *  - 排水性: measured 日減水深 × 1.22 → <7.5 排水不良 / <12.5 日排除 / ≥12.5 4時間排除; otherwise the default class.
 *  - 施用有機物: straw ≥90% / compost ≥1 t/10a thresholds and formula 5/6/7 routing (factors themselves not pinned).
 * No emission factors, GWP or tCO2e are produced. Unknown/malformed values stop the import.
 */
import {createHash} from 'node:crypto';
import {decodeRegisterBytes,parseCsv} from './forest-stand-identity.mjs';

export const FARM_LOG_PROFILE_SCHEMA='naft-p80-ag005-farm-log-profile-1';
const REQUIRED=['field_ref','year','cycle','drain_start','drain_end','heading_date','planted_area_ha','straw_pct','compost_t_10a','drainage_basis'];
const OPTIONAL=['percolation_mm_day','land_consolidation'];
const PERSONAL=/(氏名|住所|電話|owner|address|phone|生年月日)/i;
function fail(code){throw new Error('P80_AG005_LOG_BLOCKED:'+code);}
function must(c,code){if(!c)fail(code);}
export const sha256=x=>createHash('sha256').update(x).digest('hex');
const DAY=86400000;
function isoDay(s,code){must(/^\d{4}-\d{2}-\d{2}$/.test(s),code);const t=Date.parse(s+'T00:00:00Z');must(Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s,code);return t;}
function num(v,code,{min=0,max=Infinity}={}){const t=String(v).trim();must(/^\d+(\.\d+)?$/.test(t),code);const n=Number(t);must(n>=min&&n<=max,code);return n;}

export function validateFarmLogProfile(p){
 must(p&&p.schema===FARM_LOG_PROFILE_SCHEMA&&typeof p.profile_id==='string'&&p.profile_id,'PROFILE_SCHEMA');
 must(['utf-8','shift_jis'].includes(p.encoding),'PROFILE_ENCODING');
 for(const k of REQUIRED)must(typeof p.columns?.[k]==='string'&&p.columns[k],'PROFILE_COLUMN_MISSING:'+k);
 for(const k of Object.keys(p.columns))must(REQUIRED.includes(k)||OPTIONAL.includes(k),'PROFILE_COLUMN_UNKNOWN:'+k);
 must(p.drainage_basis_values&&Object.values(p.drainage_basis_values).every(v=>['MEASURED','DEFAULT'].includes(v)),'PROFILE_DRAINAGE_BASIS_MAP');
 must(p.columns.land_consolidation===undefined||(Array.isArray(p.true_values)&&p.true_values.length),'PROFILE_TRUE_VALUES');
 must(p.source&&['PERMITTED','PROHIBITED','NOT_VERIFIED'].includes(p.source.redistribution)&&p.source.personal_info_removed===true,'PROFILE_SOURCE_TERMS');
 return p;
}
export function drainageDays({drain_start,drain_end,heading_date}){
 const s=isoDay(drain_start,'DRAIN_START'),e=isoDay(drain_end,'DRAIN_END'),h=isoDay(heading_date,'HEADING_DATE');
 must(e>=s,'DRAIN_END_BEFORE_START');must(h>s,'HEADING_NOT_AFTER_DRAINAGE_START');
 const end=h<=e?h-DAY:e;                       // heading during drainage → previous day is the end
 return {days:Math.round((end-s)/DAY)+1,effective_end:new Date(end).toISOString().slice(0,10),ended_by_heading:h<=e};
}
export function drainageClass(basis,percolation){
 if(basis==='DEFAULT')return {basis,class:'DEFAULT_LOWEST_FACTOR_CLASS',adjusted_mm_day:null};
 must(basis==='MEASURED'&&typeof percolation==='number'&&Number.isFinite(percolation)&&percolation>=0,'PERCOLATION_REQUIRED_FOR_MEASURED');
 const d=Math.round(percolation*1.22*1000)/1000;
 return {basis,adjusted_mm_day:d,class:d<7.5?'POOR_DRAINAGE':d<12.5?'DAILY_DRAINAGE':'FOUR_HOUR_DRAINAGE'};
}
export function organicMatterRoute(straw,compost){
 if(straw>=90&&compost>=1)return 'BOTH_FULL_USE_HIGHER_FACTOR';
 if(straw>0&&compost>0)return 'FORMULA_7_CAPPED';   // y≤90, z≤1
 if(straw>=90)return 'STRAW_FACTOR';
 if(compost>=1)return 'COMPOST_FACTOR';
 if(straw>0)return 'FORMULA_5';
 if(compost>0)return 'FORMULA_6';
 return 'NO_APPLICATION_FACTOR';
}
export function parseFarmLog(text,profile){
 validateFarmLogProfile(profile);
 const rows=parseCsv(text);must(rows.length>=2,'CSV_EMPTY');
 const header=rows[0].map(h=>h.trim());must(new Set(header).size===header.length,'CSV_DUPLICATE_HEADER');
 must(!header.some(h=>PERSONAL.test(h)),'PERSONAL_DATA_COLUMNS_PRESENT');
 const col={};for(const [k,n] of Object.entries(profile.columns)){const i=header.indexOf(n);must(i>=0,'CSV_COLUMN_NOT_FOUND:'+k);col[k]=i;}
 const seen=new Set();
 return rows.slice(1).map((r,idx)=>{
  const line=idx+2;must(r.length===header.length,'CSV_ROW_WIDTH:'+line);
  const g=k=>col[k]===undefined?'':r[col[k]].trim();
  const field_ref=g('field_ref');must(/^[A-Za-z0-9_.:-]{1,80}$/.test(field_ref),'FIELD_REF:'+line);
  const year=num(g('year'),'YEAR:'+line,{min:2000,max:2100}),cycle=num(g('cycle'),'CYCLE:'+line,{min:1,max:4});
  must(Number.isInteger(year)&&Number.isInteger(cycle),'YEAR_OR_CYCLE_INTEGER:'+line);
  const key=field_ref+'|'+year+'|'+cycle;must(!seen.has(key),'DUPLICATE_FIELD_YEAR_CYCLE:'+line);seen.add(key);
  const rawBasis=g('drainage_basis'),basis=profile.drainage_basis_values[rawBasis];must(basis,'DRAINAGE_BASIS_UNMAPPED:'+line);
  const perc=g('percolation_mm_day')===''?null:num(g('percolation_mm_day'),'PERCOLATION:'+line,{max:500});
  const dd=drainageDays({drain_start:g('drain_start'),drain_end:g('drain_end'),heading_date:g('heading_date')});
  must(Number(g('drain_start').slice(0,4))===year,'DRAIN_START_YEAR_MISMATCH:'+line);
  return {line,field_ref,year,cycle,...dd,drain_start:g('drain_start'),heading_date:g('heading_date'),
   planted_area_ha:num(g('planted_area_ha'),'AREA:'+line,{max:10000}),straw_pct:num(g('straw_pct'),'STRAW:'+line,{max:100}),
   compost_t_10a:num(g('compost_t_10a'),'COMPOST:'+line,{max:100}),drainage_basis:basis,percolation_mm_day:perc,
   land_consolidation:col.land_consolidation===undefined?false:profile.true_values.includes(g('land_consolidation')),row_sha256:sha256(JSON.stringify(r))};
 });
}
/* 適用条件1: most recent ≥2 consecutive baseline years; Σdays/Σcycles rounded up. */
export function baselineFor(rows,field_ref,project_year){
 const b=rows.filter(r=>r.field_ref===field_ref&&r.year<project_year);
 const years=[...new Set(b.map(r=>r.year))].sort((a,c)=>c-a);
 must(years.length>=2,'BASELINE_FEWER_THAN_TWO_YEARS:'+field_ref);
 must(years[0]===project_year-1,'BASELINE_NOT_MOST_RECENT:'+field_ref);
 let used=[];for(const y of years){if(used.length&&used.at(-1)-1!==y)break;used.push(y);}
 must(used.length>=2,'BASELINE_YEARS_NOT_CONSECUTIVE:'+field_ref);
 const rs=b.filter(r=>used.includes(r.year)),sum=rs.reduce((a,r)=>a+r.days,0);
 return {years:used.sort(),cycles:rs.length,total_days:sum,average_days_ceil:Math.ceil(sum/rs.length)};
}
export function buildAg005Claims(rows,program,evidence){
 must(program&&typeof program.program_id==='string'&&typeof program.farmer_id==='string','PROGRAM_IDENTITY');
 must(['3.1-pc-text','3.3-pc-draft-text'].includes(program.methodology_version),'METHODOLOGY_VERSION');
 for(const k of ['project_year','registration_year','cert_start_year'])must(Number.isInteger(program[k])&&program[k]>=2000&&program[k]<=2100,'PROGRAM_'+k.toUpperCase());
 const project=rows.filter(r=>r.year===program.project_year);must(project.length>0,'NO_PROJECT_YEAR_ROWS');
 const ev=Array.isArray(evidence)?evidence:[];
 const claims=[],report=[],errors=[];
 for(const r of project.sort((a,b)=>a.field_ref<b.field_ref?-1:a.field_ref>b.field_ref?1:a.cycle-b.cycle)){
  // A field whose baseline or drainage inputs are unusable is held back (fail closed per field), not silently fixed.
  let base,dc;
  try{base=baselineFor(rows,r.field_ref,program.project_year);dc=drainageClass(r.drainage_basis,r.percolation_mm_day);}
  catch(err){errors.push({field_ref:r.field_ref,cycle:r.cycle,line:r.line,error:err.message});continue;}
  const om=organicMatterRoute(r.straw_pct,r.compost_t_10a);
  const id='RCLAIM-'+r.field_ref+'-'+r.year+'-C'+r.cycle,version=program.methodology_version,start=r.drain_start,end=r.effective_end;
  const bind={activity_id:id,field_id:r.field_ref,methodology_id:'AG-005',methodology_version:version,period:{start,end},provenance:'derived'};
  const evidenceItems=[];
  const logContent=JSON.stringify({row_sha256:r.row_sha256,baseline_rows:rows.filter(x=>x.field_ref===r.field_ref&&base.years.includes(x.year)).map(x=>x.row_sha256)});
  // The farm log itself evidences the dates/days records it contains.
  for(const cat of ['project_drainage_dates_record','baseline_drainage_days_record','heading_date_record','organic_matter_record'])
   evidenceItems.push({id:id+'-log-'+cat,category:cat,adapter:'farm-log-json-v1',content:logContent,expected_hash:sha256(logContent),source:'local:farm-log',...bind});
  for(const e of ev.filter(x=>x.field_ref===r.field_ref&&x.year===r.year)){
   const receipt=e.rechecked?JSON.stringify({evidence_id:e.evidence_id,category:e.category,original_sha256:e.sha256,original_bytes_rechecked_at_build:true}):undefined;
   evidenceItems.push({id:e.evidence_id,category:e.category,adapter:'text-v1',content:receipt,expected_hash:receipt?sha256(receipt):e.sha256,source:'local:evidence-manifest',...bind,period:{start,end}});
  }
  claims.push({provenance:'derived',program:{id:program.program_id},
   field:{id:r.field_ref,farmer_id:program.farmer_id,program_id:program.program_id,area_ha:r.planted_area_ha,ambiguous:false},
   activity:{id,field_id:r.field_ref,farmer_id:program.farmer_id,program_id:program.program_id,methodology_id:'AG-005',methodology_version:version,
    type:'midseason_drainage_extension',start,end,extension_days:r.days-base.average_days_ceil,baseline_years:base.years.length,
    drainage_basis:dc.basis,land_consolidation:r.land_consolidation,post_2025_activity:r.year>=2025,
    registration_year:program.registration_year,extension_start_year:program.project_year,cert_start_year:program.cert_start_year,
    years_cert_start_after_registration:program.cert_start_year-program.registration_year},
   evidence:evidenceItems,peers:[]});
  report.push({claim_id:id,field_ref:r.field_ref,cycle:r.cycle,project_days:r.days,ended_by_heading:r.ended_by_heading,baseline:base,
   extension_days:r.days-base.average_days_ceil,drainage:dc,organic_matter_route:om});
 }
 return {claims,report,errors};
}
