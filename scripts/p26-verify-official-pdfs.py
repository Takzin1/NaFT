#!/usr/bin/env python3
"""Validate exact locally uploaded official PDF bytes against P26 provenance.
Does not download, upload, redistribute, certify, authenticate ministry issuer
signatures, or claim any current registry legal/custody rights.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parent.parent
CATALOG=ROOT/"research/registry-source-intake-2026-11-08/official-mrv-pdfs-2026.json"

def verify_pdf(pdf_file,source_id):
    register=json.loads(CATALOG.read_text(encoding="utf-8"))
    matches=[d for d in register["documents"] if d["id"]==source_id]
    if len(matches)!=1:raise ValueError("UNKNOWN_SOURCE_ID")
    src=matches[0]
    path=Path(pdf_file)
    if not path.is_file():raise ValueError("MISSING_LOCAL_PDF")
    if path.stat().st_size>128*1024*1024:raise ValueError("FILE_TOO_LARGE")
    digest=hashlib.sha256()
    with path.open("rb") as f:
        if f.read(5)!=b"%PDF-":raise ValueError("NOT_PDF_SIGNATURE")
        f.seek(0)
        for chunk in iter(lambda:f.read(1024*1024),b""):
            digest.update(chunk)
    if path.stat().st_size!=src["bytes"] or digest.hexdigest()!=src["sha256"]:
        raise ValueError("PDF_SHA256_OR_SIZE_MISMATCH")
    return {
        "schema":"naft-p26-government-pdf-local-verification/1",
        "source_id":source_id,"sha256":digest.hexdigest(),
        "bytes":src["bytes"],"matches_uploaded_original":True,
        "issuer_signature_verified":False,
        "current_methodology_version_confirmed":False,
        "carbon_credit_issued":False,"production_mint_authorized":False
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--source-id",required=True)
    parser.add_argument("--pdf",required=True)
    args=parser.parse_args()
    try:
        print(json.dumps(verify_pdf(args.pdf,args.source_id),
                         ensure_ascii=False,sort_keys=True))
    except (ValueError,OSError,KeyError,json.JSONDecodeError) as exc:
        print("P26_GOVERNMENT_PDF_BLOCKED:"+str(exc),file=sys.stderr)
        sys.exit(1)

if __name__=="__main__":
    main()
