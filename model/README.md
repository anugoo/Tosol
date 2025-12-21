Production bundle (inference only)
=================================

This folder contains the **minimal, production-ready runtime** for price prediction.

## Project structure (file-by-file)

### Runtime code
- `api_server.py`
  - **What it is**: FastAPI server exposing `/health` and `/predict`
  - **Why it exists**: lets users call predictions via HTTP from any app (web/mobile/backend)
  - **Uses**: loads `.pkl` + `.json` artifacts on startup

- `predict_service.py`
  - **What it is**: CLI prediction utility (prints JSON output)
  - **Why it exists**: easiest way to test the model without running a server
  - **Uses**: same `.pkl` + `.json` artifacts, same feature building logic

### Model artifacts (MUST be kept together)
- `production_model_sale.pkl`
  - **What it is**: trained model for **sale** segment
  - **Format**: `joblib` serialized scikit-learn model

- `production_model_rent.pkl`
  - **What it is**: trained model for **rent** segment
  - **Format**: `joblib` serialized scikit-learn model

- `production_preprocess_sale.json`
  - **What it is**: preprocessing metadata for sale inference
  - **Contains**: categorical encoding maps, valid ranges, market anchors, feature order, etc.

- `production_preprocess_rent.json`
  - **What it is**: preprocessing metadata for rent inference
  - **Contains**: categorical encoding maps, valid ranges, market anchors, fallback multipliers, etc.

### Dependencies + docs
- `requirements.txt`
  - **What it is**: Python dependencies for runtime

- `README.md`
  - **What it is**: short “how to run” guide

- `DOCUMENTATION_MN.md`
  - **What it is**: full Mongolian documentation (how model is made, why, troubleshooting, etc.)

### Data (optional, for future retraining)
- `data/`
  - `data/clean_training.csv`: cleaned dataset snapshot (no NaN / no empty strings)
  - `data/clean_training.csv.bak`: one-time backup created by the fill script
  - `data/fill_missing_fields.py`: script to fill missing fields in the dataset
  - `data/README.md`: dataset schema notes

CLI prediction
--------------
```bash
python predict_service.py --segment sale --room-count 3 --square-m2 80 --city Улаанбаатар --district Баянзүрх
python predict_service.py --segment rent --room-count 2 --square-m2 50 --city Улаанбаатар --district Хан-Уул
```

FastAPI server (production-style)
---------------------------------
1) Start server:

```bash
cd model
pip install -r requirements.txt
uvicorn api_server:app --host 0.0.0.0 --port 8001
```

2) Health check:

```bash
curl http://127.0.0.1:8001/health
```

3) Predict:

```bash
curl -X POST http://127.0.0.1:8001/predict \
  -H 'Content-Type: application/json' \
  -d '{"segment":"sale","room_count":3,"square_m2":80,"city":"Улаанбаатар","district":"Баянзүрх"}'
```

Notes
-----
- API response includes currency-formatted strings (₮).

