import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {loadP11RiceMetadata,validateP11RiceMetadata,
 parseP11Chromatography,inspectP11RiceOriginal}
 from '../scripts/p11-rice-chromatography-guard.mjs';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const bad=(fn,r)=>{assert.throws(fn,new RegExp(r));n++;};
const m=loadP11RiceMetadata();
eq(validateP11RiceMetadata(m),true);
eq(m.primary_source.record_count,718);
eq(m.primary_source.source_file_size_bytes,122694);
eq(m.primary_source.git_blob_sha1,'575c6bc2826c1b0a7e829ea45463c77ac7048bbd');
eq(m.primary_source.sampling_dates_count,20);
eq(m.primary_source.header_field_count,28);
eq(m.primary_source.year,2023);
eq(m.primary_source.license,'NO_DATA_SPECIFIC_REUSE_LICENSE_FOUND_IN_PUBLIC_REPOSITORY');
eq(m.primary_source.raw_csv_bytes_committed_to_naft,false);
eq(m.new_original_rice_raw_csv_files_copied_to_naft,0);
eq(m.new_rice_daily_flux_rows_inserted,0);
eq(m.derived_metadata_does_not_republish_restricted_raw_csv,true);
eq(m.certified_ch4_emission_factor,null);
eq(m.certified_tco2e,null);
eq(m.primary_source.treatment_counts,{AWD:239,MSD:239,CON:240});
eq(m.supporting_files[0].records,15);
eq(m.supporting_files[1].records,537);
const head='Index,Sampling_date,Ref_lab,VialCodi,Exp,Plot,Chamber_opacity,Year,Month,Day,Tr1,Tr2,Rep,chamber number,Sampler,Code,Water_level_cm,Temp_soil,Rice_cover_prop,Env_temp_initial,Env_temp_final,Sample_time,Sample_hour,Sample_time_min ,CCH4_ppm,CCO2_ppm,NN2O_ppm,Chamber_temp';
function mk(index,treat='AWD',date='2023-06-07',ch4='1.5'){
 const data={Index:String(index),Sampling_date:date,Plot:'P08',Year:'2023',Tr1:treat,'Sample_time_min ':'10',CCH4_ppm:ch4};
 return head.split(',').map(h=>data[h]||'').join(',');
}
const fixture=Buffer.from(head+'\n'+mk(1)+'\n'+mk(2,'CON')+'\n'+mk(3,'MSD')+'\n');
const q=parseP11Chromatography(fixture);
eq(q.rows,3);
eq(q.source_columns.length,28);
eq(q.unique_sampling_dates,1);
eq(q.irrigation_sample_counts,{AWD:1,CON:1,MSD:1});
eq(q.invalid_ch4_concentration.length,0);
eq(q.invalid_elapsed_times.length,0);
bad(()=>inspectP11RiceOriginal(fixture),'PINNED_RICE_ORIGINAL_BLOB_MISMATCH');
bad(()=>parseP11Chromatography(Buffer.from(head+'\n'+mk(1,'UNKNOWN')+'\n')),'IRRIGATION_GROUP');
bad(()=>parseP11Chromatography(Buffer.from(head+'\n'+mk(1,'AWD','2023-02-30')+'\n')),'INVALID_YEAR_OR_DATE');
bad(()=>parseP11Chromatography(Buffer.from(head+'\n'+mk(1)+'\n'+mk(1)+'\n')),'DUPLICATE_SOURCE_INDEX');
const z=parseP11Chromatography(Buffer.from(head+'\n'+mk(1,'AWD','2023-06-07','broken')+'\n'));
eq(z.invalid_ch4_concentration.length,1);
const illegal=structuredClone(m);illegal.certified_tco2e=5;
bad(()=>validateP11RiceMetadata(illegal),'FALSE_FIELD_CERTIFICATION');
const fakeOriginal=structuredClone(m);fakeOriginal.primary_source.raw_csv_bytes_committed_to_naft=true;
bad(()=>validateP11RiceMetadata(fakeOriginal),'SOURCE_LICENSE_PROVENANCE');
const fakeYears=structuredClone(m);fakeYears.primary_source.year=2024;
bad(()=>validateP11RiceMetadata(fakeYears),'SOURCE_LICENSE_PROVENANCE');
const run=spawnSync(process.execPath,['scripts/p11-rice-chromatography-guard.mjs','sources'],
 {encoding:'utf8',timeout:15000,maxBuffer:100000});
eq(run.status,0);eq(JSON.parse(run.stdout),m);
const list=readFileSync('research/p11-upstream-chamber-raw/sample_data_CH4.csv','utf8');
eq(list.split('\n').length>3000,true);
console.log('NAFT_P11_RICE_CHROM_SOURCE_PASS: '+n+
 ' checks; genuine external 718 original source rows verified via GitHub connector, no raw rice redistribution or official flux claims');
