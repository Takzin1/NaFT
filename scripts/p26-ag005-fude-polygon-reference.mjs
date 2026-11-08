#!/usr/bin/env node
/**
 * MAFF 2025+ AG-005 × Fude Polygon source-link research receipt.
 *
 * No network access, no geometry intersection, no eMAFF login, no owner/title
 * inference, no legally compliant activity-list certification or credit issuance.
 * The public fude polygon ID is NOT the eMAFF "所在・地番".
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';

const file=resolve(dirname(fileURLToPath(import.meta.url)),
  '../research/registry-source-intake-2026-11-08/maff-fude-polygon-2026-links.json');
const m=JSON.parse(readFileSync(file,'utf8'));
const supported=new Set(m.ag005_2025_plus_rules.applies_to_registered_versions);
const sources=new Map(m.official_link_registry.map(x=>[x.id,x]));
const sha=/^[0-9a-f]{64}$/;
const dec=/^(?:0|[1-9]\d{0,7})(?:\.\d{1,6})?$/;
const fail=x=>{throw new Error('P26_AG005_FUDE_BLOCKED:'+x);};
function check(v,code){if(!v)fail(code);}
function exactDate(s){
  check(typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s),'DATE_FORMAT');
  const [year,mo,day]=s.split('-').map(Number);
  const time=new Date(Date.UTC(year,mo-1,day));
  check(year>=2000&&year<=2100&&time.getUTCFullYear()===year&&
    time.getUTCMonth()+1===mo&&time.getUTCDate()===day,'DATE_INVALID');
  return time;
}
function cleanText(x,n,code){
  check(typeof x==='string'&&x.trim().length>0&&x.length<=n,code);
  return x;
}
const ALLOWED=[
'schema','activity_date','methodology_version','local_field_reference',
'polygon_dataset_year','polygon_source_id','polygon_source_url',
'polygon_feature_id','data_use_date','emaff_chiban','area_document_chiban',
'area_ha','area_document_sha256','emaff_absence_screenshot_sha256',
'polygon_local_file_sha256','review_status'
];
export function verifyFudePolygonResearchLink(input){
  check(input&&typeof input==='object'&&!Array.isArray(input)&&
    Object.keys(input).every(k=>ALLOWED.includes(k)), 'UNKNOWN_FIELDS');
  check(input.schema==='naft-p26-ag005-fude-link-request/1','SCHEMA');
  const dt=exactDate(input.activity_date);
  check(dt>=new Date('2025-01-01T00:00:00.000Z'),
    'LEGACY_PERIOD_NOT_SUPPORTED');
  check(supported.has(input.methodology_version),'METHODOLOGY_VERSION_NOT_INDEXED');
  cleanText(input.local_field_reference,100,'FIELD_REFERENCE_REQUIRED');
  check(input.polygon_dataset_year===2026,'POLYGON_DATASET_VERSION_MISMATCH');
  check(['MAFF_FUDE_VIEWER_DOWNLOAD_2026','MAFF_FUDE_FGB_2026']
    .includes(input.polygon_source_id),'UNKNOWN_POLYGON_DATASET_SOURCE');
  const polygon=sources.get(input.polygon_source_id);
  check(input.polygon_source_url===polygon.url,'SOURCE_URL_NOT_AUTHORIZED');
  const useDate=exactDate(input.data_use_date);
  check(useDate.getTime()>=dt.getTime(),'FUTURE_ACTIVITY_WITH_PAST_REFERENCE_DATE');
  check(input.review_status==='UNREVIEWED_RESEARCH_ONLY',
    'APPROVAL_CANNOT_BE_SELF_ASSERTED');
  if(input.polygon_feature_id!==null)
    cleanText(input.polygon_feature_id,100,'FEATURE_ID_INVALID');
  cleanText(input.area_document_chiban,180,'AREA_DOCUMENT_CHIBAN_REQUIRED');
  check(dec.test(input.area_ha)&&Number(input.area_ha)>0,'POSITIVE_AREA_REQUIRED');
  check(sha.test(input.area_document_sha256||''),'AREA_EVIDENCE_SHA_REQUIRED');
  if(input.polygon_local_file_sha256!==null)
    check(sha.test(input.polygon_local_file_sha256||''),'POLYGON_FILE_SHA_INVALID');
  const hasNav=typeof input.emaff_chiban==='string'&&
    input.emaff_chiban.trim().length>0;
  if(hasNav){
    cleanText(input.emaff_chiban,180,'EMAF_CHIBAN_INVALID');
    check(input.emaff_absence_screenshot_sha256===null,
      'CONFLICTING_ABSENCE_SCREENSHOT');
  }else{
    check(input.emaff_chiban===null,'EMAF_CHIBAN_INVALID');
    check(sha.test(input.emaff_absence_screenshot_sha256||''),
      'EMAF_ABSENCE_SCREENSHOT_EVIDENCE_REQUIRED');
  }
  const inputHash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const polygonOlderThanActivity=input.polygon_dataset_year <
    Number(input.activity_date.slice(0,4));
  const polygonNewerThanActivity=input.polygon_dataset_year >
    Number(input.activity_date.slice(0,4));
  const out={
    schema:'naft-p26-ag005-fude-link-research-receipt/1',
    input_sha256:inputHash,
    original_methodology_version:input.methodology_version,
    activity_date:input.activity_date,
    report_rule_effective_from:'2025-01-01',
    guide_source:'MAFF_AG005_CHIBAN_GUIDE_2025_12',
    guide_reported_pages:[18,19,20,21,22,29],
    polygon_dataset_year:input.polygon_dataset_year,
    polygon_data_source:polygon.id,
    polygon_source_url:polygon.url,
    primary_chiban_source_id:'MAFF_EMAFF_NOUCHI_NAV',
    primary_chiban_source_url:sources.get('MAFF_EMAFF_NOUCHI_NAV').url,
    reference_only_polygon_feature_id_provided:input.polygon_feature_id!==null,
    polygon_file_byte_hash_provided:input.polygon_local_file_sha256!==null,
    not_historical_polygon_snapshot:
      polygonNewerThanActivity||polygonOlderThanActivity,
    emaff_chiban_source_verified:false,
    field_area_authoritatively_measured:false,
    document_chiban_recorded:true,
    no_emaff_chiban_exception_evidence_provided:!hasNav,
    automated_emaff_to_fude_geometry_join_performed:false,
    actual_geometry_overlap_measured:false,
    legal_cadastral_boundary_verified:false,
    land_ownership_or_credit_rights_verified:false,
    actual_credit_issuance_verified:false,
    formal_certification:false,certified_tco2e:null,
    production_mint_authorized:false,
    status:'EVIDENCE_LINK_CREATED_REQUIRES_HUMAN_SPATIAL_AND_REGISTRY_REVIEW',
    source_attribution:"出典：「筆ポリゴンデータ」（農林水産省）（"+
      input.data_use_date+"に利用）",
    adaptation_note:"No geometry downloaded/changed by this adapter."
  };
  // Keep output free of individual field/chiban strings: only the input digest
  // and evidence presence status are permitted in a sharable receipt.
  out['emaff_chiban_source_verified']=false;
  return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    check(process.argv.length===3,'USAGE_INPUT_JSON');
    const raw=readFileSync(process.argv[2]);
    check(raw.length<=32768,'INPUT_TOO_LARGE');
    const result=verifyFudePolygonResearchLink(JSON.parse(raw.toString('utf8')));
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  }catch(err){
    const msg=String(err?.message||'');
    console.error(/^P26_AG005_FUDE_BLOCKED:[A-Z0-9_]+$/.test(msg)?msg:
      'P26_AG005_FUDE_BLOCKED:INVALID_INPUT');
    process.exitCode=1;
  }
}
