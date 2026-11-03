#!/usr/bin/env python3
"""P23: offline JAXA 2024 v25.04 batch03 six-tile source verifier.
No uploads or distribution. Requires rasterio+numpy only for --verify-dir.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
import sys
REG="research/p23-jaxa-lulc-2024-v25-04-batch03.json"
FIXED={
"LC_N24E153":("212666504bbfa7831dea3f5b69b6eb9a3294fdc07934437e86017e5bdf9a8223",620802,None,143975747,0),
"LC_N34E131":("1af482b16363f14ca2a2ea3deb39cc502c006eaee21b95c0b72935ccf6259064",11554210,0,66521080,2709897),
"LC_N42E145":("764ce5c99432dce781a47a0ab5e01d0ad79317ca801fec5a9b261819a0fd3bd2",617268,None,143981391,0),
"LC_N38E139":("12c7443e63121bffd1bfacfc64f1964d639da8b9cd0f0e2defcd8076a21fde06",5530364,None,80347201,6828139),
"LC_N35E140":("c5b8c899f29fcf1cf2ac86ea475e7d9b5737d1ab9ba9760f479d2ee498048c51",11448470,0,76927932,12721336),
"LC_N44E142":("3e268f401c3b1b60131be6022258631340143e992a3302eb482fd32279a466bc",8002316,None,16759638,1365944)
}
class Reject(ValueError):pass
def require(ok,code):
    if not ok:raise Reject("NAFT_P23_REJECTED:"+code)
def file_digest(path):
    p=Path(path)
    require(p.is_file() and not p.is_symlink() and p.stat().st_size <= 30_000_000,"LOCAL_FILE_TYPE_OR_SIZE")
    h=sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return h.hexdigest(),p.stat().st_size
def validate_manifest(m):
    require(m.get("schema")=="naft-p23-jaxa-lulc-2024-v25-04-batch03"
            and m.get("year")==2024 and m.get("version")=="25.04"
            and m.get("batch_new_tiles")==6 and m.get("known_tiles_after_batch")==10
            and m.get("national_coverage_complete") is False
            and m.get("source_raster_redistribution_permission_verified") is False
            and m.get("source_geotiffs_committed") is False
            and m.get("field_area_ha") is None and m.get("ag005_eligible_area_ha") is None
            and m.get("certified_credits_tco2e") is None
            and m.get("independent_publisher_source_byte_authentication") is False
            and m.get("independent_field_ground_truth_validated") is False
            and m.get("derived_tile_preview_published") is False
            and m.get("nodata_per_file") is True, "RESEARCH_BOUNDARY")
    rasters=m.get("rasters")
    require(isinstance(rasters,list) and len(rasters)==6 and {t["id"] for t in rasters}==set(FIXED),"SIX_DISTINCT_TILES")
    for t in rasters:
        id=t["id"];match=re.fullmatch(r"LC_N(\d{2})E(\d{3})",id)
        require(match is not None,"TILE_NAME")
        lat=int(match[1]);lon=int(match[2])
        sha,size,nodata,water,paddy=FIXED[id]
        c=t["count_by_class"]
        require(t["filename"]==id+".tif" and (t["sha256"],t["bytes"],t["nodata"])==(sha,size,nodata)
                and t["bounds"]==[lon,lat,lon+1,lat+1]
                and t["crs"]=="EPSG:4326" and t["pixels"]==144000000
                and t["raw_file_committed"] is False and t["ha"] is None,"TILE_IDENTITY:"+id)
        require(isinstance(c,list) and len(c)==15 and all(type(n)==int and n>=0 for n in c)
                and sum(c)==144000000 and c[0]==water and c[2]==paddy
                and t["water_pixels"]==water and t["paddy_pixels"]==paddy,"TILE_CATEGORY_COUNTS:"+id)
    return rasters
def verify(folder,manifest=REG):
    m=json.loads(Path(manifest).read_text(encoding="utf-8"));tiles=validate_manifest(m)
    try:
        import numpy as np
        import rasterio
    except ImportError as e:
        raise Reject("NAFT_P23_REJECTED:INSTALL_RASTERIO_NUMPY") from e
    results=[]
    for t in tiles:
        f=Path(folder)/t["uploaded_filename"]
        require(file_digest(f)==FIXED[t["id"]][:2],"SOURCE_HASH_OR_BYTES:"+t["id"])
        with rasterio.open(f) as ds:
            require(ds.driver=="GTiff" and ds.count==1 and ds.width==12000 and ds.height==12000
                    and ds.dtypes==("uint8",) and ds.crs is not None and ds.crs.to_epsg()==4326
                    and ds.nodata==t["nodata"],"RASTER_METADATA:"+t["id"])
            require(all(abs(float(a)-float(b))<2e-7 for a,b in zip(ds.bounds,t["bounds"]))
                    and all(abs(float(x)-1/12000)<1e-10 for x in ds.res),"GEO_GRID:"+t["id"])
            counts=np.zeros(256,dtype=np.int64)
            for _,window in ds.block_windows(1):
                block=ds.read(1,window=window,masked=False)
                counts+=np.bincount(block.ravel(),minlength=256)
            require(int(counts[0])==0 and int(counts[16:].sum())==0
                    and counts[1:16].tolist()==t["count_by_class"]
                    and int(counts.sum())==144000000,"RASTER_CLASS_PIXELS:"+t["id"])
            results.append({"tile":t["id"],"sha256":t["sha256"],"water_pixels":int(counts[1]),"paddy_pixels":int(counts[3]),"match":True})
    return {"status":"P23_SIX_ORIGINAL_JAXA_TILES_REPLAY_MATCH","year":2024,"version":"25.04","tiles":results,"source_raw_data_republished":False,"official_credit_tco2e":None}
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("directory",help="directory holding the six original uploaded GeoTIFFs")
    p.add_argument("--manifest",default=REG)
    a=p.parse_args()
    try:print(json.dumps(verify(a.directory,a.manifest),indent=2))
    except (Reject,OSError,KeyError,ValueError) as e:
        print(str(e),file=sys.stderr);sys.exit(1)
