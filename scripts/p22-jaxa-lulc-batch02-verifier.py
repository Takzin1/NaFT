#!/usr/bin/env python3
"""P22 JAXA annual LULC batch source audit. Offline, blockwise, no raster copying."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

DEFAULT_MANIFEST="research/p22-jaxa-lulc-2024-v25-04-batch02.json"
EXPECTED_ID="LC_N30E129"
EXPECTED_SHA256="a77b4d6a4f2e7bd4702c4b035fe51c2579abb8916ebad8b830d629c3bcc9a766"
EXPECTED_BYTES=651876
EXPECTED_COUNTS=[143766652,861,0,1925,25342,1414,8,116478,539,19246,62474,0,21,11,5029]

class InvalidSource(ValueError):
    pass

def require(value, code):
    if not value:
        raise InvalidSource("NAFT_P22_JAXA_REJECTED:"+code)

def sha256_file(path):
    path=Path(path)
    require(path.is_file() and not path.is_symlink(), "SOURCE_FILE_UNAVAILABLE_OR_SYMLINK")
    require(path.stat().st_size<=500_000_000, "SOURCE_FILE_TOO_LARGE")
    digest=hashlib.sha256()
    with path.open("rb") as f:
        for piece in iter(lambda:f.read(1024*1024), b""):
            digest.update(piece)
    return digest.hexdigest(),path.stat().st_size

def validate_manifest(m):
    require(m.get("schema")=="naft-p22-jaxa-lulc-2024-v25-04-batch02"
        and m.get("year")==2024 and m.get("version")=="25.04"
        and m.get("complete_national_coverage") is False
        and m.get("original_geotiff_redistribution_permission_verified") is False
        and m.get("original_geotiff_committed") is False
        and m.get("independent_ground_truth_validated") is False
        and m.get("official_credit_tco2e") is None
        and m.get("field_area_ha") is None
        and m.get("batch_new_tiles")==1
        and m.get("total_known_tiles_after_batch")==4
        and m.get("water_class")==1 and m.get("paddy_class")==3
        and m.get("nodata_is_not_class_1") is True, "INCOMPATIBLE_SCOPE")
    source=m.get("rasters")
    require(isinstance(source,list) and len(source)==1, "ONE_TILE_BATCH_EXPECTED")
    t=source[0]
    require(t.get("id")==EXPECTED_ID
        and t.get("filename")==EXPECTED_ID+".tif"
        and t.get("sha256")==EXPECTED_SHA256
        and t.get("bytes")==EXPECTED_BYTES
        and t.get("bounds")==[129,30,130,31]
        and t.get("crs")=="EPSG:4326"
        and t.get("nodata") is None
        and t.get("pixels")==144000000
        and t.get("ha") is None
        and t.get("raw_file_committed") is False, "SOURCE_IDENTITY_MISMATCH")
    count=t.get("count_by_class")
    require(isinstance(count,list) and count==EXPECTED_COUNTS
        and all(type(v) is int and v>=0 for v in count)
        and sum(count)==144000000 and t.get("water_pixels")==count[0]
        and t.get("paddy_pixels")==count[2], "PIXEL_CLASS_MISMATCH")
    return t

def verify_one(source_path, manifest_path=DEFAULT_MANIFEST):
    r=json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    t=validate_manifest(r)
    require(sha256_file(source_path)==(EXPECTED_SHA256,EXPECTED_BYTES),"ORIGINAL_BYTES_MISMATCH")
    try:
        import rasterio
        import numpy as np
    except ImportError as e:
        raise InvalidSource("NAFT_P22_JAXA_REJECTED:RASTERIO_AND_NUMPY_REQUIRED") from e
    with rasterio.open(source_path) as ds:
        require(ds.driver=="GTiff" and ds.count==1
            and ds.dtypes==("uint8",) and ds.width==12000 and ds.height==12000
            and ds.crs is not None and ds.crs.to_epsg()==4326
            and ds.nodata is None, "RASTER_METADATA_MISMATCH")
        require(all(abs(a-b)<1e-7 for a,b in zip(ds.bounds,t["bounds"]))
            and all(abs(x-1/12000)<1e-10 for x in ds.res),
            "RASTER_BOUNDS_OR_GRID_MISMATCH")
        counts=np.zeros(256,dtype=np.int64)
        for _,window in ds.block_windows(1):
            block=ds.read(1,window=window,masked=False)
            counts+=np.bincount(block.ravel(),minlength=256)
        require(int(counts[0])==0 and int(counts[16:].sum())==0
            and counts[1:16].tolist()==EXPECTED_COUNTS
            and int(counts.sum())==144000000, "RASTER_CLASS_PIXELS_MISMATCH")
    return {"status":"JAXA_V25_04_BATCH02_ORIGINAL_SOURCE_EXACT_MATCH",
        "tile":t["id"],"sha256":t["sha256"],"total_pixels":144000000,
        "water_pixels":int(counts[1]),"paddy_pixels":int(counts[3]),
        "nationwide_coverage":False,"area_ha":None,"certified_tco2e":None}

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("tif",help="Path to the original LC_N30E129.tif")
    parser.add_argument("--manifest",default=DEFAULT_MANIFEST)
    a=parser.parse_args()
    try:
        print(json.dumps(verify_one(a.tif,a.manifest),ensure_ascii=False,indent=2))
    except (InvalidSource,OSError,KeyError,ValueError) as ex:
        print(str(ex),file=sys.stderr)
        sys.exit(1)
