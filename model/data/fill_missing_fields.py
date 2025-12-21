"""Fill empty/missing fields in package/data/clean_training.csv.

Goal: Ensure ALL columns are populated (no NaN / no empty strings) while keeping
meaningful semantics:
- numeric -> median
- categorical/text -> best-effort extraction, else 'unknown'
- derived fields -> recompute (price_per_sqm, location_full, has_detailed_location)

Run:
  cd package/data
  /usr/local/bin/python3 fill_missing_fields.py
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
DATA_FILE = HERE / "clean_training.csv"

UB_DISTRICTS = [
    "Багануур",
    "Багахангай",
    "Баянгол",
    "Баянзүрх",
    "Налайх",
    "Сонгинохайрхан",
    "Сүхбаатар",
    "Хан-Уул",
    "Чингэлтэй",
]

UB_DISTRICT_ABBR: Dict[str, str] = {
    "БЗД": "Баянзүрх",
    "БГД": "Баянгол",
    "СБД": "Сүхбаатар",
    "СХД": "Сонгинохайрхан",
    "ХУД": "Хан-Уул",
    "ЧД": "Чингэлтэй",
    "НД": "Налайх",
    "БНД": "Багануур",
    "БХД": "Багахангай",
    # common spacing variant from older data
    "СОНГИНО ХАЙРХАН": "Сонгинохайрхан",
}


def _norm_text(x: object) -> str:
    if x is None:
        return ""
    if isinstance(x, float) and np.isnan(x):
        return ""
    return str(x).strip()


def extract_district(text: str) -> str:
    if not text:
        return ""
    # abbreviations
    for abbr, full in UB_DISTRICT_ABBR.items():
        if abbr in text:
            return full
    # explicit "X дүүрэг"
    for d in UB_DISTRICTS:
        if re.search(rf"{re.escape(d)}\s*дүүрэг", text):
            return d
    # plain mention
    for d in UB_DISTRICTS:
        if d in text:
            return d
    return ""


def build_location_full(city: str, district: str) -> str:
    city = city.strip() if city else ""
    district = district.strip() if district else ""
    if city and district and city != "unknown" and district != "unknown":
        return f"{city}, {district}"
    if city and city != "unknown":
        return city
    if district and district != "unknown":
        return district
    return "unknown"


def main() -> None:
    if not DATA_FILE.exists():
        raise SystemExit(f"Missing {DATA_FILE}")

    df = pd.read_csv(DATA_FILE)

    # Normalize object cols to strings (no NaN)
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].apply(_norm_text)

    # Best-effort district extraction for empty district
    if "district" in df.columns:
        missing = df["district"].str.strip().eq("")
        if missing.any():
            cand = []
            for title, loc_full, city in zip(
                df.get("title", "").tolist(),
                df.get("location_full", "").tolist(),
                df.get("city", "").tolist(),
            ):
                d = extract_district(title) or extract_district(loc_full) or extract_district(city)
                cand.append(d)
            cand = pd.Series(cand, index=df.index).astype(str)
            df.loc[missing & cand.ne(""), "district"] = cand[missing & cand.ne("")]

        # normalize common variant
        df["district"] = df["district"].replace({"Сонгино Хайрхан": "Сонгинохайрхан"})

        # remaining empties
        df.loc[df["district"].str.strip().eq(""), "district"] = "unknown"

    # Ensure city is set
    if "city" in df.columns:
        df.loc[df["city"].str.strip().eq(""), "city"] = "unknown"
        # if district is UB district, city should be Улаанбаатар
        if "district" in df.columns:
            ub_mask = df["district"].isin(UB_DISTRICTS)
            df.loc[ub_mask, "city"] = "Улаанбаатар"

    # Fill location_label
    if "location_label" in df.columns:
        df.loc[df["location_label"].str.strip().eq(""), "location_label"] = "unknown"

    # Recompute has_detailed_location:
    # only true if label is present and not just 'unknown'
    if "has_detailed_location" in df.columns and "location_label" in df.columns:
        df["has_detailed_location"] = df["location_label"].apply(lambda s: 0 if s in ("", "unknown") else 1)

    # Recompute location_full from city/district where missing/empty
    if "location_full" in df.columns and "city" in df.columns and "district" in df.columns:
        missing_lf = df["location_full"].str.strip().eq("")
        if missing_lf.any():
            df.loc[missing_lf, "location_full"] = [
                build_location_full(c, d)
                for c, d in zip(df.loc[missing_lf, "city"].tolist(), df.loc[missing_lf, "district"].tolist())
            ]
        df.loc[df["location_full"].str.strip().eq(""), "location_full"] = "unknown"

    # Fill other text/categorical columns with 'unknown'
    for col in ["source", "property_type", "transaction_type", "published", "category_name", "title", "url"]:
        if col in df.columns:
            df.loc[df[col].astype(str).str.strip().eq(""), col] = "unknown"

    # Numeric columns: fill NaN with median
    for col in ["room_count", "square_m2", "price_mnt", "price_per_sqm"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            med = df[col].median(skipna=True)
            df[col] = df[col].fillna(med if pd.notna(med) else 0.0)

    # Recompute price_per_sqm from price_mnt/square_m2 (prevents stale values)
    if {"price_mnt", "square_m2", "price_per_sqm"}.issubset(df.columns):
        sqm = df["square_m2"].astype(float)
        price = df["price_mnt"].astype(float)
        df["price_per_sqm"] = np.where(sqm > 0, price / sqm, df["price_per_sqm"])

    # Final guarantee: no NaN, no empty strings
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].fillna("unknown").astype(str)
            df.loc[df[col].str.strip().eq(""), col] = "unknown"

    # Write back (keep a one-time backup)
    backup = HERE / "clean_training.csv.bak"
    if not backup.exists():
        DATA_FILE.replace(backup)
        df.to_csv(DATA_FILE, index=False, encoding="utf-8")
        print(f"Backed up -> {backup.name}")
    else:
        df.to_csv(DATA_FILE, index=False, encoding="utf-8")
    print(f"Updated -> {DATA_FILE} (rows={len(df)})")


if __name__ == "__main__":
    main()


