#!/usr/bin/env python3
"""P24 JAXA GeoTIFF batch04: independent offline six-file exact source replay.
Do not publish the 12k x 12k rasters; reject changes, unverified grid or class codes.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
import sys
REG = "research/p24-jaxa-lulc-2024-v25-04-batch04.json"
FIXED = json.loads(r'''{"LC_N42E142":["ee720535be4893663acaa2215b6a960c691b041ba1287783bce3d475da0a4d19",7346342,0,41519836,398614],"LC_N36E136":["0d9f336b3f3ca0128b8625144e8f84b68005801df496d9eeea3ce86fb63ef84e",8491032,null,64297088,8173654],"LC_N29E129":["ff0e482c987bdf0cfc02a4ee5b37ee12ca8d85bd1686061e2ee56d55e8f240f8",835924,0,142629951,345],"LC_N45E148":["38357f1ec13c31baf79faf88df9c16e14b68cc0e7c4416822a056d908b255d2a",2016232,0,125209878,276],"LC_N35E133":["1750aea03f685e06076e639470f98b88dcb95bf19ca55c2edef20e0bcfb3eae1",9711598,null,70919619,2660132],"LC_N32E131":["d49e31b6000a3270119a556c2626169785e275238bbeae8ab58c6e9f03a4cb9c",14703412,0,40555140,2655618]}''')
class Reject(ValueError):
    pass
def require(ok, code):
    if not ok:
        raise Reject("NAFT_P24_SOURCE_REJECTED:" + code)
def digest(path):
    p = Path(path)
    require(p.is_file() and not p.is_symlink() and p.stat().st_size <= 30_000_000, "FILE_MISSING_OR_UNSAFE")
    h = sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest(), p.stat().st_size
def validate_manifest(m):
    require(
        m.get("schema") == "naft-p24-jaxa-lulc-2024-v25-04-batch04"
        and m.get("year") == 2024 and m.get("version") == "25.04"
        and m.get("new_tiles") == 6 and m.get("known_tiles_after_batch") == 16
        and m.get("national_coverage_complete") is False
        and m.get("source_publisher_byte_authentication_verified") is False
        and m.get("source_geotiff_redistribution_permission_verified") is False
        and m.get("original_geotiffs_committed") is False
        and m.get("preview_tiles_published") is False
        and m.get("field_area_ha") is None and m.get("ag005_eligible_area_ha") is None
        and m.get("certified_tco2e") is None
        and m.get("field_ground_truth_validation_complete") is False
        and m.get("zero_value_pixels_all_source_tiles") == 0
        and m.get("water_code") == 1 and m.get("paddy_code") == 3
        and m.get("classes_count") == 15 and m.get("nodata_metadata_per_tile") is True,
        "BOUNDARY")
    tiles = m.get("rasters")
    require(isinstance(tiles,list) and len(tiles)==6 and {t["id"] for t in tiles}==set(FIXED),
            "SIX_DISTINCT_TILES")
    for t in tiles:
        name = t["id"]
        match = re.fullmatch(r"LC_N(\d{2})E(\d{3})", name)
        require(match is not None, "TILE_ID")
        lat, lon = int(match[1]), int(match[2])
        counts = t["count_by_class"]
        require(t["filename"] == name+".tif" and t["uploaded_filename"] == name+".tif"
                and (t["sha256"], t["bytes"], t["nodata"], t["water_pixels"],t["paddy_pixels"]) == tuple(FIXED[name])
                and t["bounds"] == [lon,lat,lon+1,lat+1] and t["crs"] == "EPSG:4326"
                and t["pixels"] == 144000000 and t["ha"] is None
                and t["raw_file_committed"] is False,"TILE_METADATA:"+name)
        require(type(counts) == list and len(counts) == 15
                and all(type(v) is int and v>=0 for v in counts)
                and sum(counts) == 144000000
                and counts[0] == t["water_pixels"] and counts[2] == t["paddy_pixels"],
                "PIXEL_CLASSES:"+name)
    require(sum(t["paddy_pixels"] for t in tiles) == 13888639, "BATCH_PADDY_TOTAL")
    return tiles
def replay(directory, manifest=REG):
    m = json.loads(Path(manifest).read_text(encoding="utf-8"))
    tiles = validate_manifest(m)
    # Check all six filenames/hashes before attempting any large TIFF raster reads.
    for t in tiles:
        require(digest(Path(directory)/t["uploaded_filename"]) == tuple(FIXED[t["id"]][:2]),
                "ORIGINAL_SHA256:"+t["id"])
    try:
        import numpy as np
        import rasterio
    except ImportError as err:
        raise Reject("NAFT_P24_SOURCE_REJECTED:INSTALL_RASTERIO_NUMPY") from err
    result = []
    for t in tiles:
        with rasterio.open(Path(directory)/t["uploaded_filename"]) as ds:
            require(ds.driver=="GTiff" and ds.count==1 and ds.width==12000 and ds.height==12000
                    and ds.crs is not None and ds.crs.to_epsg()==4326
                    and ds.dtypes==("uint8",) and ds.nodata==t["nodata"],
                    "TIFF_METADATA:"+t["id"])
            require(all(abs(float(x)-float(y))<2e-7 for x,y in zip(ds.bounds,t["bounds"]))
                    and all(abs(float(res)-1/12000)<1e-10 for res in ds.res),
                    "TIFF_GEO_GRID:"+t["id"])
            counts=np.zeros(256,dtype=np.int64)
            for _,window in ds.block_windows(1):
                counts += np.bincount(ds.read(1,window=window,masked=False).ravel(),minlength=256)
            require(int(counts[0])==0 and int(counts[16:].sum())==0
                    and int(counts.sum())==144000000
                    and counts[1:16].tolist()==t["count_by_class"],
                    "SOURCE_CLASS_VALUES:"+t["id"])
            result.append({"tile":t["id"],"sha256_match":True,
                           "water_pixels":int(counts[1]),"paddy_pixels":int(counts[3]),
                           "all_15_classes_match":True})
    return {"status":"P24_SIX_USER_UPLOADED_TIFFS_SOURCE_REPLAY_MATCH",
            "tiles":result,"national_coverage_complete":False,
            "field_area_ha":None,"certified_tco2e":None,
            "source_publisher_byte_authentication_verified":False}
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", help="Folder containing six original JAXA GeoTIFF files")
    parser.add_argument("--manifest",default=REG)
    args=parser.parse_args()
    try:
        print(json.dumps(replay(args.directory,args.manifest),ensure_ascii=False,indent=2))
    except (Reject, OSError, KeyError, ValueError) as e:
        print(str(e),file=sys.stderr)
        sys.exit(1)
