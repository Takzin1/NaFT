#!/usr/bin/env python3
"""P14: deterministic offline replay against *actual* original Gimje ZIP + XLSX.
Reuses P8's exact published-MD5 gate, native source parser and P7 QC adapter.
This script never writes or republishes source observations, location metadata,
field-level records or any certified emissions. Stdlib + Node.js 20+ required.
"""
import csv
import hashlib
import importlib.util
import io
import json
from collections import Counter
from pathlib import Path, PurePosixPath
import sys

BASE = Path(__file__).resolve().parent.parent
REGISTRY = BASE / 'research/p14-gimje-real-original-source-audit-2026-11-03.json'
P8 = BASE / 'scripts/p8-gimje-native-dock.py'

def check(condition, label):
    if not condition:
        raise ValueError('NAFT_P14_ORIGINAL_SOURCE_REPLAY_BLOCKED:' + label)

def read_meta(raw, p8):
    candidates = []
    for sheet, rows in p8.spreadsheet_rows(raw):
        for i, header in enumerate(rows[:12]):
            keys = [str(v).strip().lower() for v in header]
            needed = ('field_id', 'year', 'water_management')
            if not all(k in keys for k in needed):
                continue
            indexes = [keys.index(k) for k in needed]
            fields = {}
            for row in rows[i+1:]:
                if len(row) <= max(indexes) or not str(row[indexes[0]]).strip():
                    continue
                fid = str(row[indexes[0]]).strip()
                check(fid not in fields, 'DUPLICATE_META_FIELD')
                year = int(float(str(row[indexes[1]])))
                management = str(row[indexes[2]]).strip()
                check(year in (2022, 2023, 2024), 'INVALID_META_YEAR')
                check(management != '', 'NO_ORIGINAL_TREATMENT')
                fields[fid] = (year, management)
            candidates.append((sheet, fields))
    check(len(candidates) == 1 and len(candidates[0][1]) == 60, 'METADATA_EXACT_60_FIELDS')
    return candidates[0][1]

def audit(zip_path, xlsx_path):
    registry = json.loads(REGISTRY.read_text(encoding='utf8'))
    spec = importlib.util.spec_from_file_location('naft_p8_gimje', P8)
    p8 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(p8)
    original_zip = p8.pinned(zip_path, 'ch4.zip')
    original_xlsx = p8.pinned(xlsx_path, 'input_fields_meta.xlsx')
    for tag, data, expected in [
        ('ZIP', original_zip, registry['source_files']['ch4_zip']),
        ('XLSX', original_xlsx, registry['source_files']['input_fields_meta_xlsx'])
    ]:
        check(hashlib.sha256(data).hexdigest() == expected['sha256'], tag+'_SHA256_MISMATCH')
        check(hashlib.md5(data).hexdigest() == expected['published_md5'], tag+'_PUBLISHED_MD5')
        check(len(data) == expected['bytes'], tag+'_SOURCE_SIZE')
    metadata = read_meta(original_xlsx, p8)
    actual, p8_report = p8.build(original_zip, original_xlsx)
    check(hashlib.sha256(actual).hexdigest() == registry['canonical_p7']['csv_sha256'],
          'CANONICAL_P7_BYTES_MISMATCH')
    check(len(actual) == registry['canonical_p7']['csv_bytes'], 'CANONICAL_P7_FILE_SIZE')
    check(p8_report['native_csv_files'] == 60 and p8_report['native_row_count'] == 8391,
          'P8_REAL_SOURCE_JOIN')
    check(p8_report['p7_missing_flux'] == 6969, 'P7_MISSING_NO_ZERO_IMPUTATION')
    check(p8_report['native_archive_sha256'] == registry['source_files']['ch4_zip']['sha256'],
          'P8_ARCHIVE_PROVENANCE')
    check(p8_report['independent_chamber_qc_approved'] is False
          and p8_report['certified_tco2e'] is None, 'FALSE_VALIDATION')

    by_year = {}
    by_treatment = {}
    global_stages = Counter()
    seen = set()
    for info in p8.secure_zip(original_zip).infolist():
        if info.is_dir() or not info.filename.endswith('.csv'):
            continue
        fid = PurePosixPath(info.filename).stem
        check(fid in metadata and fid not in seen, 'FIELD_ID_NOT_LINKED_EXACTLY_ONCE')
        seen.add(fid)
        yr, treatment = metadata[fid]
        with p8.secure_zip(original_zip) as archive:
            rows = list(csv.DictReader(io.StringIO(archive.read(info).decode('utf-8-sig'))))
        check(bool(rows) and all(set(row) ==
              {'DAT','tavg','course_type','ch4_flux','rain_mm'} for row in rows),
              'ORIGINAL_COLUMN_SCHEMA')
        days = len(rows)
        present = sum(1 for row in rows if row['ch4_flux'] not in ('', 'NA'))
        negatives = sum(1 for row in rows if row['ch4_flux'] not in ('', 'NA')
                        and float(row['ch4_flux']) < 0)
        stages = Counter(row['course_type'] for row in rows)
        check(set(stages) <= {'flooding','drainage','awd'}, 'SOURCE_COURSE_TYPE_CHANGED')
        global_stages.update(stages)
        targets = ((by_year, yr), (by_treatment, treatment))
        for target, key in targets:
            if key not in target:
                target[key] = dict(fields=0, day_rows=0, reported_flux=0,
                                   missing_flux=0, negative_flux=0)
            s = target[key]
            s['fields'] += 1
            s['day_rows'] += days
            s['reported_flux'] += present
            s['missing_flux'] += days-present
            s['negative_flux'] += negatives
            if target is by_year:
                for state, n in stages.items():
                    s[state] = s.get(state, 0) + n
    check(len(seen) == 60 and seen == set(metadata), 'NOT_ALL_60_CSV_MATCHED')
    for expected in registry['year_stats']:
        yr = expected['year']
        check(by_year.pop(yr, None) == {k:v for k,v in expected.items() if k != 'year'},
              'ORIGINAL_YEAR_STATS_CHANGED:'+str(yr))
    check(not by_year, 'EXTRA_SOURCE_YEAR')
    for expected in registry['treatment_stats']:
        name = expected['treatment']
        check(by_treatment.pop(name, None) ==
              {k:v for k,v in expected.items() if k != 'treatment'},
              'ORIGINAL_TREATMENT_STATS_CHANGED:'+name)
    check(not by_treatment, 'EXTRA_SOURCE_TREATMENT')
    overall=registry['observations']
    check(global_stages==overall['source_daily_course_type_counts'],
          'DAILY_COURSE_NOT_METADATA_TREATMENT')
    check(sum(x['reported_flux'] for x in registry['year_stats']) == overall['valid_reported_flux'],
          'OBSERVED_FLUX_COUNT')
    check(sum(x['missing_flux'] for x in registry['year_stats']) == overall['missing_flux'],
          'MISSING_FLUX_COUNT')
    check(sum(x['negative_flux'] for x in registry['year_stats']) == overall['negative_flux'],
          'NEGATIVE_FLUX_RETAINED')
    return {'status':'P14_ACTUAL_ZENODO_SOURCE_BYTES_AND_P7_REPLAY_MATCH',
            'doi':registry['doi'],'source_files':60,'field_metadata_matches':len(seen),
            'native_day_rows':overall['native_day_rows'],
            'observed_flux':overall['valid_reported_flux'],
            'missing_not_imputed':overall['missing_flux'],
            'negative_not_censored':overall['negative_flux'],
            'canonical_csv_sha256':hashlib.sha256(actual).hexdigest(),
            'p7_qc_receipt_sha256':p8_report['p7_qc_receipt_sha256'],
            'source_qc_verified':False,'certified_tco2e':None}

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python3 scripts/p14-gimje-real-original-audit.py ch4.zip input_fields_meta.xlsx',
              file=sys.stderr)
        sys.exit(2)
    try:
        print(json.dumps(audit(sys.argv[1],sys.argv[2]), ensure_ascii=False,sort_keys=True))
    except (OSError,ValueError,KeyError,IndexError,TypeError,AssertionError,
            ImportError,UnicodeError) as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
