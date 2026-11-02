#!/usr/bin/env python3
"""P15: fail-closed, local-only Gimje original-source sampling and scientific QC.

Input: ORIGINAL Zenodo ch4.zip and input_fields_meta.xlsx.
Output: *aggregate-only* JSON to stdout; --private-fields writes a private
0600 file with FIELD-level sampling details (not published by this code).
Never computes season CH4 totals, reductions, offsets, p-values or credits.
Stdlib only. P8/P14 remain the authoritative source-identity/P7 replay gates.
"""
import argparse
from collections import Counter, defaultdict
import csv
import hashlib
import importlib.util
import io
import json
import math
from pathlib import Path, PurePosixPath
import sys

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'research/p15-gimje-sampling-cadence-2026-11-03.json'
P8=ROOT/'scripts/p8-gimje-native-dock.py'
P14=ROOT/'scripts/p14-gimje-real-original-audit.py'
STAGES={'flooding','drainage','awd'}
TREATMENTS={'cf','md_14days','md_14days+awd','md_21days',
            'md_21days+awd','md_28days','md_28days+awd'}

def require(ok, reason):
    if not ok:
        raise ValueError('NAFT_P15_SAMPLING_QC_BLOCKED:'+reason)

def load_module(filename, name):
    spec=importlib.util.spec_from_file_location(name, filename)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def numeric(s, label, allow_missing=True):
    v=str(s or '').strip()
    if v in ('', 'NA'):
        require(allow_missing, 'NON_OPTIONAL_'+label)
        return None
    try:
        n=float(v)
    except ValueError:
        raise ValueError('NAFT_P15_SAMPLING_QC_BLOCKED:INVALID_'+label)
    require(math.isfinite(n), 'NONFINITE_'+label)
    return n

def analyze_field(rows, year, treatment):
    """Scan all native rows in a field without imputing unmeasured days."""
    require(year in (2022,2023,2024), 'FIELD_YEAR')
    require(treatment in TREATMENTS, 'UNKNOWN_EXPERIMENT_TREATMENT')
    require(bool(rows) and len(rows)<=366, 'FIELD_ROW_COUNT')
    days=[]; sampled=[]; histogram=Counter(); weather_missing=0; negative=0
    measured_by_stage=Counter(); daily_by_stage=Counter()
    flux_count=0; absent=0
    for row in rows:
        require(set(row)=={'DAT','tavg','course_type','ch4_flux','rain_mm'},
                'NATIVE_COLUMNS')
        d=str(row['DAT']).strip()
        require(d.isdecimal() and 1<=int(d)<=366, 'DAT_RANGE_OR_TYPE')
        day=int(d); days.append(day)
        stage=row['course_type']
        require(stage in STAGES, 'UNKNOWN_DAILY_WATER_STAGE')
        daily_by_stage[stage]+=1
        temp=numeric(row['tavg'],'DAILY_TEMPERATURE')
        rain=numeric(row['rain_mm'],'DAILY_PRECIPITATION')
        if temp is None or rain is None:
            weather_missing+=1
        if rain is not None:
            require(rain>=0, 'NEGATIVE_PRECIPITATION')
        flux=numeric(row['ch4_flux'],'CH4_FLUX')
        if flux is None:
            absent+=1
        else:
            sampled.append(day)
            measured_by_stage[stage]+=1
            flux_count+=1
            if flux<0:
                negative+=1
    require(days==list(range(1,len(rows)+1)), 'DAILY_GRID_NOT_CONSECUTIVE')
    require(len(sampled)>0, 'NO_OBSERVED_FLUX_IN_FIELD')
    gaps=[b-a for a,b in zip(sampled,sampled[1:])]
    require(all(x>0 for x in gaps), 'DUPLICATE_OR_NONMONOTONIC_SAMPLE_DAY')
    histogram.update(gaps)
    return {
        'year':year,'treatment':treatment,
        'daily_grid_rows':len(rows),'observed_flux_rows':flux_count,
        'unmeasured_daily_grid_rows':absent,'negative_flux_values':negative,
        'weather_missing_or_invalid_rows':weather_missing,
        'first_observed_DAT':sampled[0],'last_observed_DAT':sampled[-1],
        'max_sampling_gap_days':max(gaps,default=0),
        'gaps_at_least_14_days':sum(x>=14 for x in gaps),
        'sampling_gap_histogram':dict(sorted((str(k),v) for k,v in histogram.items())),
        'daily_water_stage_counts':dict(sorted(daily_by_stage.items())),
        'observed_water_stage_counts':dict(sorted(measured_by_stage.items()))
    }

def summarized(groups, name_key):
    arr=[]
    for key,stats in sorted(groups.items()):
        value={name_key:key,**{k:stats[k] for k in (
            'fields','daily_grid_rows','observed_flux_rows',
            'unmeasured_daily_grid_rows','negative_flux_values',
            'weather_missing_or_invalid_rows','gaps_at_least_14_days')}}
        value['sample_counts_per_field']={
            str(k):v for k,v in sorted(stats['sample_counts_per_field'].items())}
        value['observed_water_stage_counts']=dict(sorted(stats['observed_water_stage_counts'].items()))
        arr.append(value)
    return arr

def aggregate(records, zip_sha, xlsx_sha):
    """Only coarse distributions; NO field IDs, coordinates or flux values."""
    require(len(records)==60,'EXACTLY_60_ORIGINAL_FIELDS')
    groups_year={}; groups_treatment={}; by_stage=Counter(); by_stage_daily=Counter()
    by_gap=Counter(); sample_counts=Counter(); overall=Counter()
    for f in records:
        for groups,k in ((groups_year,f['year']),(groups_treatment,f['treatment'])):
            if k not in groups:
                groups[k]=dict(fields=0,daily_grid_rows=0,observed_flux_rows=0,
                     unmeasured_daily_grid_rows=0,negative_flux_values=0,
                     weather_missing_or_invalid_rows=0,gaps_at_least_14_days=0,
                     sample_counts_per_field=Counter(),observed_water_stage_counts=Counter())
            group=groups[k]
            group['fields']+=1
            for field in ('daily_grid_rows','observed_flux_rows','unmeasured_daily_grid_rows',
                          'negative_flux_values','weather_missing_or_invalid_rows','gaps_at_least_14_days'):
                group[field]+=f[field]
        for k in (f['year'],):
            groups_year[k]['sample_counts_per_field'][f['observed_flux_rows']]+=1
        groups_treatment[f['treatment']]['sample_counts_per_field'][f['observed_flux_rows']]+=1
        by_stage.update(f['observed_water_stage_counts'])
        by_stage_daily.update(f['daily_water_stage_counts'])
        for map,group in ((groups_year,f['year']),(groups_treatment,f['treatment'])):
            group['observed_water_stage_counts'].update(f['observed_water_stage_counts'])
        by_gap.update({int(k):v for k,v in f['sampling_gap_histogram'].items()})
        sample_counts[f['observed_flux_rows']]+=1
        overall.update({field:f[field] for field in (
            'daily_grid_rows','observed_flux_rows','unmeasured_daily_grid_rows',
            'negative_flux_values','weather_missing_or_invalid_rows',
            'gaps_at_least_14_days')})
    require(overall['daily_grid_rows']==overall['observed_flux_rows']+
            overall['unmeasured_daily_grid_rows'],'FLUX_COVERAGE_MATH')
    require(sum(by_gap.values())==overall['observed_flux_rows']-len(records),
            'GAP_COUNT_MATCHES_OBSERVED_SAMPLES_MINUS_FIELDS')
    output={
       'schema':'naft-p15-original-gimje-sampling-cadence-qc-v1',
       'source_id':'KR_GIMJE_DAILY_2022_2024',
       'source_doi':'10.5281/zenodo.17111992',
       'status':'ORIGINAL_SOURCE_INTEGRITY_CHECKED_SAMPLING_QC_NOT_CERTIFICATION',
       'zip_sha256':zip_sha,'xlsx_sha256':xlsx_sha,
       'field_count':len(records),
       **dict(overall),
       'sample_counts_per_field':dict(sorted((str(k),v) for k,v in sample_counts.items())),
       'sampling_gap_days_histogram':dict(sorted((str(k),v) for k,v in by_gap.items())),
       'maximum_sampling_gap_days':max(by_gap,default=0),
       'observed_water_stage_counts':dict(sorted(by_stage.items())),
       'daily_water_stage_counts':dict(sorted(by_stage_daily.items())),
       'by_year':summarized(groups_year,'year'),
       'by_treatment':summarized(groups_treatment,'treatment'),
       'unmeasured_grid_is_not_diagnosed_instrument_failure':True,
       'publisher_independent_measurement_qc_verified':False,
       'sampling_interpolation_performed':False,
       'missing_flux_imputed':0,
       'negative_flux_removed':0,
       'experimental_group_comparison_is_causal':False,
       'official_emissions_reductions_tco2e':None,
       'issued_carbon_credits':None
    }
    return output

def analyze_originals(zip_path,xlsx_path):
    p8=load_module(P8,'naft_p15_p8')
    p14=load_module(P14,'naft_p15_p14')
    identity=p14.audit(zip_path,xlsx_path) # Fully replay P8 -> P7 + registry.
    raw_zip=p8.pinned(zip_path,'ch4.zip')
    raw_meta=p8.pinned(xlsx_path,'input_fields_meta.xlsx')
    fields=p14.read_meta(raw_meta,p8)
    found=set();records=[]
    with p8.secure_zip(raw_zip) as z:
        for entry in sorted((i for i in z.infolist()
                 if i.filename.endswith('.csv') and not i.is_dir()),
                 key=lambda x:x.filename):
            field_id=PurePosixPath(entry.filename).stem
            require(field_id in fields and field_id not in found,'FIELD_JOIN_EXACTLY_ONCE')
            found.add(field_id)
            year,treatment=fields[field_id]
            rows=list(csv.DictReader(io.StringIO(z.read(entry).decode('utf-8-sig'))))
            rec=analyze_field(rows,year,treatment)
            records.append({'field_id':field_id,**rec})
    require(found==set(fields),'UNMATCHED_EXCEL_FIELD')
    summary=aggregate(records,hashlib.sha256(raw_zip).hexdigest(),
                       hashlib.sha256(raw_meta).hexdigest())
    require(summary['daily_grid_rows']==identity['native_day_rows'] and
      summary['observed_flux_rows']==identity['observed_flux'] and
      summary['unmeasured_daily_grid_rows']==identity['missing_not_imputed'] and
      summary['negative_flux_values']==identity['negative_not_censored'],
      'P14_SOURCE_NATIVE_REPLAY_MISMATCH')
    expected=json.loads(SOURCE.read_text(encoding='utf8'))
    require(summary==expected, 'PUBLIC_P15_SOURCE_REGISTER_REPLAY_MISMATCH')
    return summary,records

def write_private(path,records):
    dest=Path(path)
    require(dest.parent.is_dir() and not dest.exists(),'PRIVATE_REPORT_DESTINATION_EXISTS')
    # Private inspection only; never embedded in public static website.
    with dest.open('x',encoding='utf8') as f:
        import os
        os.chmod(dest,0o600)
        json.dump({'scope':'PRIVATE_FIELD_QC_NOT_TO_BE_COMMITTED',
                   'authoritative_lab_qc':False,'fields':records},f,ensure_ascii=False,indent=2)
        f.write('\n')

def main():
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('zip_original')
    cli.add_argument('xlsx_original')
    cli.add_argument('--private-fields',metavar='OUT_JSON',default=None)
    args=cli.parse_args()
    summary,fields=analyze_originals(args.zip_original,args.xlsx_original)
    if args.private_fields:
        write_private(args.private_fields,fields)
    print(json.dumps(summary,sort_keys=True,ensure_ascii=False))

if __name__=='__main__':
    try:main()
    except (ValueError,OSError,KeyError,UnicodeError,TypeError,AssertionError) as err:
        print(str(err),file=sys.stderr)
        sys.exit(1)
