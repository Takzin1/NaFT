#!/usr/bin/env python3
"""P20: independently reproduce P19 public tile preview from source annual ZIP.
No network, no public raster redistribution; requires rasterio/numpy only for replay.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import pathlib
import sys
import zipfile
from io import BytesIO

SOURCE_SHA = '082cab760b66e217529f58898890eb408ffd2e757177359ffb04f1c9653d9f98'
PREVIEW_SHA = '8b8f985720b0ef90139670bae00b3ad41dbf8e560cd6e91c35062fa33544539b'
REGISTRY = 'research/p19-rice-ch4-annual-geotiff-source-register-2026-11-03.json'
TILES_X, TILES_Y = 48, 26
YEAR_START, YEAR_END = 2001, 2015
SOURCE_NAMES = {f'rice_upch4_mgCH4m2day_{y}.tif' for y in range(YEAR_START, YEAR_END + 1)}
SOURCE_ENTRIES = SOURCE_NAMES | {p + '.aux.xml' for p in SOURCE_NAMES}

def digest(buffer):
    return hashlib.sha256(buffer).hexdigest()

def base36(n, width):
    digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    if not isinstance(n, int) or n < 0 or n >= 36 ** width:
        raise ValueError('PACK_RANGE')
    s = ''
    for _ in range(width):
        s = digits[n % 36] + s
        n //= 36
    return s

def bounds(x, width, tiles):
    # P19 used Python rounding (ties-to-even), not JS Math.round.
    return round(x * width / tiles)

def round_positive(value):
    return int(round(value * 10))

def replay(zip_path, registry_path):
    raw = pathlib.Path(zip_path).read_bytes()
    if digest(raw) != SOURCE_SHA:
        raise ValueError('ZIP_SHA256_MISMATCH')
    reg = json.loads(pathlib.Path(registry_path).read_text(encoding='utf-8'))
    if digest(raw) != reg.get('original_archive_sha256'):
        raise ValueError('REGISTER_ARCHIVE_MISMATCH')
    if (reg['original_zip_entries'], reg['annual_tif_count'], reg['annual_xml_sidecars']) != (30, 15, 15):
        raise ValueError('BAD_SOURCE_REGISTER')
    if len(reg.get('years', [])) != 15:
        raise ValueError('BAD_YEAR_COUNT')
    try:
        import numpy as np
        from rasterio.io import MemoryFile
    except ImportError as e:
        raise ValueError('REPLAY_REQUIRES_NUMPY_AND_RASTERIO') from e
    packed_lines = []
    with zipfile.ZipFile(BytesIO(raw)) as z:
        infos = z.infolist()
        if len(infos) != 30 or {i.filename for i in infos} != SOURCE_ENTRIES:
            raise ValueError('ZIP_ENTRIES_MISMATCH')
        for i in infos:
            if (i.is_dir() or i.filename.startswith('/') or
                '..' in pathlib.PurePosixPath(i.filename).parts or
                i.file_size > 1024 * 1024 or i.compress_size > 1024 * 1024):
                raise ValueError('ZIP_UNSAFE_ENTRY')
        sidecar_sha = reg['sidecars_identical_sha256']
        for y in range(YEAR_START, YEAR_END + 1):
            stat = reg['years'][y - YEAR_START]
            tif = f'rice_upch4_mgCH4m2day_{y}.tif'
            if stat.get('year') != y or stat.get('tif_name') != tif:
                raise ValueError('REGISTER_YEAR_MISMATCH')
            sidecar = z.read(tif + '.aux.xml')
            if digest(sidecar) != sidecar_sha or len(sidecar) != 127:
                raise ValueError('SIDECAR_MISMATCH:' + str(y))
            binary = z.read(tif)
            if digest(binary) != stat['tif_sha256'] or len(binary) != stat['tif_bytes']:
                raise ValueError('TIF_SOURCE_BYTES_MISMATCH:' + str(y))
            with MemoryFile(binary) as m, m.open() as ds:
                if ds.width != 2808 or ds.height != 1516 or ds.count != 1 or ds.dtypes[0] != 'float32':
                    raise ValueError('RASTER_SHAPE_DTYPE:' + str(y))
                if (abs(ds.transform.a - 5000) > 0.001 or abs(ds.transform.e + 5000) > 0.001 or
                    digest(ds.crs.to_wkt().encode()) != reg['crs_wkt_sha256']):
                    raise ValueError('RASTER_CRS_OR_RESOLUTION:' + str(y))
                if ds.driver != 'GTiff' or ds.compression.value.lower() != 'lzw':
                    raise ValueError('RASTER_ENCODING:' + str(y))
                arr = ds.read(1, masked=False)
                if not np.isfinite(arr).all() or np.any(arr < 0):
                    raise ValueError('NONFINITE_OR_NEGATIVE:' + str(y))
                pos = arr[arr > 0]
                if (len(pos) != stat['pixels_positive'] or arr.size != stat['pixels_total'] or
                    arr.size - len(pos) != stat['pixels_zero']):
                    raise ValueError('PIXEL_COUNT_MISMATCH:' + str(y))
                if abs(float(np.mean(pos, dtype=np.float64)) - stat['positive_mean_mg_ch4_m2_day']) > 1e-5:
                    raise ValueError('POSITIVE_MEAN_MISMATCH:' + str(y))
                chunks = []
                nonempty = 0
                covered = 0
                for row in range(TILES_Y):
                    r0, r1 = bounds(row, ds.height, TILES_Y), bounds(row + 1, ds.height, TILES_Y)
                    for col in range(TILES_X):
                        c0, c1 = bounds(col, ds.width, TILES_X), bounds(col + 1, ds.width, TILES_X)
                        vals = arr[r0:r1, c0:c1]
                        vals = vals[vals > 0]
                        if vals.size == 0:
                            continue
                        idx = row * TILES_X + col
                        mean10 = round_positive(float(np.mean(vals, dtype=np.float64)))
                        count = int(vals.size)
                        chunks.append(base36(idx, 2) + base36(mean10, 3) + base36(count, 3))
                        nonempty += 1
                        covered += count
                if covered != len(pos) or nonempty != stat['nonempty_48x26_tiles']:
                    raise ValueError('TILE_INVARIANTS:' + str(y))
                packed_lines.append(str(y) + ':' + ''.join(chunks) + '\n')
    d = digest(''.join(packed_lines).encode())
    if (d != PREVIEW_SHA or
        d != reg['derived_preview']['sha256_of_packed_lines_year_colon_content_newline']):
        raise ValueError('PUBLIC_TILE_BYTES_MISMATCH:' + d)
    return {
        'status': 'EXACT_SOURCE_TO_PUBLIC_PREVIEW_REPLAY_MATCH',
        'source_sha256': SOURCE_SHA,
        'packed_preview_sha256': d,
        'years_replayed': 15,
        'per_year_pixels': 4256928,
        'tiles_per_year': 1248,
        'formal_certified_tco2e': None,
        'file_originals_redistributed': False,
    }

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('zip_file')
    ap.add_argument('--register', default=REGISTRY)
    args = ap.parse_args()
    try:
        print(json.dumps(replay(args.zip_file, args.register), indent=2))
    except (KeyError, ValueError, zipfile.BadZipFile) as e:
        print('NAFT_P20_REPLAY_BLOCKED:' + str(e), file=sys.stderr)
        sys.exit(1)
