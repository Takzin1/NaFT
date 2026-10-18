/* Source-specific structural preflight for Zenodo 10.5281/zenodo.8067998.
 * Research-only inspection of local user-held bytes. Not an observed-flux
 * normalization, interval integration, licensed redistribution or approval.
 * Source checksums are pinned from GitHub Actions 39142424578; bytes are not
 * committed here and neither checksum can attest the experimental protocol.
 */
import {createHash} from 'node:crypto';

const fail=code=>{throw Error(code)};
const DAILY=['Year','DOY','Month','day','NEE-gC/m2/day','Re-gC/m2/day','GPP-gC/m2/day','CH4-gC/m2/day'];
const HOURLY=['Year','Month','Day','Hour','Minute','DOY','Ta-<?>','RH-%','VPD-kpa','Rg-W/m2','SWC-m3/m3','Rain-mm','WTD-cm','Gc-mm/s','NEE-mgCO2/m2/s','Re-mgCO2/m2/s','GPP-mgCO2/m2/s','CH4-umol/m2/s'];
const SOURCES=Object.freeze({
 CN_2023_DAILY_CARBON:Object.freeze({
  filename:'Supporting information data2.csv',
  header:Object.freeze(DAILY),rate_column:'CH4-gC/m2/day',source_unit:'g_CH4_C_m2_day',
  mass_basis:'CH4_C',expected_size:150805,
  publisher_md5:'08ff8209e69bc6719a70fe5e83a1bd0c',
  ephemeral_sha256:'391dc360ca653782b87f15c43142ced239ba006103a7644d498bbe7f7629e224'
 }),
 CN_2023_HOURLY_MOLECULAR:Object.freeze({
  filename:'Supporting information data1.csv',
  header:Object.freeze(HOURLY),rate_column:'CH4-umol/m2/s',source_unit:'umol_CH4_m2_s',
  mass_basis:'CH4_MOLECULAR',expected_size:13280065,
  publisher_md5:'d131f18e37fe0a19ef7d65c2c69d0d58',
  ephemeral_sha256:'6b0418f1cb6d95be9330109cffaff05f86c135507c3b3ce6d281c1a11f0738e0'
 })
});
export const nativeSourceContracts=Object.freeze(
 Object.fromEntries(Object.entries(SOURCES).map(([id,s])=>[id,Object.freeze({
   filename:s.filename,header:s.header,rate_column:s.rate_column,source_unit:s.source_unit,
   mass_basis:s.mass_basis,publisher_md5:s.publisher_md5,ephemeral_sha256:s.ephemeral_sha256,
   expected_size:s.expected_size
 } )])));

const POSITIVE=/^(?:0|[1-9]\d*)$/;
const NUMERIC=/^-?(?:(?:0|[1-9]\d*)(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d{1,3})?$/;
function integer(value,min,max){
 if(!POSITIVE.test(value))fail('NATIVE_INVALID_CALENDAR_INTEGER');
 const n=Number(value);
 if(!Number.isSafeInteger(n)||n<min||n>max)fail('NATIVE_INVALID_CALENDAR_INTEGER');
 return n;
}
function ordinal(year,month,day,doy){
 // Date.UTC with year 0–99 is surprising; construct ISO dates strictly instead.
 const dayText=String(year).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
 const stamp=Date.parse(dayText+'T00:00:00Z');
 if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==dayText)
  fail('NATIVE_INVALID_CALENDAR_DAY');
 const jan1=Date.parse(String(year).padStart(4,'0')+'-01-01T00:00:00Z');
 const expected=Math.floor((stamp-jan1)/86400000)+1;
 if(expected!==doy)fail('NATIVE_DOY_CALENDAR_MISMATCH');
 return Math.floor(stamp/60000);
}
function splitStrict(text){
 // Deliberately unsupported: unknown CSV quoting, encoded line breaks,
 // duplicate headers and source encodings require a separately reviewed parser.
 if(text.startsWith('\ufeff')||text.includes('\0')||text.includes('"')||
    text.includes('\r')&&!text.includes('\r\n')||!text.endsWith('\n'))
  fail('NATIVE_ENCODING_OR_CSV_STRUCTURE_UNSUPPORTED');
 if(text.includes('\r')) {
  if(text.replace(/\r\n/g,'').includes('\r'))fail('NATIVE_ENCODING_OR_CSV_STRUCTURE_UNSUPPORTED');
  text=text.replace(/\r\n/g,'\n');
 }
 const lines=text.slice(0,-1).split('\n');
 if(lines.length<2||lines.length>200001||lines.some(x=>x.length>5000||x.trim()===''))
  fail('NATIVE_ROW_COUNT_OR_SHAPE');
 return lines;
}
export function preflightChinaNativeCsv(originalBytes,{source_id,data_class}={}){
 const contract=SOURCES[source_id];
 if(!contract)fail('NATIVE_SOURCE_UNREGISTERED');
 if(data_class!=='SYNTHETIC'&&data_class!=='USER_SUPPLIED_UNVERIFIED')
  fail('NATIVE_DATA_CLASS_UNSUPPORTED');
 if(!Buffer.isBuffer(originalBytes)||originalBytes.length===0||
    originalBytes.length>14000000)fail('NATIVE_SOURCE_BYTES_SIZE_INVALID');
 const md5=createHash('md5').update(originalBytes).digest('hex');
 const sha=createHash('sha256').update(originalBytes).digest('hex');
 const matches=md5===contract.publisher_md5&&sha===contract.ephemeral_sha256&&
   originalBytes.length===contract.expected_size;
 // No user-supplied value can self-assert primary source bytes: compare against
 // independently pinned checksum metadata before source-shaped inspection.
 if(data_class==='USER_SUPPLIED_UNVERIFIED'&&!matches)
  fail('NATIVE_PINNED_SOURCE_DIGEST_MISMATCH');
 let text;
 try{text=new TextDecoder('utf-8',{fatal:true}).decode(originalBytes);}
 catch{fail('NATIVE_UTF8_DECODE_FAILED');}
 if(originalBytes.length>=3&&originalBytes[0]===0xef&&originalBytes[1]===0xbb&&originalBytes[2]===0xbf)
  fail('NATIVE_ENCODING_OR_CSV_STRUCTURE_UNSUPPORTED');
 const rows=splitStrict(text);
 const header=rows.shift().split(',');
 if(header.length!==contract.header.length||header.some((x,i)=>x!==contract.header[i]))
  fail('NATIVE_SOURCE_HEADER_MISMATCH');
 const column=header.indexOf(contract.rate_column);
 const hourly=source_id==='CN_2023_HOURLY_MOLECULAR';
 let last=null,calendarDiscontinuities=0,unknownRateLexemes=0,numericRateLexemes=0;
 for(const line of rows){
  const cells=line.split(',');
  if(cells.length!==header.length)fail('NATIVE_SOURCE_ROW_COLUMNS');
  const year=integer(cells[0],1900,2100);
  const doy=integer(cells[hourly?5:1],1,366);
  const month=integer(cells[hourly?1:2],1,12);
  const day=integer(cells[hourly?2:3],1,31);
  const localCalendarMinute=ordinal(year,month,day,doy)+(hourly?
   integer(cells[3],0,23)*60+integer(cells[4],0,59):0);
  if(last!==null){
   if(localCalendarMinute<=last)fail('NATIVE_CHRONOLOGY_DUPLICATE_OR_REVERSED');
   if(localCalendarMinute-last>(hourly?60:1440))calendarDiscontinuities++;
  }
  last=localCalendarMinute;
  // A numerical lexeme is NOT a scientifically QC-approved observation.
  if(NUMERIC.test(cells[column]))numericRateLexemes++;
  else unknownRateLexemes++;
 }
 return {
  schema:'naft-native-source-structural-preflight-v1',
  status:'SOURCE_SHAPE_ONLY_REPLAY_BLOCKED',
  dataset_doi:'10.5281/zenodo.8067998',
  source_id,source_filename:contract.filename,data_class,
  source_bytes_sha256:sha,
  matches_pinned_ephemeral_bytes:data_class==='SYNTHETIC'?false:matches,
  supplied_source_sha256_consistent_with_ephemeral_run:data_class==='SYNTHETIC'?false:matches,
  source_original_data_redistributed:false,
  publisher_license_independently_reviewed:false,
  rows_inspected:rows.length,
  rate_column:contract.rate_column,source_unit:contract.source_unit,
  mass_basis:contract.mass_basis,syntactic_numeric_lexemes:numericRateLexemes,
  unparsed_or_missing_rate_lexemes:unknownRateLexemes,
  calendar_discontinuity_boundaries:calendarDiscontinuities,
  native_calendar_fields_validated:true,
  timezone_verified:false,temporal_support_verified:false,
  source_qc_semantics_verified:false,
  actual_flux_observations_replayed:false,
  normalized_observation_csv:null,
  observed_integral_mg_ch4_m2:null,
  season_total_mg_ch4_m2:null,
  uncertainty_interval:null,causal_attribution:null,certified_tco2e:null,
  missing_requirements:['TIMEZONE_AND_INTERVAL_MEANING','PUBLISHER_LICENSE_REVIEW',
    'SOURCE_QC_FLAG_MAPPING','MEASUREMENT_METHOD_AND_CALIBRATION',
    'PERIOD_AND_FIELD_TREATMENT_REVIEW'],
  warning:'Native header, calendar, and pinned-byte checks do not establish QC, time intervals, or source authenticity. No flux integration is permitted.'
 };
}
