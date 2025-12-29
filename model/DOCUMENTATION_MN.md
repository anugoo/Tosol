# Үл хөдлөх хөрөнгийн үнэ таамаглагч (Production) — Монгол тайлбар

Энэ бичиг баримт нь `package/` дотор байгаа production-ready таамаглагч хэрхэн ажилладаг, ямар файлууд хэрэгтэй, model яаж бий болсон, ямар асуудлууд гарч хэрхэн зассан, мөн яагаад тийм шийдэл сонгосныг **Монгол хэлээр ойлгомжтой** тайлбарласан болно.

> Анхааруулга: Энэ репо одоогоор **production inference bundle** (`package/`) болон тусдаа **scraper bundle** (`scrapers/`) хэлбэрээр цэвэрлэгдсэн. Сургалт/merge хийх зарим туслах скриптүүдийг production-оос салгаж устгасан (production-доо хэрэггүй учир). Гэхдээ хийсэн ажлын логик/шийдлүүдийг энд бүрэн баримтжуулсан.

---

## 0) Чухал: `.pkl` үүсгээд гарсны дараа дата хэрэг болох эсэх?

### 0.1 Inference үед дата хэрэггүй

**Production дээр (API/CLI ажиллуулах үед)**:

- `.pkl` (model) + `.json` (preprocess metadata) **хоёулаа л хангалттай**
- **Дата (`clean_training.csv`) хэрэггүй** — model аль хэдийн сурсан, зөвхөн prediction хийх л хэрэгтэй

### 0.2 Retraining (дахин сургах) хийхэд дата заавал хэрэгтэй

**Яагаад?**

- `.pkl` файл нь зөвхөн **сурсан параметрүүд** (tree weights, split points гэх мэт) л агуулдаг
- Model-ийг **дахин сургах** (retraining) хийхэд:
  - **Дата дахин хэрэгтэй** (шинэ дата нэмэх, чанарыг сайжруулах гэх мэт)
  - Training script дахин ажиллуулах хэрэгтэй
  - Шинэ `.pkl` + `.json` үүсгэх хэрэгтэй

**Хаана ашиглах боломжтой?**

- `package/data/clean_training.csv` нь яг энэ зорилгоор хадгалагдсан
- Дараах тохиолдолд ашиглана:
  1. **Шинэ дата нэмэх** (жишээ: шинэ scrape хийж, дата нэмэх)
  2. **Model чанарыг сайжруулах** (жишээ: outlier trimming сайжруулах, feature engineering нэмэх)
  3. **Segment тус бүрийн датаг нэмэгдүүлэх** (жишээ: rent дата цөөн байвал нэмэх)
  4. **Хуучин model-ийг шинэчилэх** (жишээ: зах зээл өөрчлөгдсөн үед)

**Retraining хийх алхам:**

1. `scrapers/`‑оор шинэ raw дата татах
2. `package/data/clean_training.csv`‑тэй нэгтгэх
3. Training script ажиллуулах (одоогоор repo-д байхгүй, гэхдээ `DOCUMENTATION_MN.md` дээр skeleton байна)
4. Шинэ `production_model_*.pkl` + `production_preprocess_*.json` үүсгэх
5. `package/` доторх хуучин файлуудыг солих

**Дүгнэлт:**

- **Inference үед**: `.pkl` + `.json` л хангалттай (дата хэрэггүй)
- **Retraining үед**: `package/data/clean_training.csv` заавал хэрэгтэй

---

## 1) Юу хийдэг систем вэ?

Хэрэглэгч дараах мэдээллүүдийг оруулна:

- `segment`: `sale` (зарах) эсвэл `rent` (түрээслэх)
- `room_count`: өрөөний тоо
- `square_m2`: талбай (м²)
- `city`, `district` (+ optional `location_label`)

Систем эдгээр input-оор:

- **таамаг үнэ** (`prediction_mnt`)
- **диапазон** (`range_mnt.low`, `range_mnt.high`)
- **₮ тэмдэгтэй формат** (`prediction_mnt_formatted`, `range_mnt_formatted`)

гэж буцаана.

---

## 2) Production дээр ямар файлууд заавал хэрэгтэй вэ?

`package/` доторх **хамгийн чухал** 4 artifact:

- `production_model_sale.pkl` — sale model (ML model өөрөө)
- `production_model_rent.pkl` — rent model (ML model өөрөө)
- `production_preprocess_sale.json` — sale inference preprocessing metadata
- `production_preprocess_rent.json` — rent inference preprocessing metadata

Мөн runtime код:

- `api_server.py` — FastAPI сервер
- `predict_service.py` — CLI prediction
- `requirements.txt` — dependency
- `README.md` — quick usage

### Яагаад `.pkl` ба `.json` хоёулаа хэрэгтэй вэ?

- `.pkl`: Model-ийн сурсан параметрүүд (tree/boosting weights гэх мэт) хадгалагдсан.
- `.json`: Inference үед **яг сургалтын үеийн адил** feature бэлтгэхийн тулд хэрэгтэй:
  - `city`, `district` зэрэг string-ийг тоо болгох `cat_maps`
  - `square_m2`, `room_count` зэрэг утгын зөвшөөрөгдөх хүрээ `valid_ranges`
  - market anchor-ууд (`ppsqm_medians`, дүүргийн multiplier гэх мэт)
  - feature-ийн дараалал/зорилтот төрөл (`target_kind`)

Хэрвээ `.json` байхгүй бол:

- encode map зөрөх,
- feature дараалал солигдох,
- district/city “unknown” болж унах,
  гээд prediction буруу гарах эрсдэл өндөр.

---

## 3) API/CLI хэрхэн ажиллуулж тест хийх вэ?

### 3.1 FastAPI асаах

```bash
cd /Users/teyji/teyji.developer/webscrapping/package
pip install -r requirements.txt
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Health:

```bash
curl http://127.0.0.1:8000/health
```

Predict:

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"segment":"rent","room_count":2,"square_m2":45,"city":"Улаанбаатар","district":"Баянзүрх","location_label":"13-р хороолол"}'
```

### 3.2 CLI ашиглах

```bash
cd /Users/teyji/teyji.developer/webscrapping/package
python predict_service.py --segment rent --room-count 2 --square-m2 45 --city Улаанбаатар --district Баянзүрх --json
```

---

## 4) Ямар дата-ас model сурсан бэ? (Түүх + логик)

Системийн зорилго: Монгол үл хөдлөхийн зах зээлд “бодитой” үнэ гаргах.

Эх сурвалжуудын ерөнхий санаа:

- `panz.mn` — JSON API ашиглан зарууд татаж авсан
- `my-zar.mn` — HTML parsing ашиглан зарууд татаж авсан
- `osdata.csv` — хуучин (2025 орчим) өгөгдөл (schema өөр)

Дараах асуудлууд гарсан:

- зарим сайт Cloudflare/robots.txt/SSL зэрэг хамгаалалтаас болж тогтвортой scrape хийхэд хэцүү
- `osdata.csv` нь хуучин үнэтэй тул “өнөөдрийн зах зээл”-ээс зөрөх
- `my-zar` дээр category/slug буруу сонговол үл хөдлөх биш зар холилдох эрсдэлтэй

---

## 5) Өгөгдөл цэвэрлэгээ ба нэгтгэл (Data cleaning)

### 5.1 Schema нэгтгэх

Сургалтанд ашиглах үндсэн баганууд:

- `segment`-ээс салгасан: `transaction_type` (`sale`/`rent`)
- `property_type` (`apartment`/`house`)
- `room_count`, `square_m2`
- `city`, `district`, `location_label`, `has_detailed_location`
- `price_mnt` (зорилтот үнэ)

### 5.2 Үнэ/талбайн sanity filter

Зах зээл дээрх бодит бус утгууд model-г эвддэг тул:

- `square_m2` — 10–300 м² (ерөнхий)
- `price_mnt` — sale ба rent дээр өөр өөр:
  - sale: ихэвчлэн 20–300+ сая орчим, гэхдээ маш доод “алдаатай” утгуудыг хаяна
  - rent: 50k–20M (түрээсийн хүрээ)

### 5.3 Outlier trimming (маш чухал)

Өгөгдөлд:

- “0 дутуу”, “хэт өндөр”, “хэмжээ буруу”
  гэсэн экстрем утга олон байсан.

Тиймээс:

- `price_per_sqm` (\(price_mnt / square_m2\)) дээр **segment тус бүрийн** зөвшөөрөгдөх хүрээ тавьсан
- цаашлаад `property_type + district` бүлгээр `price_per_sqm`-ийн **0.02–0.98 quantile trimming** хийж “сүүл” утгуудыг тайрсан

Энэ алхам хийгдээгүй үед:

- model-ийн MAPE (алдаа) огцом өндөр байсан
- prediction бодит бус, хэлбэлзэлгүй болж байсан

---

## 6) Feature engineering (Яагаад тийм feature сонгосон бэ?)

### 6.1 Гол input feature-үүд

- `room_count`
- `square_m2`
- `has_detailed_location`
- `city`, `district` (encoding хийж тоо болгоно)

### 6.2 Interaction / nonlinear feature-үүд

Зах зээл дээр үнэ нь нэг хэмжигдэхүүнээс (“талбай”) ганцаараа хамаарахгүй, мөн шугаман биш хэлбэртэй байдаг тул дараах feature-үүдийг нэмсэн:

- `room_sqm_interaction = room_count * square_m2`
  - **Яагаад**: өрөө олон болох тусам “ижил м²” байсан ч үнэ өсөх/өөрчлөгдөх хандлага гардаг.
- `square_m2_squared = square_m2^2`
  - **Яагаад**: талбай өсөхөд үнэ өсөх нь дан шугаман биш (том талбайтай байр/хаусны зах зээл өөр).

### 6.3 “Зах зээлийн суурь” (Market anchors) — leaky биш хэлбэрээр

Энд хамгийн чухал ойлголт:

- **Leaky feature**: зорилтот үнэ (`price_mnt`)‑ээс шууд тооцоолсон утгыг feature болгон ашиглавал model “хуурамч өндөр үнэлгээтэй” болж бодит амьдрал дээр унадаг.

Бидний өмнөх том алдаа:

- `price_per_sqm = price_mnt / square_m2`‑ийг feature болгон ашигласан → энэ нь **зорилтоос гарсан** (leakage) учраас prediction утгагүй болж байсан.

Зассан шийдэл (leaky биш):

- `ppsqm_medians`‑ийг **зөвхөн сургалтын дата** дээрээс гаргаж, inference үед “зах зээлийн суурь” гэж ашиглах:
  - `city_median_ppsqm`
  - `district_median_ppsqm`
- `baseline_price_mnt = district_median_ppsqm * square_m2`
- `baseline_price_log1p = log1p(baseline_price_mnt)`

**Яагаад энэ зөв вэ?**

- Эдгээр median-ууд нь тухайн зарын үнэ (`price_mnt`)‑ээс хамаарахгүй, зөвхөн training distribution‑оос гарсан **ерөнхий зах зээлийн түвшин**.
- Ингэснээр model “хэт бага/хэт их” гэх мэт алдааг зах зээлийн anchor‑аар тэнцвэржүүлдэг.

---

## 7) Training target-ийг яагаад ₮/м² (ppsqm) болгосон бэ?

### 7.1 Гол санаа

`price_mnt` (нийт үнэ)‑ийг шууд сургах үед:

- “талбай ихсэх тусам үнэ өсөх” гэдэг хуулийг заримдаа model “сайн ойлгодоггүй”
- rent дээр бүр “square_m2 өөрчлөөд ч үнэ ижил” гэдэг асуудал гарч байсан

Тиймээс бид:

- **sale, rent хоёр дээр хоёуланд нь** `ppsqm = price_mnt / square_m2`‑ийг model-ийн target болгож сургаад,
- inference үед:

\[
\text{predicted_price_mnt} = \text{predicted_ppsqm} \times square_m2
\]

гэж нийт үнийг гаргадаг болгосон.

### 7.2 Яагаад энэ практикт сайн бэ?

- **square_m2-ийн мэдрэмж** автоматаар зөв болно (заавал өснө/буурна).
- “зах зээлийн хэмжүүр” болох ₮/м² дээр model илүү тогтвортой сурах хандлагатай.

### 7.3 Log transform

`ppsqm` (болон зарим baseline)‑д:

- `log1p` transform ашигласан (skewed distribution‑ийг тогтворжуулна).
- буцаахдаа overflow хамгаалалттай `safe_expm1` хэрэглэсэн.

---

## 8) Model сонголт (яагаад HistGradientBoostingRegressor?)

Ашигласан гол model: **HistGradientBoostingRegressor**

- **Яагаад**:
  - таблич өгөгдөл дээр сайн ажилладаг
  - nonlinear & interaction‑уудыг сайн барина
  - `early_stopping`‑той → overfit багасгана

Hyperparam-уудыг segment‑ээр ялгасан:

- rent нь дата цөөн байх магадлалтай тул `min_samples_leaf` гэх мэтийг илүү “зөөлөн” тохируулна.

---

## 9) Гол алдаа, асуудлууд ба шийдсэн арга

### 9.1 Feature leakage (хамгийн том бодит асуудал)

**Асуудал**: `price_per_sqm`‑ийг feature болгосон → prediction бодит биш (ж: “3 өрөө байр хэзээ ч ийм үнэтэй байхгүй”).

**Шийдэл**:

- `price_per_sqm`‑ийг feature‑ээс хассан
- оронд нь training‑ийн `ppsqm_medians` + baseline anchor feature ашигласан

### 9.2 Rent дээр square_m2 өөрчлөгдөхөд үнэ өөрчлөгдөхгүй

**Асуудал**: rent model square_m2‑д insensitive

**Шийдэл**:

- rent‑ийн target‑ийг ₮/м² болгож сургаад дараа нь sqm‑ээр үржүүлэх
- feature бэлтгэл дээр `square_m2`, `square_m2_squared`, `room_sqm_interaction`‑уудыг баталгаатай оруулах

### 9.3 District rent дээр “бүгд адилхан” гарах

**Яагаад болсон бэ?**

- rent training дээр зарим дүүргийн статистик хангалтгүй → `district_median_ppsqm` нь `unknown/global` руу унаж байв.

**Шийдэл**:

- УБ-ын 9 дүүргийг encoding map‑д заавал оруулах
- rent дээр district median байхгүй үед:
  - sale сегментээс гаргасан `district_ppsqm_multipliers` (district/city ratio)‑аар **fallback** хийж ялгаа гаргасан

---

## 10) Input validation ба хэрэглэгчид ээлтэй API

`api_server.py` ба `predict_service.py` дээр:

- `square_m2`, `room_count`‑ын зөвшөөрөгдөх хүрээг шалгана (`422` алдаа буцааж болно)
- response дээр:
  - `prediction_mnt_formatted` (₮)
  - `range_mnt_formatted` (₮)

Диапазон (`range_mnt`) нь одоогоор:

- segment‑ийн assumed MAPE‑аар ± хувь тооцож гарч байна.

---

## 11) Productionization (яагаад ингэж folder-уудыг салгасан бэ?)

### 11.1 `package/` — production inference bundle

Production дээр model ажиллуулахад:

- API/CLI
- `.pkl` + `.json` артефакт

Энэ л хэрэгтэй.

### 11.2 `scrapers/` — scraping bundle

Scrape хийх код production‑оос салангид байх нь:

- dependency өөр
- ажиллуулах орчин өөр (rate-limit, robots, network)
- production deploy‑д unnecessary risk (илүү олон package, security surface)

Тиймээс `scrapers/` гэж тусад нь хадгалсан.

### 11.3 `package/data/` — цэвэр датаны backup

`package/data/clean_training.csv` нь:

- дараа дахин сургах/шинэ дата нэмэх үед эхлэх суурь
- бүх багана хоосон биш байдлаар бөглөгдсөн

Мөн `package/data/fill_missing_fields.py` гэж “хоосон талбар бөглөх” скрипт үлдээсэн.

---

## 12) Дахин сургах (Retraining) талаар

Энэ repo одоогоор production-д цэвэрлэгдсэн тул:

- сургалтын том pipeline‑ийн зарим файл production‑оос салгаж устгасан.

Гэхдээ дахин сургах шаардлага гарвал хамгийн зөв бүтэц:

1. `scrapers/`‑оор raw дата татах
2. `package/data/` руу цэвэр датаг гаргах (schema нэгтгэх, outlier trimming)
3. training script‑ийг тусдаа `training/` folder эсвэл тусдаа repo‑д хадгалах
4. шинэ model гармагц `package/`‑д `production_model_*.pkl` + `production_preprocess_*.json`‑ийг солих

---

## 13) Одоогийн хязгаарлалт ба сайжруулах дараагийн боломж

- `district=unknown` их байвал: my-zar дээр detail page‑ээс location илүү сайн татах шаардлагатай.
- `location_label` одоогоор зөвхөн `has_detailed_location` (0/1) байдлаар нөлөөлж байна. Илүү нарийн нөлөөлүүлэх бол:
  - `location_label`‑ийг ангилж (subdistrict/хороолол) feature болгох
  - эсвэл embedding/TF-IDF гэх мэт текст feature нэмэх

---

## 14) Файлын бүтэц (одоогийн)

```
webscrapping/
  package/                 # production inference bundle
    api_server.py
    predict_service.py
    production_model_sale.pkl
    production_model_rent.pkl
    production_preprocess_sale.json
    production_preprocess_rent.json
    requirements.txt
    README.md
    DOCUMENTATION_MN.md
    data/
      clean_training.csv
      clean_training.csv.bak
      fill_missing_fields.py
      README.md
  scrapers/                # scraping bundle
    panz_scraper.py
    scrape_rentals_panz.py
    myzar_scraper.py
    requirements.txt
    README.md
    out/                   # raw outputs (local)
```

---

## 15) `.pkl` (model) ба `.json` (preprocess)‑ийг яаж үүсгэдэг вэ? — Маш дэлгэрэнгүй

Энэ хэсэг бол хамгийн чухал “production артефакт яаж бий болдог вэ?” гэсэн асуултын хариулт.

### 15.1 Гол ойлголтууд

- **Model artifact (`.pkl`)**: сургасан ML model‑ийн жин/параметрүүдийг хадгалсан файл.
  - Манайд `joblib.dump(model, "production_model_sale.pkl")` гэх мэтээр үүссэн.
- **Preprocess artifact (`.json`)**: inference үед feature‑үүдийг **яг training‑ийнхтай адил** бэлтгэхэд хэрэгтэй “metadata”.
  - Манайд `json.dumps(meta)`‑аар үүссэн.

> Яагаад 2 тусдаа вэ?  
> Учир нь sklearn model (`.pkl`) нь “string категори” (`city`, `district`)‑г яаж тоо болгосон, ямар дарааллаар feature өгсөн, ямар range‑ээр шалгах гэх мэтийг автоматаар авч үлддэггүй. Тиймээс `.json` заавал хамт байна.

---

### 15.2 Training pipeline‑ийн ерөнхий урсгал (Step-by-step)

#### Step A — Data цуглуулах (scrape)

1. `scrapers/`‑оор raw дата татна:

- panz → JSON API
- my-zar → HTML card parsing

2. raw CSV‑ууд дээр:

- үнэ parse (`price_text` → `price_mnt`)
- талбай parse (гарчиг дотроос “m²/мкв” мэт)
- өрөө parse (“2 өрөө” мэт)
- байршил parse (дүүрэг нэр/товчлол)

#### Step B — Schema нэгтгэх

Бүх эх үүсвэрээс нэг schema руу:

- `room_count`, `square_m2`, `price_mnt`, `city`, `district`, …

#### Step C — Cleaning + outlier trimming

Энд model “чанартай” болох эсэх шууд шийдэгддэг.

- Талбай/үнэ бодит хүрээ шалгах
- `price_per_sqm`‑ийн хүрээ шалгах
- бүлгээр tail trimming (quantile 0.02–0.98 гэх мэт)

#### Step D — Feature engineering + encoding map үүсгэх

Training үед:

- categorical map: `cat_maps` (city/district value→int)
- market anchors: `ppsqm_medians`
- rent дүүрэг дутуу үед fallback: `district_ppsqm_multipliers` (sale‑оос)

#### Step E — Target сонгох (ppsqm)

Манайд sale/rent хоёуланд нь:

- \(ppsqm = price_mnt / square_m2\)
- model энэ `ppsqm`‑г `log1p` дээр сурна:
  - \(y = log(1 + ppsqm)\)

#### Step F — Model training

- `HistGradientBoostingRegressor` ашиглана
- `early_stopping=True` → validation дээр сайжрахгүй бол автоматаар зогсооно

#### Step G — Evaluation (MAPE)

MAPE:
\[
MAPE = mean(|(y*{true} - y*{pred}) / y\_{true}|)
\]
Accuracy гэж:
\[
Accuracy = 1 - MAPE
\]

#### Step H — Export (production artifacts)

1. `.pkl`: model өөрөө
2. `.json`: preprocess/meta

---

### 15.3 `.pkl` үүсгэх дэлгэрэнгүй (joblib)

#### Ямар формат вэ?

`joblib` нь sklearn model‑уудыг serialize хийхэд түгээмэл хэрэглэгддэг.

Жишээ:

```python
import joblib

# model нь sklearn estimator
joblib.dump(model, "production_model_sale.pkl")

# дахин ачаалах
model = joblib.load("production_model_sale.pkl")
```

#### Яагаад `.pkl` гэж нэрлэдэг вэ?

Python‑ийн “pickle” serialization‑аас гаралтай. `joblib` нь pickle дээр суурилсан (том numpy array‑тай объектод илүү тохиромжтой).

> Анхаар: `.pkl`‑ийг зөвхөн итгэлтэй эх сурвалжаас load хийх хэрэгтэй (аюулгүй байдлын үндсэн дүрэм).

---

### 15.4 `.json` preprocess file үүсгэх дэлгэрэнгүй

Манай `.json`‑д (жишээ: `production_preprocess_sale.json`) ерөнхийдөө эдгээр орно:

- **`cat_maps`**: `city`, `district` гэх categorical утгыг integer болгох mapping
- **`ppsqm_medians`**: global/city/district median ₮/м² (leaky биш market anchor)
- **`district_ppsqm_multipliers`**: rent дээр district median дутуу үед sale‑оос fallback хийх ratio map
- **`valid_ranges`**: input validation (room_count, square_m2)
- **`price_quantiles`**: training дээрх ppsqm quantile (prediction clipping хийхэд)
- **`feature_order`**: inference үед feature‑ийн зөв дараалал
- **`target_kind`**: `ppsqm` (model‑ийн таамаглаж буй зорилт)

Үүсгэх жишээ:

```python
import json
from pathlib import Path

meta = {
  "cat_maps": cat_maps,
  "ppsqm_medians": ppsqm_medians,
  "district_ppsqm_multipliers": district_ppsqm_multipliers,
  "valid_ranges": {"square_m2": [10, 300], "room_count": [0.5, 10]},
  "price_quantiles": {"q01": float(q01), "q50": float(q50), "q99": float(q99)},
  "feature_order": feature_order,
  "target_transform": "log1p",
  "target_kind": "ppsqm",
}

Path("production_preprocess_sale.json").write_text(
  json.dumps(meta, ensure_ascii=False, indent=2),
  encoding="utf-8"
)
```

---

### 15.5 Inference үед `.pkl` + `.json`‑ийг хэрхэн ашигладаг вэ?

Inference урсгал:

1. `.json`‑оос meta уншина
2. input‑уудыг validate хийнэ (`valid_ranges`)
3. feature row бэлдэнэ:
   - `ppsqm_medians`‑аас city/district median‑уудыг олно
   - `district_ppsqm_multipliers`‑ын fallback хэрэглэнэ (хэрэв хэрэгтэй бол)
   - categorical утгуудыг `cat_maps`‑аар encode хийнэ
4. model (`.pkl`)‑д өгч `pred_log` гаргана
5. `safe_expm1` хийгээд `predicted_ppsqm` гаргана
6. total үнэ:
   - `predicted_price_mnt = predicted_ppsqm * square_m2`

---

### 15.6 Яагаад quantile clipping (q01/q99) хийдэг вэ?

Boosting model заримдаа training‑ээс гадуур input дээр “хэт өндөр/хэт бага” ppsqm гаргах эрсдэлтэй.
Тиймээс training‑ийн ppsqm тархалтын:

- 1% (`q01`)
- 99% (`q99`)
  хооронд clip хийснээр:
- хэт экстрем prediction‑ийг зөөлрүүлж
- хэрэглэгчид илүү бодитой үр дүн өгнө.
