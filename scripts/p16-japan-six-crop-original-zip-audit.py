#!/usr/bin/env python3
"""P16 offline original-source replay for Japan crop production (1883-2022).
Only stdlib. No raw data is written to public GitHub; --private-csv creates a
local, mode-0600 full normalized CSV. Source 0 does not imply a true zero crop.
"""
import argparse,csv,hashlib,io,json,math,os,re,sys,zipfile
from pathlib import Path,PurePosixPath
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parent.parent
ARCHIVE_SHA="8e8ec4ef894f179b9d3ceb66fe8e9319f707b45cc652f4ece50a29a14e8772e6"
PREFIX="CropProduction_JP_1883-2022/"
FILES={
 "CropProduction_JP_1883-2022.csv":("6cfaec5fe79fcead2149c2427490e57acbf9c4f24c370e847131c9bde41a920e",17163494),
 "Japanese_Calendar.csv":("60486f75c7b1944a2b0c4446880f4b20d45fc46adc7dbbf93d095864d025638a",1390),
 "Prefecture_Code.csv":("e9f060db9bbdaf659ff20de0e104bb657087d71e53acec3d040708995432cd2a",1446),
 "CropProduction_JP_DataSources.xlsx":("2b31928c9e67a9c22c3b3f1947429e4edb9e9002b014f7d487090c4e0ae404ec",39322)
}
CROPS=("Barley","Potato","Rice","Soybean","SweetPotato","Wheat")
VARIABLES={"production":"tonnes","surface":"ha","yield":"tonnes/ha"}
HEAD=["crop","code_reg","region","code_pref","prefecture","year","JapaneseCalender","var","unit","value","source"]
MISSING_YEARS=(1885,1886,1888,1889,1890,1891,1893)
MISSING_CROPS=("Potato","Soybean","SweetPotato")
def require(ok,code):
 if not ok:raise ValueError("NAFT_P16_JP_CROP_SOURCE_BLOCKED:"+code)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def require_original(path):
 p=Path(path)
 require(p.is_file() and not p.is_symlink(),"FILE_NOT_REGULAR")
 require(p.stat().st_size<=3*1024*1024,"ZIP_TOO_LARGE")
 raw=p.read_bytes()
 require(sha(raw)==ARCHIVE_SHA,"ARCHIVE_SHA256_MISMATCH")
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  entries=z.infolist()
  require(0<len(entries)<=20 and sum(e.file_size for e in entries)<=25*1024*1024,
          "ARCHIVE_ENTRY_OR_EXPANSION_LIMIT")
  for info in entries:
   parts=PurePosixPath(info.filename)
   require(not parts.is_absolute() and ".." not in parts.parts and "\\" not in info.filename,
           "ARCHIVE_PATH_TRAVERSAL")
   require(info.file_size<=20*1024*1024,"ARCHIVE_MEMBER_EXPANSION_LIMIT")
   require(((info.external_attr>>16)&0o170000)!=0o120000,"ARCHIVE_SYMLINK")
  required={}
  for name,(expected_hash,expected_length) in FILES.items():
   member=PREFIX+name
   require(sum(e.filename==member for e in entries)==1,"MISSING_OR_DUPLICATE:"+name)
   data=z.read(member)
   require(sha(data)==expected_hash and len(data)==expected_length,
           "SOURCE_MEMBER_SHA_OR_LENGTH:"+name)
   required[name]=data
  require(z.testzip() is None,"ZIP_CRC_ERROR")
 return required

def load_csv(raw,headers,max_rows):
 reader=csv.DictReader(io.StringIO(raw.decode("utf-8-sig"),newline=""))
 require(reader.fieldnames==headers,"ORIGINAL_CSV_HEADER")
 rows=list(reader)
 require(len(rows)==max_rows,"ORIGINAL_CSV_ROW_COUNT")
 require(all(None not in r and set(r)==set(headers) for r in rows),"ORIGINAL_CSV_SHAPE")
 return rows

def base36(value):
 n=int(value); chars="0123456789abcdefghijklmnopqrstuvwxyz"
 if n==0:return "0"
 res=""
 while n:res=chars[n%36]+res;n//=36
 return res

def scan(files, full=False):
 rows=load_csv(files["CropProduction_JP_1883-2022.csv"],HEAD,146160)
 years=load_csv(files["Japanese_Calendar.csv"],["year","JapaneseCalender"],140)
 prefs=load_csv(files["Prefecture_Code.csv"],["code_reg","region","code_pref","prefecture"],58)
 require([int(r["year"]) for r in years]==list(range(1883,2023)),
         "YEAR_CALENDAR_CONTINUITY")
 calendar={r["year"]:r["JapaneseCalender"] for r in years}
 mapping={(r["code_reg"],r["code_pref"]):(r["region"],r["prefecture"]) for r in prefs}
 require(len(mapping)==58 and len([r for r in prefs if re.fullmatch(r"p(?:0[1-9]|[1-3][0-9]|4[0-7])",r["code_pref"])])==47,"PREFECTURE_AND_AGGREGATE_CODES")
 require(len([r for r in prefs if r["code_pref"]=="p98"])==10
         and len([r for r in prefs if r["code_pref"]=="p99"])==1,
         "REGION_TOTAL_AND_NATIONAL_CODES")
 state=defaultdict(dict); seen=set(); source_counts=Counter()
 for r in rows:
  try:
   y=int(r["year"]);value=float(r["value"])
  except (ValueError,OverflowError):
   raise ValueError("NAFT_P16_JP_CROP_SOURCE_BLOCKED:NON_NUMERIC_VALUE_OR_YEAR")
  require(1883<=y<=2022 and r["crop"] in CROPS and r["var"] in VARIABLES,
          "CROP_YEAR_VARIABLE")
  require(r["unit"]==VARIABLES[r["var"]] and math.isfinite(value) and value>=0,
          "METRIC_UNIT_OR_VALUE")
  require(r["JapaneseCalender"]==calendar[r["year"]],"JAPANESE_YEAR_MISMATCH")
  loc=mapping.get((r["code_reg"],r["code_pref"]))
  require(loc is not None and loc==(r["region"],r["prefecture"]),
          "REGION_PREFECTURE_CODE_MISMATCH")
  key=(r["crop"],y,r["code_reg"],r["code_pref"])
  require((key,r["var"]) not in seen,"DUPLICATE_MEASUREMENT")
  seen.add((key,r["var"]))
  state[key][r["var"]]=value
  source_counts[r["source"]]+=1
 require(len(state)==6*140*58 and len(seen)==146160,"DATA_CUBE_SHAPE")
 require(all(set(m)==set(VARIABLES) for m in state.values()),"INCOMPLETE_MEASUREMENT_TRIPLET")
 region_deviations=0;country_deviations=0;max_yield_abs_error=0.
 region_pref_sums=defaultdict(lambda:defaultdict(float))
 country_pref_sums=defaultdict(lambda:defaultdict(float))
 for (crop,y,reg,pref),s in state.items():
  if pref not in ("p98","p99"):
   for metric in ("production","surface"):
    region_pref_sums[(crop,y,reg)][metric]+=s[metric]
    country_pref_sums[(crop,y)][metric]+=s[metric]
 for (crop,y,reg,pref),s in state.items():
  if s["surface"]>0:
   err=abs(s["yield"]-s["production"]/s["surface"])
   max_yield_abs_error=max(max_yield_abs_error,err)
   require(err<=0.00501,"SOURCE_YIELD_ROUNDING_MISMATCH")
  else:require(s["yield"]==0 and s["production"]==0,"ZERO_AREA_NONZERO_CROP")
  if pref=="p98":
   for metric in ("production","surface"):
    aggregate=region_pref_sums[(crop,y,reg)][metric]
    if abs(s[metric]-aggregate)>1e-6:region_deviations+=1
  if pref=="p99":
   for metric in ("production","surface"):
    total=country_pref_sums[(crop,y)][metric]
    if abs(s[metric]-total)>1e-6:country_deviations+=1
 require(region_deviations==0 and country_deviations==0,
         "NATIONAL_REGIONAL_DOUBLE_COUNT_OR_SUM_MISMATCH")
 zero_years={}
 for crop in CROPS:
  dates=[y for y in range(1883,2023)
   if all(state[(crop,y,"r99","p99")][v]==0 for v in VARIABLES)]
  zero_years[crop]=dates
  require(dates==(list(MISSING_YEARS) if crop in MISSING_CROPS else []),
          "SUSPECT_NATIONAL_ALL_ZERO_YEAR_CHANGED")
 # Full 140-years for all six crops. Only national totals, not per-field records.
 packed={}
 for crop in CROPS:
  annual=[]
  for year in range(1883,2023):
   s=state[(crop,year,"r99","p99")]
   annual.append(".".join((base36(round(s["production"])),
       base36(round(s["surface"])),base36(round(s["yield"]*100)))))
  packed[crop]=";".join(annual)
 summaries={
  "schema":"naft-p16-japan-crop-archive-1883-2022-v1",
  "source_scope":"RESEARCH_HISTORICAL_CROP_STATISTICS_NOT_CH4_OR_CO2E",
  "archive_sha256":ARCHIVE_SHA,
  "source_member_sha256":{n:v[0] for n,v in FILES.items()},
  "original_csv_rows":146160,
  "crop_count":6,"year_start":1883,"year_end":2022,"years":140,
  "geographic_keys_per_crop_year":58,"prefectures":47,
  "region_totals":10,"national_total":1,
  "national_prod_prefecture_sum_mismatches":country_deviations,
  "regional_prod_prefecture_sum_mismatches":region_deviations,
  "max_original_yield_rounding_error_t_per_ha":round(max_yield_abs_error,8),
  "suspected_placeholder_national_zero_years":zero_years,
  "zero_year_policy":"UNVERIFIED_AS_MISSING_NOT_CONFIRMED_ZERO",
  "national_packed_base36":packed,
  "source_record_categories":dict(sorted(source_counts.items())),
  "2022_sweet_potato_zero_prefecture_count":sum(
       state[("SweetPotato",2022,r["code_reg"],r["code_pref"])]["production"]==0
       for r in prefs if r["code_pref"] not in ("p98","p99")),
  "historical_source_redistribution_license_checked":False,
  "original_raw_csv_redistributed":False,
  "historical_prefecture_boundaries_consistent_verified":False,
  "cross_vintage_comparability_with_2023_2025_maff":False,
  "ch4_observation_count":0,"official_co2e_credits":None
 }
 return summaries,rows

def private_export(dest,rows):
 p=Path(dest);require(p.parent.is_dir() and not p.exists(),"PRIVATE_OUTPUT_EXISTS")
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,"w",encoding="utf8",newline="") as f:
  writer=csv.DictWriter(f,fieldnames=HEAD,lineterminator="\n")
  writer.writeheader();writer.writerows(rows)

def main():
 a=argparse.ArgumentParser(description=__doc__)
 a.add_argument("original_zip")
 a.add_argument("--private-csv",default=None)
 a.add_argument("--public-register",default=None)
 args=a.parse_args()
 files=require_original(args.original_zip)
 report,rows=scan(files)
 if args.public_register:
  expected=json.loads(Path(args.public_register).read_text(encoding="utf8"))
  require(expected["schema"]=="naft-p16-japan-crop-archive-1883-2022-source-receipt-v1",
          "REGISTER_SCHEMA")
  packed_sha=sha("\n".join(k+":"+report["national_packed_base36"][k] for k in CROPS).encode("utf8"))
  # These are original-source report invariants, not official source-file licensing approval.
  comparisons={
   "archive_sha256":report["archive_sha256"],
   "main_csv_sha256":report["source_member_sha256"]["CropProduction_JP_1883-2022.csv"],
   "source_workbook_sha256":report["source_member_sha256"]["CropProduction_JP_DataSources.xlsx"],
   "prefecture_code_csv_sha256":report["source_member_sha256"]["Prefecture_Code.csv"],
   "japanese_calendar_csv_sha256":report["source_member_sha256"]["Japanese_Calendar.csv"],
   "original_record_count":report["original_csv_rows"],
   "nationally_aggregated_crop_years":6*140,
   "packed_national_vectors_sha256":packed_sha,
   "source_record_categories":report["source_record_categories"],
   "national_area_production_vs_prefecture_sum_discrepancies":0,
   "regional_area_production_vs_prefecture_sum_discrepancies":0,
   "sweetpotato_2022_prefecture_zero_records":report["2022_sweet_potato_zero_prefecture_count"],
   "maximum_original_yield_rounding_error_tonnes_per_ha":report["max_original_yield_rounding_error_t_per_ha"]
  }
  for key,val in comparisons.items():
   require(expected[key]==val,"PUBLIC_REGISTER_MISMATCH:"+key)
  require(expected["national_all_zero_years_for_potato_soybean_sweetpotato"]==list(MISSING_YEARS),
          "ZERO_YEAR_POLICY_CHANGED")
  require(expected["official_abatement_tco2e"] is None and
          expected["registered_raw_source_redistributed"] is False,
          "SCIENTIFIC_CERTIFICATION_OR_REDISTRIBUTION_BLOCK")
 if args.private_csv:private_export(args.private_csv,rows)
 print(json.dumps({"status":"P16_ORIGINAL_146160_ROWS_AND_840_NATIONAL_SERIES_REPLAY_MATCH",
  "archive_sha256":report["archive_sha256"],"national_crop_years":840,
  "raw_rows":report["original_csv_rows"],
  "uncertain_all_zero_national_crop_years":sum(map(len,report["suspected_placeholder_national_zero_years"].values())),
  "credits":None},sort_keys=True))
if __name__=="__main__":
 try:main()
 except (ValueError,OSError,UnicodeError,KeyError,zipfile.BadZipFile) as e:
  print(str(e),file=sys.stderr);sys.exit(1)
