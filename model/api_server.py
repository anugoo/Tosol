"""FastAPI server for real-estate price prediction.

Uses:
- production_model_sale.pkl / production_model_rent.pkl
- production_preprocess_sale.json / production_preprocess_rent.json

Run:
  pip install -r requirements.txt
  uvicorn api_server:app --host 0.0.0.0 --port 8001
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Literal, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


def safe_expm1(x: float) -> float:
    return float(np.expm1(np.clip(x, -50, 50)))


def encode_with_maps(value: str, mapping: Dict[str, int]) -> int:
    return int(mapping.get(value, mapping.get("unknown", 0)))


def to_range(pred: float, base_mape: float) -> Dict[str, float]:
    return {"low": pred * (1 - base_mape), "high": pred * (1 + base_mape)}


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


def validate_range(name: str, v: float, lo: float, hi: float) -> None:
    if v < lo or v > hi:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid {name}: {v}. Allowed range: [{lo}, {hi}]",
        )


class PredictRequest(BaseModel):
    segment: Literal["sale", "rent"]
    room_count: float = Field(..., ge=0.0)
    square_m2: float = Field(..., ge=0.0)
    city: str = Field(default="Улаанбаатар")
    district: str = Field(default="unknown")
    location_label: str = Field(default="")
    has_detailed_location: int = Field(default=0, ge=0, le=1)


class PredictResponse(BaseModel):
    segment: str
    prediction_mnt: float
    prediction_mnt_formatted: str
    range_mnt: Dict[str, float]
    range_mnt_formatted: Dict[str, str]
    assumed_mape: float
    warnings: list[str]


class ModelBundle:
    def __init__(self, segment: str):
        self.segment = segment
        self.model_path = Path(f"production_model_{segment}.pkl")
        self.meta_path = Path(f"production_preprocess_{segment}.json")
        self.model = joblib.load(self.model_path)
        self.meta: Dict[str, Any] = json.loads(self.meta_path.read_text(encoding="utf-8"))

    def predict(self, req: PredictRequest) -> PredictResponse:
        ranges = self.meta.get("valid_ranges", {})
        room_lo, room_hi = map(float, ranges.get("room_count", [0.5, 10]))
        sqm_lo, sqm_hi = map(float, ranges.get("square_m2", [10, 300]))
        room_count = float(req.room_count)
        square_m2 = float(req.square_m2)

        # Strict validation (reject invalid inputs instead of clamping)
        validate_range("room_count", room_count, room_lo, room_hi)
        validate_range("square_m2", square_m2, sqm_lo, sqm_hi)

        # Sanity: minimum sqm per room (very rough, prevents nonsense like 1 room in 10m2 if user claims 3 rooms)
        if room_count >= 1 and square_m2 < room_count * 8:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid combination: square_m2={square_m2} too small for room_count={room_count}.",
            )

        has_det = 1 if (req.location_label and req.location_label.strip()) else int(req.has_detailed_location)

        # derived
        room_sqm = room_count * square_m2
        sqm_sq = square_m2**2

        # market anchors from training medians
        ppsqm = self.meta.get("ppsqm_medians", {}) or {}
        global_ppsqm = float(ppsqm.get("global", 0.0))
        city_ppsqm_map = (ppsqm.get("city", {}) or {})
        dist_ppsqm_map = (ppsqm.get("district", {}) or {})
        city_key = req.city or "unknown"
        dist_key = req.district or "unknown"
        city_ppsqm = float(city_ppsqm_map.get(city_key, global_ppsqm))
        dist_ppsqm = resolve_district_ppsqm(
            city=city_key,
            district=dist_key,
            global_ppsqm=global_ppsqm,
            city_ppsqm_map=city_ppsqm_map,
            dist_ppsqm_map=dist_ppsqm_map,
            district_ppsqm_multipliers=self.meta.get("district_ppsqm_multipliers", {}) or {},
        )

        baseline_price = dist_ppsqm * square_m2
        baseline_log = float(np.log1p(max(baseline_price, 0.0)))

        cat_maps = self.meta.get("cat_maps", {})
        city_map = cat_maps.get("city", {"unknown": 0})
        dist_map = cat_maps.get("district", {"unknown": 0})

        city_enc = encode_with_maps(req.city or "unknown", city_map)
        dist_enc = encode_with_maps(req.district or "unknown", dist_map)

        Xdf = pd.DataFrame(
            [
                {
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
            ]
        )
        pred_log = float(self.model.predict(Xdf.values.astype(float))[0])
        target_kind = self.meta.get("target_kind", "price")

        q = self.meta.get("price_quantiles", {})
        q01 = float(q.get("q01", 0))
        q99 = float(q.get("q99", 0))

        if target_kind == "ppsqm":
            ppsqm = safe_expm1(pred_log)
            if q01 and q99:
                ppsqm = float(np.clip(ppsqm, q01, q99))
            pred = ppsqm * square_m2
        else:
            pred = safe_expm1(pred_log)
            if q01 and q99:
                pred = float(np.clip(pred, q01, q99))

        base_mape = 0.13 if self.segment == "sale" else 0.28
        rng = to_range(pred, base_mape)

        def fmt_mnt(v: float) -> str:
            return f"{v:,.0f} ₮"

        return PredictResponse(
            segment=self.segment,
            prediction_mnt=pred,
            prediction_mnt_formatted=fmt_mnt(pred),
            range_mnt=rng,
            range_mnt_formatted={"low": fmt_mnt(rng["low"]), "high": fmt_mnt(rng["high"])},
            assumed_mape=base_mape,
            warnings=[],
        )


app = FastAPI(title="RealEstate Price Predictor", version="1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

bundles: Dict[str, ModelBundle] = {}


@app.on_event("startup")
def _load_models():
    bundles["sale"] = ModelBundle("sale")
    bundles["rent"] = ModelBundle("rent")


@app.get("/health")
def health():
    return {"ok": True, "models": list(bundles.keys())}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    bundle = bundles[req.segment]
    return bundle.predict(req)
