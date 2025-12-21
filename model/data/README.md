Cleaned dataset (for future training)
====================================

This folder contains a **cleaned dataset** exported from the current scrapers.

## Чухал асуулт: `.pkl` үүсгээд гарсны дараа энэ дата хэрэг болох эсэх?

### Inference үед (production дээр prediction хийх үед)
- **Дата хэрэггүй** — `.pkl` + `.json` л хангалттай
- Model аль хэдийн сурсан, зөвхөн prediction хийх л хэрэгтэй

### Retraining (дахин сургах) хийхэд
- **Дата заавал хэрэгтэй** — `clean_training.csv` эсвэл шинэ дата
- Яагаад? `.pkl` файл нь зөвхөн "сурсан параметрүүд" л агуулдаг, дахин сургах боломжгүй

### Энэ датаг хаана ашиглах боломжтой вэ?

1. **Model дахин сургах** (retraining)
   - Шинэ дата нэмэх
   - Model чанарыг сайжруулах
   - Хуучин model-ийг шинэчилэх

2. **Шинэ дата нэмэх**
   - `scrapers/`‑оор шинэ raw дата татаж
   - `clean_training.csv`‑тэй нэгтгэж
   - Дахин сургах

3. **Feature engineering туршилт**
   - Шинэ feature нэмэх
   - Outlier trimming сайжруулах
   - Encoding map өөрчлөх

4. **Segment тус бүрийн датаг нэмэгдүүлэх**
   - Жишээ: rent дата цөөн байвал нэмэх

## Файлууд

- `clean_training.csv` — цэвэрлэгдсэн дата (бүх багана бөглөгдсөн, NaN/хоосон байхгүй)
- `clean_training.csv.bak` — backup (fill script-ийн үүсгэсэн)
- `fill_missing_fields.py` — хоосон талбаруудыг бөглөх script

## Schema (columns)

- `source` — эх үүсвэр (`panz`, `my-zar`, гэх мэт)
- `property_type` (`apartment` / `house`)
- `transaction_type` (`sale` / `rent`)
- `room_count` — өрөөний тоо
- `square_m2` — талбай (м²)
- `price_mnt` — үнэ (₮)
- `price_per_sqm` — м² тутамд үнэ (₮/м²)
- `city` — хот
- `district` — дүүрэг
- `location_full` — бүрэн байршил
- `location_label` — нарийн байршил (хороо, хотхон гэх мэт)
- `has_detailed_location` (0/1)
- `published` — нийтлэгдсэн огноо
- `category_name` — ангилал
- `title` — зарын гарчиг
- `url` — зарын URL

## Retraining хийх алхам

1. `scrapers/`‑оор шинэ raw дата татах
2. `clean_training.csv`‑тэй нэгтгэх (эсвэл шинээр цэвэрлэх)
3. Training script ажиллуулах (одоогоор repo-д байхгүй, гэхдээ `DOCUMENTATION_MN.md` дээр skeleton байна)
4. Шинэ `production_model_*.pkl` + `production_preprocess_*.json` үүсгэх
5. `package/` доторх хуучин файлуудыг солих


