import os
import sys
import time
import json
import base64
import random
import logging
import requests
import pandas as pd
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

# ============================================================
# ENV SETUP
# ============================================================

load_dotenv()

ONGRID_API_KEY = os.getenv('ONGRID_API_KEY')
ONGRID_AUTH_TYPE = os.getenv('ONGRID_AUTH_TYPE')
ONGRID_REFERENCE_ID = os.getenv('ONGRID_REFERENCE_ID')
DIGITAP_USERNAME = os.getenv('DIGITAP_USERNAME')
DIGITAP_PASSWORD = os.getenv('DIGITAP_PASSWORD')

# ============================================================
# LOGGING (stdout + file)
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# ============================================================
# VALIDATE INPUT
# ============================================================

if len(sys.argv) < 2:
    print("ERROR: Input CSV path missing")
    sys.exit(1)

INPUT_CSV = sys.argv[1]
JOB_DIR = os.path.dirname(INPUT_CSV)

OUTPUT_CSV = os.path.join(JOB_DIR, "output.csv")
FAILED_ROWS_CSV = os.path.join(JOB_DIR, "failed_rows.csv")

if not os.path.exists(INPUT_CSV):
    print(f"ERROR: File not found: {INPUT_CSV}")
    sys.exit(1)

# ============================================================
# API FUNCTIONS (unchanged logic)
# ============================================================

def fetch_din_by_pan(pan, timeout=90, max_retries=3):
    url = "https://api.gridlines.io/mca-api/fetch-din-by-pan"

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-API-Key": ONGRID_API_KEY,
        "X-Auth-Type": ONGRID_AUTH_TYPE,
        "X-Reference-ID": ONGRID_REFERENCE_ID
    }

    payload = {"pan": pan.upper(), "consent": "Y"}

    retries = 0
    while retries <= max_retries:
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=timeout)

            if response.status_code == 429:
                time.sleep(min((2 ** retries) + random.random(), 30))
                retries += 1
                continue

            response.raise_for_status()
            data = response.json()
            din = data.get("data", {}).get("din_details", {}).get("din")
            return din if din else "N", retries

        except Exception:
            retries += 1
            if retries > max_retries:
                return "N", retries
            time.sleep(min((2 ** retries) + random.random(), 20))

    return "N", retries


def fetch_gst_by_pan(pan, timeout=90, max_retries=3):
    url = "https://svc.digitap.ai/validation/kyb/v1/gstpansearch"

    credentials = f"{DIGITAP_USERNAME}:{DIGITAP_PASSWORD}"
    encoded = base64.b64encode(credentials.encode()).decode()

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {encoded}"
    }

    payload = {"client_ref_num": str(random.randint(100000, 999999)), "pan": pan.upper()}

    retries = 0
    while retries <= max_retries:
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=timeout)
            response.raise_for_status()
            data = response.json()

            if data.get("result_code") != 101:
                return "N", retries

            gst_list = data.get("result", {}).get("gstinResList", [])
            if not gst_list:
                return "N", retries

            formatted = [g.get("gstin") for g in gst_list]
            return ", ".join(formatted), retries

        except Exception:
            retries += 1
            if retries > max_retries:
                return "N", retries
            time.sleep(min((2 ** retries) + random.random(), 20))

    return "N", retries

# ============================================================
# ROW PROCESSOR
# ============================================================

def process_row(row):
    pan = str(row["PAN"]).strip()

    din, din_retries = fetch_din_by_pan(pan)
    gst, gst_retries = fetch_gst_by_pan(pan)

    return {
        **row,
        "DIN": din,
        "GST": gst,
        "Status": "Y" if din != "N" else "N",
        "DIN_Retries": din_retries,
        "GST_Retries": gst_retries
    }

# ============================================================
# MAIN
# ============================================================

def main():
    df = pd.read_csv(INPUT_CSV)

    required_cols = {"PAN"}
    if not required_cols.issubset(df.columns):
        print("ERROR: Missing required columns")
        sys.exit(1)

    results = []
    failed = []

    print(f"STARTED: processing {len(df)} rows")

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_row, row): idx for idx, row in df.iterrows()}

        for i, future in enumerate(as_completed(futures), start=1):
            try:
                result = future.result()
                results.append(result)
            except Exception:
                failed.append(df.iloc[futures[future]])

            print(f"PROGRESS: {i}/{len(df)}")

    pd.DataFrame(results).to_csv(OUTPUT_CSV, index=False)

    if failed:
        pd.DataFrame(failed).to_csv(FAILED_ROWS_CSV, index=False)

    print("COMPLETED")
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"FATAL: {e}")
        sys.exit(1)
