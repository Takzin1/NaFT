#!/usr/bin/env python3
"""P27: offline SHA-pinned GMW raster and Asian CH4 isotope CSV intake.

Binary GeoTIFF originals and row-level source samples stay local. No grid
emission, source-isotope to flux conversion, carbon stock, project credit,
cadastral ownership, GMW-year mapping or Web3 mint authorization is inferred.
"""
from collections import Counter
import argparse
import csv
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT/"research/sea9-rice-ch4-2026-11-08"
GMW = DIR/"gmw-v4112-partial-tile-catalog.json"
ISOTOPE = DIR/"asia-ch4-isotope-source-register.json"
TILE = re.compile(r"GMW_N([0-9]{2})E([0-9]{3})_v4112_mng_ext[.]tif$")
HASH = re.compile(r"[0-9a-f]{64}$")
DAY = re.compile(r"(20[0-9]{2})/([01][0-9])/([0-3][0-9])(?:[–-]([0-3][0-9]))?$")

def deny(reason):
    raise ValueError("P27_ASIA_SOURCE_BLOCKED:"+reason)

def file_sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for piece in iter(lambda:f.read(1024*1024),b""):
            h.update(piece)
    return h.hexdigest()

def decimal(value, field, lower=None, upper=None):
    try:
        d=Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        deny("INVALID_"+field)
    if not d.is_finite() or (lower is not None and d<lower) or \
            (upper is not None and d>upper):
        deny("INVALID_"+field)
    return d

def iso_date(raw):
    m=DAY.fullmatch(raw)
    if not m:deny("SAMPLING_DATE_FORMAT")
    from datetime import date
    y,mo,d,end=m.groups()
    try:
        date(int(y),int(mo),int(d))
        if end is not None and int(end)<int(d):deny("SAMPLING_DATE_RANGE")
        if end is not None:date(int(y),int(mo),int(end))
    except ValueError:
        deny("SAMPLING_DATE_INVALID")
    return int(y)

def read_manifest():
    g=json.loads(GMW.read_text(encoding="utf-8"))
    i=json.loads(ISOTOPE.read_text(encoding="utf-8"))
    if g["schema"]!="naft-p27-gmw-v4112-partial-tiles/1" or \
       i["schema"]!="naft-p27-asia-ch4-isotope-source-register/1":
        deny("MANIFEST_SCHEMA")
    tiles=g["members"]
    if len(tiles)!=44 or len({m["file"] for m in tiles})!=44 or \
       sum(m["band1_present_pixels"] for m in tiles)!=145798 or \
       sum(m["band41_present_pixels"] for m in tiles)!=339302:
        deny("MANIFEST_TILE_COUNTS")
    for tile in tiles:
        if not TILE.fullmatch(tile["file"]) or not HASH.fullmatch(tile["sha256"]):
            deny("MANIFEST_MEMBER_LAYOUT")
    if g["guards"]["mint_authorized"] is not False or \
       i["web3_mint_authorized"] is not False:
        deny("MANIFEST_MINT")
    return g,i

def safe_member_path(name):
    p=PurePosixPath(name)
    return len(p.parts)==1 and not p.is_absolute() and ".." not in p.parts and \
        TILE.fullmatch(name) is not None

def verify_gmw_archive(path, catalog, output=None, extract=False, verify_raster=False):
    expected=catalog["origin"]
    if not path.is_file() or path.stat().st_size>32*1024*1024:
        deny("GMW_ZIP_MISSING_OR_TOO_LARGE")
    if path.stat().st_size!=expected["bytes"] or file_sha(path)!=expected["sha256"]:
        deny("GMW_ZIP_SHA_MISMATCH")
    files={x["file"]:x for x in catalog["members"]}
    with zipfile.ZipFile(path) as z:
        infos=z.infolist()
        if len(infos)!=44 or len({x.filename for x in infos})!=44 or \
           sum(x.file_size for x in infos)!=expected["uncompressed_bytes"] or \
           {x.filename for x in infos}!=set(files):
            deny("GMW_MEMBER_SET_OR_SIZE")
        for info in infos:
            if not safe_member_path(info.filename) or \
               stat.S_ISLNK((info.external_attr>>16)&0o170000):
                deny("GMW_UNSAFE_MEMBER")
            if info.file_size>5*1024*1024:
                deny("GMW_MEMBER_TOO_LARGE")
            h=hashlib.sha256()
            with z.open(info) as f:
                first=f.read(4)
                if first not in (b"II*\x00",b"MM\x00*"):
                    deny("GMW_BAD_TIFF_MAGIC")
                h.update(first)
                for block in iter(lambda:f.read(1024*1024),b""):
                    h.update(block)
            if h.hexdigest()!=files[info.filename]["sha256"]:
                deny("GMW_MEMBER_SHA_MISMATCH")
        if verify_raster:
            try:
                import rasterio
            except ImportError:
                deny("RASTERIO_REQUIRED_FOR_PIXEL_REPLAY")
            for info in infos:
                with rasterio.MemoryFile(z.read(info)) as f:
                    with f.open() as raster:
                        if raster.count!=41 or raster.width!=3711 or \
                           raster.height!=3711 or raster.crs.to_epsg()!=4326 or \
                           raster.dtypes[0]!="uint8" or raster.nodata!=0:
                            deny("GMW_RASTER_METADATA_DRIFT")
                        expected_tile=files[info.filename]
                        for band,key in [(1,"band1_present_pixels"),(41,"band41_present_pixels")]:
                            from numpy import count_nonzero
                            if int(count_nonzero(raster.read(band)))!=expected_tile[key]:
                                deny("GMW_BAND_PRESENCE_DRIFT")
        if extract:
            if output is None:deny("OUTPUT_DIRECTORY_REQUIRED")
            root=Path(output)/"gmw-originals"
            root.mkdir(parents=True,exist_ok=True)
            for info in infos:
                with z.open(info) as src,(root/info.filename).open("wb") as dst:
                    shutil.copyfileobj(src,dst,1024*1024)
    return {"sha256":expected["sha256"],"tiles_verified":44,
       "whole_members_sha_verified":True,"raster_pixel_counts_replayed":verify_raster,
       "binary_tiles_extracted_locally":extract,"geodesic_area_computed":False,
       "carbon_stock_tco2e":None,"year_band_mapping_verified":False}

def parse_isotope_csv(text, metadata):
    reader=csv.DictReader(text.splitlines())
    if reader.fieldnames!=metadata["columns"]:
        deny("ISOTOPE_COLUMNS_MISMATCH")
    rows=list(reader)
    if len(rows)!=95:deny("ISOTOPE_SOURCE_ROW_COUNT")
    valid=[]
    trailing=False
    for line,r in enumerate(rows,start=2):
        if None in r:deny("CSV_EXTRA_COLUMNS")
        if not any(str(v or "").strip() for v in r.values()):
            trailing=True
            continue
        if trailing:deny("ISOTOPE_NONBLANK_AFTER_TRAILING_EMPTY")
        if any(r[k]=="" for k in ["COUNTRY","CATEGORY","GROUP_TYPE","GROUP","LONGITUDE",
                "LATITUDE","SAMPLING_DATE","d13C_CH4","Unc_d13C_CH4","N_AirSample"]):
            deny("ISOTOPE_REQUIRED_FIELD")
        decimal(r["LONGITUDE"],"LONGITUDE",Decimal(-180),Decimal(180))
        decimal(r["LATITUDE"],"LATITUDE",Decimal(-90),Decimal(90))
        decimal(r["d13C_CH4"],"D13C")
        decimal(r["Unc_d13C_CH4"],"UNCERTAINTY",Decimal(0))
        if r["C2C1_ratio"]:
            decimal(r["C2C1_ratio"],"C2C1",Decimal(0))
        if r["Unc_C2C1_ratio"]:
            decimal(r["Unc_C2C1_ratio"],"UNC_C2C1",Decimal(0))
        if r["N_AirSample"]!=str(int(r["N_AirSample"])) or int(r["N_AirSample"])<1:
            deny("ISOTOPE_SAMPLE_COUNT")
        iso_date(r["SAMPLING_DATE"])
        valid.append({"source_line":line,**r})
    c=Counter(r["COUNTRY"] for r in valid)
    cat=Counter(r["CATEGORY"] for r in valid)
    shape=metadata["shape"]
    if len(valid)!=shape["non_empty_rows"] or len(rows)-len(valid)!=shape["empty_trailing_rows"] or \
       dict(c)!=shape["country_counts"] or dict(cat)!=shape["category_counts"]:
        deny("ISOTOPE_COUNTRY_OR_CATEGORY_DRIFT")
    if sum(int(r["N_AirSample"]) for r in valid)!=shape["reported_air_sample_count_sum"] or \
       sum(bool(r["C2C1_ratio"]) for r in valid)!=shape["c2c1_values_present_in_rows"]:
        deny("ISOTOPE_COUNT_DRIFT")
    return valid

def verify_isotope(path, metadata, output=None):
    src=metadata["source"]
    if not path.is_file() or path.stat().st_size>2*1024*1024:
        deny("ISOTOPE_FILE_MISSING")
    if path.stat().st_size!=src["bytes"] or file_sha(path)!=src["sha256"]:
        deny("ISOTOPE_SHA_MISMATCH")
    rows=parse_isotope_csv(path.read_text(encoding="utf-8-sig"),metadata)
    if output is not None:
        out=Path(output)
        out.mkdir(parents=True,exist_ok=True)
        with (out/"isotope-source-rows-local.ndjson").open("w",encoding="utf8") as f:
            for row in rows:
                f.write(json.dumps(row,ensure_ascii=False)+"\n")
    return {"sha256":src["sha256"],"valid_rows":len(rows),
      "trailing_blank_rows":metadata["shape"]["empty_trailing_rows"],
      "observed_countries":metadata["shape"]["countries_observed"],
      "rice_isotope_signatures":4,"rice_emission_flux_measured":False,
      "source_observation_is_not_credit":True}

def intake(gmw, isotope, output, extract=False, replay=False):
    g,i=read_manifest()
    output=Path(output)
    output.mkdir(parents=True,exist_ok=True)
    a=verify_gmw_archive(Path(gmw),g,output,extract,replay)
    b=verify_isotope(Path(isotope),i,output)
    receipt={"schema":"naft-p27-gmw-isotope-source-local-receipt/1",
       "gmw":a,"isotope":b,"source_joint_grid_or_field_join":False,
       "country_overlap_without_spatial_validation":True,
       "formal_carbon_credit_certification":False,"certified_tco2e":None,
       "raster_carbon_stock_tco2e":None,"production_mint_authorized":False}
    (output/"source-integrity-receipt.json").write_text(
        json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    return receipt

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--gmw-zip",required=True,type=Path)
    parser.add_argument("--isotope-csv",required=True,type=Path)
    parser.add_argument("--out",default=".naft-local/p27-gmw-isotope",type=Path)
    parser.add_argument("--extract-tiles",action="store_true")
    parser.add_argument("--verify-raster",action="store_true")
    args=parser.parse_args()
    try:
        r=intake(args.gmw_zip,args.isotope_csv,args.out,args.extract_tiles,args.verify_raster)
        print(json.dumps(r,ensure_ascii=False))
    except (ValueError,KeyError,OSError,zipfile.BadZipFile,UnicodeDecodeError) as exc:
        msg=str(exc)
        print(msg if msg.startswith("P27_ASIA_SOURCE_BLOCKED:") else
              "P27_ASIA_SOURCE_BLOCKED:INVALID_SOURCE",file=sys.stderr)
        sys.exit(1)
