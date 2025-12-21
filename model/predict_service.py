"""CLI prediction service for production models (sale / rent).

Loads:
- production_model_sale.pkl / production_model_rent.pkl
- production_preprocess_sale.json / production_preprocess_rent.json

Outputs JSON with prediction, range, and confidence.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd


def load_preprocess(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def encode_with_maps(value: str, mapping: Dict[str, int]) -> int:
    return mapping.get(value, mapping.get("unknown", 0))


def resolve_district_ppsqm(
    *,
    city: str,
    district: str,
    global_ppsqm: float,
    city_ppsqm_map: Dict[str, float],
    dist_ppsqm_map: Dict[str, float],
    district_ppsqm_multipliers: Dict[str, Dict[str, float]] | None,
) -> float:
    """Resolve district ppsqm with robust fallback (see train_production.py)."""
    district_ppsqm_multipliers = district_ppsqm_multipliers or {}
    if district in dist_ppsqm_map:
        return float(dist_ppsqm_map[district])
    city_base = float(city_ppsqm_map.get(city, global_ppsqm))
    mult = (district_ppsqm_multipliers.get(city, {}) or {}).get(district)
    if mult is not None:
        return float(city_base * float(mult))
    return float(city_base)


def build_feature_row(args: argparse.Namespace, meta: Dict[str, Any]) -> pd.DataFrame:
    # base inputs
    room_count = float(args.room_count)
    square_m2 = float(args.square_m2)
    has_det = 1 if (args.location_label and args.location_label.strip()) else int(args.has_detailed_location)
    city = args.city or "unknown"
    district = args.district or "unknown"

    # derived
    room_sqm = room_count * square_m2
    sqm_sq = square_m2 ** 2

    # market anchors from training medians
    ppsqm = meta.get("ppsqm_medians", {}) or {}
    global_ppsqm = float(ppsqm.get("global", 0.0))
    city_ppsqm_map = (ppsqm.get("city", {}) or {})
    dist_ppsqm_map = (ppsqm.get("district", {}) or {})
    city_ppsqm = float(city_ppsqm_map.get(city, global_ppsqm))
    dist_ppsqm = resolve_district_ppsqm(
        city=city,
        district=district,
        global_ppsqm=global_ppsqm,
        city_ppsqm_map=city_ppsqm_map,
        dist_ppsqm_map=dist_ppsqm_map,
        district_ppsqm_multipliers=meta.get("district_ppsqm_multipliers", {}) or {},
    )

    baseline_price = dist_ppsqm * square_m2
    baseline_log = float(np.log1p(max(baseline_price, 0.0)))

    # stable encoding
    cat_maps = meta.get("cat_maps", {})
    city_map = cat_maps.get("city", {"unknown": 0})
    dist_map = cat_maps.get("district", {"unknown": 0})
    city_enc = encode_with_maps(city, city_map)
    dist_enc = encode_with_maps(district, dist_map)

    row = {
        "room_count": room_count,
        "square_m2": square_m2,
        "has_detailed_location": has_det,
        "city_median_ppsqm": city_ppsqm,
        "district_median_ppsqm": dist_ppsqm,
        "baseline_price_mnt": baseline_price,
        "baseline_price_log1p": baseline_log,
        "room_sqm_interaction": room_sqm,
        "square_m2_squared": sqm_sq,
        "city": city_enc,
        "district": dist_enc,
    }
    return pd.DataFrame([row])


def clamp_inputs(args: argparse.Namespace, meta: Dict[str, Any]) -> Dict[str, Any]:
    ranges = meta.get("valid_ranges", {})
    warn = []
    errs = []

    def clamp(name: str, v: float):
        r = ranges.get(name)
        if not r:
            return v
        lo, hi = float(r[0]), float(r[1])
        if v < lo:
            errs.append(f"{name}={v} below {lo}")
            return v
        if v > hi:
            errs.append(f"{name}={v} above {hi}")
            return v
        return v

    args.room_count = clamp("room_count", float(args.room_count))
    args.square_m2 = clamp("square_m2", float(args.square_m2))
    if errs:
        raise SystemExit("Invalid input: " + "; ".join(errs))
    return {"warnings": warn}


def to_range(pred: float, base_mape: float) -> Dict[str, float]:
    # range from MAPE (e.g. 0.13 => +/-13%)
    lo = pred * (1 - base_mape)
    hi = pred * (1 + base_mape)
    return {"low": lo, "high": hi}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--segment", choices=["sale", "rent"], required=True)
    ap.add_argument("--room-count", type=float, required=True)
    ap.add_argument("--square-m2", type=float, required=True)
    ap.add_argument("--city", default="Улаанбаатар")
    ap.add_argument("--district", default="unknown")
    ap.add_argument("--location-label", default="")
    ap.add_argument("--has-detailed-location", type=int, default=0)
    ap.add_argument("--json", action="store_true", help="Print JSON only")
    args = ap.parse_args()

    model_path = Path(f"production_model_{args.segment}.pkl")
    preprocess_path = Path(f"production_preprocess_{args.segment}.json")
    if not model_path.exists() or not preprocess_path.exists():
        raise SystemExit(f"Missing model or preprocess for segment={args.segment}")

    model = joblib.load(model_path)
    meta = load_preprocess(preprocess_path)

    clamp_info = clamp_inputs(args, meta)
    Xdf = build_feature_row(args, meta)
    X = Xdf.values.astype(float)

    pred_log = float(model.predict(X)[0])
    target_kind = meta.get("target_kind", "price")

    # use segment-level mean mape if present in report (fallback)
    base_mape = 0.13 if args.segment == "sale" else 0.28

    q = meta.get("price_quantiles", {})
    q01 = float(q.get("q01", 0))
    q99 = float(q.get("q99", 0))

    if target_kind == "ppsqm":
        # model predicts ₮/m²
        ppsqm = float(np.expm1(np.clip(pred_log, -50, 50)))
        if q01 and q99:
            ppsqm = float(np.clip(ppsqm, q01, q99))
        pred = ppsqm * float(args.square_m2)
        rng = to_range(pred, base_mape)
    else:
        pred = float(np.expm1(np.clip(pred_log, -50, 50)))
        if q01 and q99:
            pred = float(np.clip(pred, q01, q99))
        rng = to_range(pred, base_mape)

    out = {
        "segment": args.segment,
        "inputs": {
            "room_count": float(args.room_count),
            "square_m2": float(args.square_m2),
            "city": args.city,
            "district": args.district,
            "location_label": args.location_label,
            "has_detailed_location": 1 if (args.location_label and args.location_label.strip()) else int(args.has_detailed_location),
        },
        "prediction_mnt": pred,
        "prediction_mnt_formatted": f"{pred:,.0f} ₮",
        "range_mnt": rng,
        "range_mnt_formatted": {
            "low": f"{rng['low']:,.0f} ₮",
            "high": f"{rng['high']:,.0f} ₮",
        },
        "assumed_mape": base_mape,
        "warnings": clamp_info["warnings"],
    }

    if args.json:
        print(json.dumps(out, ensure_ascii=False))
    else:
        print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()


