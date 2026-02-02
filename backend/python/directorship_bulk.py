import os
import sys
import time
import json
import base64
import random
import requests
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

# ============================================================
# ENV SETUP
# ============================================================

load_dotenv()

ONGRID_API_KEY = os.getenv("ONGRID_API_KEY")
ONGRID_AUTH_TYPE = os.getenv("ONGRID_AUTH_TYPE")
ONGRID_REFERENCE_ID = os.getenv("ONGRID_REFERENCE_ID")
DIGITAP_USERNAME = os.getenv("DIGITAP_USERNAME")
DIGITAP_PASSWORD = os.getenv("DIGITAP_PASSWORD")

MAX_ROW_RETRIES = 2

# ============================================================
# INPUT VALIDATION
# ============================================================

if len(sys.argv) < 2:
    print("ERROR: Input CSV path missing")
    sys.exit(1)

INPUT_CSV = sys.argv[1]
JOB_DIR = os.path.dirname(INPUT_CSV)
JOB_ID = os.path.basename(JOB_DIR)

OUTPUT_CSV = os.path.join(JOB_DIR, "output.csv")
FAILED_ROWS_CSV = os.path.join(JOB_DIR, "failed_rows.csv")
SUMMARY_JSON = os.path.join(JOB_DIR, "summary.json")

if not os.path.exists(INPUT_CSV):
    print("ERROR: File not found")
    sys.exit(1)

# ============================================================
# DIN API (BUSINESS-AWARE)
# ============================================================

def fetch_din_by_pan(pan):
    url = "https://api.gridlines.io/mca-api/fetch-din-by-pan"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": ONGRID_API_KEY,
        "X-Auth-Type": ONGRID_AUTH_TYPE,
        "X-Reference-ID": ONGRID_REFERENCE_ID,
    }
    payload = {"pan": pan.upper(), "consent": "Y"}

    res = requests.post(url, headers=headers, json=payload, timeout=60)

    try:
        data = res.json()
    except Exception:
        raise Exception("DIN API: Invalid JSON response")

    # -------- HARD FAILURES --------

    # Rate limit or API-level error
    if "message" in data and "rate limit" in data["message"].lower():
        raise Exception(f"DIN API: {data['message']}")

    if res.status_code != 200:
        raise Exception("DIN API: HTTP error")

    api_data = data.get("data", {})
    code = api_data.get("code")
    message = api_data.get("message", "Unknown DIN API response")

    # Invalid PAN → FAIL ROW
    if code == "1008":
        raise Exception(f"DIN API: {message}")

    # -------- VALID BUSINESS CASES --------

    # DIN FOUND
    if code == "1006" and "din_details" in api_data:
        return api_data["din_details"].get("din", "N")

    # PAN not linked / DIN does not exist → acceptable
    if code in ("1007", "1011"):
        return "N"

    # -------- SAFETY NET --------
    # Unknown but non-fatal → treat as no DIN
    return "N"

# ============================================================
# GST API
# ============================================================

def fetch_gst_by_pan(pan):
    url = "https://svc.digitap.ai/validation/kyb/v1/gstpansearch"
    creds = f"{DIGITAP_USERNAME}:{DIGITAP_PASSWORD}"
    headers = {
        "Authorization": f"Basic {base64.b64encode(creds.encode()).decode()}",
        "Content-Type": "application/json",
    }

    payload = {
        "client_ref_num": str(random.randint(100000, 999999)),
        "pan": pan.upper(),
    }

    res = requests.post(url, headers=headers, json=payload, timeout=60)

    try:
        data = res.json()
    except Exception:
        raise Exception("GST API: Invalid JSON response")

    # Invalid PAN
    if data.get("http_response_code") == 400:
        raise Exception("GST API: Invalid PAN or bad request")

    # Other API errors
    if data.get("http_response_code") != 200:
        raise Exception("GST API: API error")

    gst_list = data.get("result", {}).get("gstinResList", [])
    return ", ".join(g["gstin"] for g in gst_list) if gst_list else "N"

# ============================================================
# ROW PROCESSOR (ROW-LEVEL RETRIES)
# ============================================================

def process_row_safe(row):
    pan = str(row.get("PAN", "")).strip()

    if not pan or len(pan) != 10:
        return None, {
            **row,
            "jobId": JOB_ID,
            "error": "Invalid PAN format",
        }

    last_error = None

    for _ in range(MAX_ROW_RETRIES + 1):
        try:
            din = fetch_din_by_pan(pan)
            gst = fetch_gst_by_pan(pan)

            return {
                **row,
                "DIN": din,
                "GST": gst,
                "Status": "Y" if din != "N" else "N",
            }, None

        except Exception as e:
            last_error = str(e)
            time.sleep(1)

    return None, {
        **row,
        "jobId": JOB_ID,
        "error": last_error or "Unknown processing error",
    }

# ============================================================
# MAIN
# ============================================================

def main():
    df = pd.read_csv(INPUT_CSV)

    total_rows = len(df)
    success_rows = []
    failed_rows = []

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(process_row_safe, row)
            for _, row in df.iterrows()
        ]

        for i, future in enumerate(as_completed(futures), start=1):
            result, failed = future.result()

            if result:
                success_rows.append(result)
            if failed:
                failed_rows.append(failed)

            print(f"PROGRESS: {i}/{total_rows}")

    pd.DataFrame(success_rows).to_csv(OUTPUT_CSV, index=False)

    if failed_rows:
        pd.DataFrame(failed_rows).to_csv(FAILED_ROWS_CSV, index=False)

    summary = {
        "totalRows": total_rows,
        "successRows": len(success_rows),
        "failedRows": len(failed_rows),
    }

    with open(SUMMARY_JSON, "w") as f:
        json.dump(summary, f)

    print("COMPLETED")
    sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FATAL:", e)
        sys.exit(1)
