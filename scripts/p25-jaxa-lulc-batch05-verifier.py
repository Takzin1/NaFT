#!/usr/bin/env python3
"""P25: verify six user-supplied 2024 JAXA v25.04 GeoTIFF originals offline.

Verifies pinned SHA-256, byte size, georeferencing, and full categorical histograms.
Does not redistribute raw rasters, estimate agricultural area, or issue credits.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
import sys

REGISTRY = "research/p25-jaxa-lulc-2024-v25-04-batch05.json"
PINNED = json.loads(r'''{"LC_N31E140":["639b707789ffd9d9b06ff49fd47b82a20cdfd088e1db18f6561dd9a8287dc241",614948,null,143999137,0],"LC_N37E136":["4cc8b3746cb2006569631243a3d3b684db935ba261697b39028fe7305dab8b6d",2764808,null,129939766,680166],"LC_N25E131":["15c0eecda4e8b8e8ce4a990363e17b0056119f1a2a51bebdf52b14eeea353382",716618,null,143448803,0],"LC_N42E140":["a2dfff81df096749cc928da406be4eed312ca18009e8d7c1fd800b5ce1b16d7a",7300876,0,55942151,903110],"LC_N39E141":["767136f77a699fce33506e311e63229fe3deba54cf5170c7625d61b39fbf8e70",13747454,null,8881288,7551974],"LC_N40E141":["7e64a6152591d29e533db7c30d8c7b3070b487e187cb96aebfe64b1610c74937",10193924,null,59867225,3101175]}''')
class Reject(ValueError):
    pass
def require(ok, reason):
    if not ok:
        raise Reject("NAFT_P25_SOURCE_REJECTED:" + reason)
def local_sha256(path):
    p=Path(path)
    require(p.is_file() and not p.is_symlink() and p.stat().st_size <= 30_000_000,
            "FILE_MISSING_OR_UNSAFE")
    h=sha256()
    with p.open("rb") as f:
        for part in iter(lambda:f.read(1024*1024),b""):
            h.update(part)
    return h.hexdigest(),p.stat().st_size
def validate_manifest(m):
    require(m.get("schema")=="naft-p25-jaxa-lulc-2024-v25-04-batch05"
        and m.get("year")==2024 and m.get("version")=="25.04"
        and m.get("new_tiles")==6 and m.get("known_tiles_after_batch")==22
        and m.get("national_coverage_complete") is False
        and m.get("source_original_user_bytes_audited_locally") is True
        and m.get("source_publisher_byte_authentication_verified") is False
        and m.get("source_geotiff_redistribution_permission_verified") is False
        and m.get("original_geotiffs_committed") is False
        and m.get("preview_tiles_published") is False
        and m.get("field_area_ha") is None and m.get("ag005_eligible_area_ha") is None
        and m.get("certified_tco2e") is None
        and m.get("field_ground_truth_validation_complete") is False
        and m.get("zero_value_pixels_all_source_tiles")==0
        and m.get("classes_count")==15 and m.get("water_code")==1
        and m.get("paddy_code")==3 and m.get("nodata_metadata_per_tile") is True,
        "RESEARCH_BOUNDARY")
    tiles=m.get("rasters")
    require(type(tiles) is list and len(tiles)==6
        and {t["id"] for t in tiles}==set(PINNED),"DISTINCT_SIX_TILES")
    for t in tiles:
        name=t["id"]
        mt=re.fullmatch(r"LC_N(\d{2})E(\d{3})",name)
        require(mt is not None,"TILE_ID")
        lat,lon=int(mt[1]),int(mt[2])
        counts=t["count_by_class"]
        require(t["filename"]==name+".tif" and t["uploaded_filename"]==name+".tif"
            and (t["sha256"],t["bytes"],t["nodata"],t["water_pixels"],t["paddy_pixels"]) == tuple(PINNED[name])
            and t["bounds"]==[lon,lat,lon+1,lat+1]
            and t["crs"]=="EPSG:4326" and t["pixels"]==144000000
            and t["ha"] is None and t["raw_file_committed"] is False,
            "SOURCE_IDENTITY:"+name)
        require(type(counts) is list and len(counts)==15
            and all(type(v) is int and v>=0 for v in counts)
            and sum(counts)==144000000
            and counts[0]==t["water_pixels"] and counts[2]==t["paddy_pixels"],
            "CLASS_HISTOGRAM:"+name)
    require(sum(t["paddy_pixels"] for t in tiles)==12236425,"PADDY_TOTAL")
    return tiles
def replay(directory, manifest=REGISTRY):
    m=json.loads(Path(manifest).read_text(encoding="utf-8"))
    tiles=validate_manifest(m)
    for t in tiles:
        require(local_sha256(Path(directory)/t["uploaded_filename"]) == tuple(PINNED[t["id"]][:2]),
            "ORIGINAL_BYTES:"+t["id"])
    try:
        import numpy as np
        import rasterio
    except ImportError as err:
        raise Reject("NAFT_P25_SOURCE_REJECTED:INSTALL_NUMPY_RASTERIO") from err
    receipts=[]
    for t in tiles:
        with rasterio.open(Path(directory)/t["uploaded_filename"]) as ds:
            require(ds.driver=="GTiff" and ds.count==1
                and ds.width==12000 and ds.height==12000
                and ds.crs is not None and ds.crs.to_epsg()==4326
                and ds.dtypes==("uint8",) and ds.nodata==t["nodata"],
                "GEOTIFF_METADATA:"+t["id"])
            require(all(abs(float(a)-float(b))<2e-7 for a,b in zip(ds.bounds,t["bounds"]))
                and all(abs(float(r)-1/12000)<1e-10 for r in ds.res),
                "GEO_GRID:"+t["id"])
            histogram=np.zeros(256,dtype=np.int64)
            for _,window in ds.block_windows(1):
                vals=ds.read(1,window=window,masked=False)
                histogram+=np.bincount(vals.ravel(),minlength=256)
            require(int(histogram[0])==0 and int(histogram[16:].sum())==0
                and int(histogram.sum())==144000000
                and histogram[1:16].tolist()==t["count_by_class"],
                "FULL_RASTER_HISTOGRAM:"+t["id"])
            receipts.append({"id":t["id"],"sha256":t["sha256"],"original_match":True,
                "water_pixels":int(histogram[1]),"paddy_pixels":int(histogram[3])})
    return {"status":"P25_ALL_SIX_LOCAL_GEOTIFF_REPLAY_MATCH","tiles":receipts,
        "new_paddy_pixels":12236425,"national_coverage_complete":False,
        "field_area_ha":None,"certified_tco2e":None,"raw_geotiffs_redistributed":False}
if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("directory",help="Local directory with all six GeoTIFF originals")
    ap.add_argument("--manifest",default=REGISTRY)
    a=ap.parse_args()
    try:
        print(json.dumps(replay(a.directory,a.manifest),ensure_ascii=False,indent=2))
    except (Reject,OSError,KeyError,ValueError) as e:
        print(str(e),file=sys.stderr)
        sys.exit(1)
