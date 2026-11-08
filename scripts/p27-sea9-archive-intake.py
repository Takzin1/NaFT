#!/usr/bin/env python3
"""P27 SEA-9 archive intake: SHA-pinned, offline, standard-library-only.

The uploaded ZIP is data from an under-review research manuscript, not a
J-Credit registry, verified individual field or permission to mint credits.
22 original Python scripts are not executed. --extract-all is local-only.
"""
import argparse
import ast
import csv
from decimal import Decimal
import hashlib
import io
import json
import math
from pathlib import Path, PurePosixPath
import stat
import struct
import sys
import zipfile

SHA = "41750fd4d1e1b83a0a5855808d9b9cbed78eebbfa2282c331cf1602cdc635b09"
BYTES = 3863169
FILES = 53
UNPACKED = 41913541
COUNTRIES = ["Indonesia","Timor-Leste","Malaysia","Philippines","Vietnam",
             "Thailand","Cambodia","Laos","Myanmar"]
P = "zenodo_package/"
REQUIRED = [P+"LICENSE",P+"README.md",P+"CITATION.cff",
    P+"data/ch4_country_comparison.csv",P+"data/04_inventory_summary.json",
    P+"data/ch4_mc_diagnostics.json",P+"data/ch4_mc_sea_total.npz",
    P+"data/ch4_inventory_0p1deg.nc"]

def block(message):
    raise ValueError("P27_SEA9_BLOCKED:"+message)

def digest(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def validate(path, expected_sha=SHA, expected_bytes=BYTES):
    path=Path(path)
    if not path.is_file() or path.stat().st_size>12*1024*1024:
        block("ZIP_MISSING_OR_TOO_LARGE")
    h=digest(path)
    if h!=expected_sha or path.stat().st_size!=expected_bytes:
        block("SOURCE_SHA256_OR_SIZE_MISMATCH")
    with zipfile.ZipFile(path) as z:
        entries=z.infolist()
        names={x.filename for x in entries}
        if len(entries)!=FILES or len(names)!=FILES or \
           sum(x.file_size for x in entries)!=UNPACKED or not set(REQUIRED)<=names:
            block("SOURCE_MEMBER_LAYOUT_MISMATCH")
        for item in entries:
            name=PurePosixPath(item.filename)
            if name.is_absolute() or ".." in name.parts or name.parts[0]!="zenodo_package":
                block("UNSAFE_PATH")
            if stat.S_ISLNK((item.external_attr>>16)&0o170000):
                block("SYMLINK_REJECTED")
            if item.file_size>25*1024*1024 or \
               (item.file_size>100000 and item.file_size>500*item.compress_size):
                block("ZIP_BOMB_GUARD")
    return h

def npy_samples(zipf):
    with zipfile.ZipFile(io.BytesIO(zipf.read(P+"data/ch4_mc_sea_total.npz"))) as npz:
        raw=npz.read("sea_total_Tg.npy")
    if not raw.startswith(b"\x93NUMPY"):
        block("NPY_MAGIC")
    major=raw[6]
    if major==1:
        n=struct.unpack("<H",raw[8:10])[0];start=10
    elif major in (2,3):
        n=struct.unpack("<I",raw[8:12])[0];start=12
    else:
        block("NPY_VERSION")
    try:
        header=ast.literal_eval(raw[start:start+n].decode("ascii"))
    except (ValueError,SyntaxError,UnicodeDecodeError):
        block("NPY_HEADER")
    if header.get("descr") not in ("<f8","=f8") or \
       tuple(header.get("shape",()))!=(2000,) or header.get("fortran_order"):
        block("NPY_TYPE_OR_SHAPE")
    buf=raw[start+n:]
    if len(buf)!=16000:
        block("NPY_DATA_LENGTH")
    nums=[v[0] for v in struct.iter_unpack("<d",buf)]
    if not all(math.isfinite(x) for x in nums):
        block("NPY_NONFINITE")
    return nums

def q(values,prob):
    s=sorted(values);t=(len(s)-1)*prob;i=int(t)
    return s[i]*(1-(t-i))+s[min(i+1,len(s)-1)]*(t-i)

def read_research_snapshot(z):
    csv_text=z.read(P+"data/ch4_country_comparison.csv").decode("utf-8-sig")
    rows=list(csv.DictReader(io.StringIO(csv_text)))
    if len(rows)!=10 or [x["country"] for x in rows]!=COUNTRIES+["SEA_9_countries_total"]:
        block("NINE_COUNTRY_LAYOUT")
    total=rows[-1]
    for key in ["OpenSEA_Gg_CH4_yr","EDGAR_Gg_CH4_yr","diff_Gg"]:
        summed=sum((Decimal(x[key]) for x in rows[:-1]),Decimal(0))
        # EDGAR 9-country total in author's CSV is rounded to three decimals;
        # preserve the original 0.000175 Gg difference rather than editing it.
        eps=Decimal("0.000001") if key=="OpenSEA_Gg_CH4_yr" else Decimal("0.0005")
        if abs(summed-Decimal(total[key]))>eps:
            block("NINE_COUNTRY_TOTAL_DRIFT")
    for row in rows:
        if abs(Decimal(row["OpenSEA_Gg_CH4_yr"])-Decimal(row["EDGAR_Gg_CH4_yr"])-
               Decimal(row["diff_Gg"]))>Decimal("0.000001"):
            block("COUNTRY_DELTA_DRIFT")
    inv=json.loads(z.read(P+"data/04_inventory_summary.json"))
    mc=json.loads(z.read(P+"data/ch4_mc_diagnostics.json"))
    draws=npy_samples(z)
    mean=sum(draws)/len(draws)
    sd=math.sqrt(sum((v-mean)**2 for v in draws)/(len(draws)-1))
    results={"E_mean_Tg":mean,"E_median_Tg":q(draws,.5),
       "E_p05_Tg":q(draws,.05),"E_p95_Tg":q(draws,.95),
       "E_std_Tg":sd,
       "P_E_below_EDGAR":sum(v<float(mc["EDGAR_SEA_Tg"]) for v in draws)/len(draws)}
    if mc["N_MC"]!=2000 or any(not math.isclose(results[k],float(mc[k]),abs_tol=1e-8)
                               for k in results):
        block("MONTE_CARLO_REPLAY_DRIFT")
    if not math.isclose(inv["sea_total_Gg_CH4_yr"],6745.447945582598,abs_tol=1e-5):
        block("FULL_WINDOW_DRIFT")
    if not math.isclose(float(total["OpenSEA_Gg_CH4_yr"]),6613.79599873184,abs_tol=1e-6):
        block("ADMIN_MASK_DRIFT")
    return rows,mc,inv

def intake(path,output,extract_all=False):
    source_sha=validate(path)
    output=Path(output)
    output.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(path) as z:
        rows,mc,inv=read_research_snapshot(z)
        entries=[]
        for info in z.infolist():
            sha=hashlib.sha256()
            with z.open(info) as f:
                for part in iter(lambda:f.read(1<<20),b""):
                    sha.update(part)
            entries.append({"path":info.filename.removeprefix(P),
                            "sha256":sha.hexdigest(),"bytes":info.file_size})
        if extract_all:
            for info in z.infolist():
                dest=output/"source"/info.filename
                if info.is_dir():
                    dest.mkdir(parents=True,exist_ok=True)
                    continue
                dest.parent.mkdir(parents=True,exist_ok=True)
                with z.open(info) as src,open(dest,"wb") as dst:
                    for part in iter(lambda:src.read(1<<20),b""):
                        dst.write(part)
    (output/"source-members-sha256.json").write_text(
        json.dumps(entries,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    with (output/"sea9-countries.ndjson").open("w",encoding="utf8") as f:
        for r in rows[:-1]:
            f.write(json.dumps({"schema":"naft-p27-sea9-historical-country/1",
                "archive_sha256":source_sha,"period":"2020-2021",
                "country":r["country"],"country_mask":"ADMIN_ONLY",
                "ch4_bottom_up_gg_yr":r["OpenSEA_Gg_CH4_yr"],
                "edgar_v8_ch4_gg_yr":r["EDGAR_Gg_CH4_yr"],
                "credit_quantity_tco2e":None,"token_mint_authorized":False})+"\n")
    result={"schema":"naft-p27-sea9-local-receipt/1",
        "source_archive_sha256":source_sha,"source_version":"1.0.0",
        "members_verified":len(entries),"originals_extracted_locally":bool(extract_all),
        "admin_9country_tg_ch4_yr":str(Decimal(rows[-1]["OpenSEA_Gg_CH4_yr"])/1000),
        "full_window_tg_ch4_yr":str(Decimal(str(inv["sea_total_Gg_CH4_yr"]))/1000),
        "different_spatial_supports":True,"monte_carlo_draws":mc["N_MC"],
        "mc_mean_tg":mc["E_mean_Tg"],"mc_p05_tg":mc["E_p05_Tg"],
        "mc_p95_tg":mc["E_p95_Tg"],
        "manuscript_status":"UNDER_REVIEW_AS_DESCRIBED_IN_SOURCE",
        "underlying_30gb_raw_inputs_recomputed":False,
        "official_credit_verified":False,"certified_tco2e":None,
        "legal_tokenization_rights_verified":False,"production_mint_authorized":False}
    (output/"intake-report.json").write_text(
        json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    return result

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--archive",type=Path,required=True)
    parser.add_argument("--out",type=Path,default=Path(".naft-local/sea9-v100"))
    parser.add_argument("--extract-all",action="store_true")
    args=parser.parse_args()
    try:
        print(json.dumps(intake(args.archive,args.out,args.extract_all),ensure_ascii=False))
    except (ValueError,KeyError,OSError,zipfile.BadZipFile,json.JSONDecodeError) as err:
        msg=str(err)
        print(msg if msg.startswith("P27_SEA9_BLOCKED:") else
              "P27_SEA9_BLOCKED:INVALID_SOURCE",file=sys.stderr)
        sys.exit(1)
