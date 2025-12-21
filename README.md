# Tosol - Real Estate Platform

Тосол нь Монголын үл хөдлөх хөрөнгийн зах зээлд зориулсан бүтэн стекийн веб платформ юм. Энэхүү төсөл нь Django REST API backend, React TypeScript frontend, болон FastAPI суурьтай Machine Learning үнэ тооцоолох сервисээс бүрддэг.

## 📋 Агуулга

- [Төслийн бүтэц](#төслийн-бүтэц)
- [Шаардлага](#шаардлага)
- [Суулгах заавар](#суулгах-заавар)
- [Ажиллуулах заавар](#ажиллуулах-заавар)
- [API Документаци](#api-документаци)
- [Технологийн стек](#технологийн-стек)
- [Хөгжүүлэлт](#хөгжүүлэлт)

## 🏗️ Төслийн бүтэц

```
Tosol/
├── backend/          # Django REST API сервер
│   ├── appbackend/   # Гол Django аппликейшн
│   ├── backend/      # Django тохиргоо
│   ├── media/        # Зураг файлууд
│   └── db.sqlite3    # SQLite хөгжүүлэлтийн өгөгдлийн сан
├── frontend/         # React TypeScript фронтенд
│   ├── src/
│   │   ├── components/  # React компонентүүд
│   │   ├── pages/       # Хуудаснууд
│   │   ├── utils/       # Хэрэглээний функцүүд
│   │   └── context/     # React Context
│   └── public/         # Статик файлууд
└── model/            # ML үнэ тооцоолох сервис
    ├── api_server.py  # FastAPI сервер
    ├── predict_service.py  # CLI утилит
    └── production_model_*.pkl  # Сургасан загварууд
```

## 📦 Шаардлага

### Backend (Django)

- Python 3.8+
- Django 5.1.1
- PostgreSQL (production) эсвэл SQLite3 (development)
- psycopg2 (PostgreSQL холболт)
- django-cors-headers

### Frontend (React)

- Node.js 18+
- npm эсвэл yarn
- Vite

### Model (FastAPI)

- Python 3.8+
- FastAPI
- scikit-learn
- pandas, numpy
- uvicorn

## 🚀 Суулгах заавар

### 1. Backend суулгах

```bash
cd backend

# Virtual environment үүсгэх (зөвлөмж)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Django суулгах
pip3 install django==5.1.1
pip3 install django-cors-headers
pip3 install psycopg2-binary  # PostgreSQL-д зориулсан

# Өгөгдлийн сан бэлтгэх
python manage.py makemigrations
python manage.py migrate

# Супер хэрэглэгч үүсгэх (сонголттой)
python manage.py createsuperuser
```

### 2. Frontend суулгах

```bash
cd frontend

# Dependencies суулгах
npm install
# эсвэл
yarn install
```

### 3. Model сервис суулгах

```bash
cd model

# Python dependencies суулгах
pip install -r requirements.txt
```

## ▶️ Ажиллуулах заавар

### Нэг командаар бүгдийг ажиллуулах

Төслийн root directory-д байрлах `start.sh` эсвэл `start.py` скриптийг ашиглана:

**macOS/Linux:**

```bash
chmod +x start.sh
./start.sh
```

**Windows:**

```bash
start.bat
```

**Python (бүх системд):**

```bash
python start.py
```

### Тусдаа ажиллуулах

#### Backend (Django)

```bash
cd backend
python manage.py runserver
```

Backend нь `http://localhost:8000` дээр ажиллана.

#### Frontend (React)

```bash
cd frontend
npm run dev
# эсвэл
yarn dev
```

Frontend нь `http://localhost:8080` дээр ажиллана.

#### Model API (FastAPI)

```bash
cd model
uvicorn api_server:app --host 0.0.0.0 --port 8001
```

Model API нь `http://localhost:8001` дээр ажиллана.

## 🌐 Порт тохиргоо

- **Backend (Django)**: `http://localhost:8000`
- **Frontend (React)**: `http://localhost:8080`
- **Model API (FastAPI)**: `http://localhost:8001`

## 📡 API Документаци

### Backend API Endpoints

#### Authentication

- `POST /user/` - Нэвтрэх, бүртгүүлэх, нууц үг сэргээх
  - `action: "login"` - Нэвтрэх
  - `action: "register"` - Бүртгүүлэх
  - `action: "forgot"` - Нууц үг сэргээх хүсэлт илгээх
  - `action: "resetpassword"` - Нууц үг сэргээх
  - `action: "changepassword"` - Нууц үг өөрчлөх

#### Properties (Зар)

- `POST /user/` - Зарны үйлдлүүд
  - `action: "getzar"` - Бүх идэвхтэй заруудыг авах (pagination)
  - `action: "getzarbyid"` - ID-аар зарыг авах
  - `action: "get_my_ads"` - Хэрэглэгчийн заруудыг авах
  - `action: "add_zar"` - Шинэ зар нэмэх
  - `action: "update_zar"` - Зар засах
  - `action: "delete_zar"` - Зар устгах
  - `action: "search_zar"` - Зар хайх (шүүлт, pagination)

#### Comments (Сэтгэгдэл)

- `action: "add_comment"` - Сэтгэгдэл нэмэх
- `action: "get_comments"` - Сэтгэгдлүүдийг авах
- `action: "delete_comment"` - Сэтгэгдэл устгах
- `action: "update_comment"` - Сэтгэгдэл засах

#### Likes (Таалагдсан)

- `action: "toggle_like"` - Таалагдсан товч дарах
- `action: "get_likes_count"` - Таалагдсан тоог авах
- `action: "get_user_likes"` - Хэрэглэгчийн таалагдсан зарууд
- `action: "get_most_liked"` - Хамгийн их таалагдсан зарууд

#### System Data

- `POST /system/` - Системийн мэдээлэл
  - `action: "getturul"` - Төрөл, статус, хот, дүүрэг, барилгын төрөл

#### User Dashboard

- `POST /useredit/` - Хэрэглэгчийн мэдээлэл
  - `action: "get_user_info"` - Хэрэглэгчийн мэдээлэл авах
  - `action: "update_user_profile"` - Хэрэглэгчийн профайл засах

### Model API Endpoints

#### Health Check

```bash
GET http://localhost:8001/health
```

#### Price Prediction

```bash
POST http://localhost:8001/predict
Content-Type: application/json

{
  "segment": "sale",  # эсвэл "rent"
  "room_count": 3,
  "square_m2": 80,
  "city": "Улаанбаатар",
  "district": "Баянзүрх",
  "location_label": "",
  "has_detailed_location": 0
}
```

**Response:**

```json
{
  "segment": "sale",
  "prediction_mnt": 150000000,
  "prediction_mnt_formatted": "150,000,000 ₮",
  "range_mnt": {
    "low": 130500000,
    "high": 169500000
  },
  "range_mnt_formatted": {
    "low": "130,500,000 ₮",
    "high": "169,500,000 ₮"
  },
  "assumed_mape": 0.13,
  "warnings": []
}
```

## 🛠️ Технологийн стек

### Backend

- **Framework**: Django 5.1.1
- **Database**: PostgreSQL (production), SQLite3 (development)
- **Authentication**: Token-based (custom implementation)
- **CORS**: django-cors-headers
- **Email**: SMTP (Gmail)

### Frontend

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM 6.30.1
- **Forms**: React Hook Form + Zod validation

### Model

- **Framework**: FastAPI
- **ML Library**: scikit-learn
- **Data Processing**: pandas, numpy
- **Server**: uvicorn

## 🗄️ Өгөгдлийн сан бүтэц

### Гол хүснэгтүүд

- `t_user` - Хэрэглэгчид
- `t_zar` - Зар (үл хөдлөх хөрөнгө)
- `t_zar_zurag` - Зарын зурагнууд
- `t_comment` - Сэтгэгдлүүд
- `t_like` - Таалагдсан
- `t_token` - Token (баталгаажуулалт, нууц үг сэргээх)
- `t_turul` - Зарны төрөл
- `t_tuluv` - Зарны статус
- `t_hot` - Хот
- `t_duureg` - Дүүрэг
- `t_hiits` - Барилгын төрөл

## 🔧 Хөгжүүлэлт

### Backend хөгжүүлэлт

```bash
cd backend

# Migrations үүсгэх
python manage.py makemigrations

# Migrations хийх
python manage.py migrate

# Django shell нээх
python manage.py shell

# Статик файлууд цуглуулах (production)
python manage.py collectstatic
```

### Frontend хөгжүүлэлт

```bash
cd frontend

# Development server ажиллуулах
npm run dev

# Production build үүсгэх
npm run build

# Build preview харах
npm run preview

# Linting
npm run lint
```

### Environment Variables

Backend-д шаардлагатай тохиргоонууд (`backend/backend/settings.py`):

- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug горим (development: True)
- `DATABASES` - Өгөгдлийн сан тохиргоо
- `EMAIL_HOST_USER` - Email хост
- `EMAIL_HOST_PASSWORD` - Email нууц үг
- `CORS_ALLOWED_ORIGINS` - CORS зөвшөөрөгдсөн эх үүсвэрүүд

## 📝 Response Format

Бүх API хариу нь дараах форматтай:

```json
{
  "resultCode": 200,
  "resultMessage": "Success",
  "data": [...],
  "size": 1,
  "action": "getzar",
  "curdate": "2024/01/01 12:00:00"
}
```

### Result Codes

- `200` - Амжилттай
- `400` - Буруу хүсэлт
- `404` - Олдсонгүй
- `1000-1999` - Authentication алдаанууд
- `3000-3999` - Validation алдаанууд
- `5000-5999` - Server алдаанууд
- `6000-6999` - System алдаанууд
- `7000-7999` - Property (Зар) алдаанууд
- `8000-8999` - Comment алдаанууд
- `9000-9999` - Like болон ML алдаанууд

## 🧪 Тест

```bash
# Backend тест
cd backend
python manage.py test

# Frontend тест (хэрэв байгаа бол)
cd frontend
npm test
```

## 📦 Production Deployment

### Backend

1. PostgreSQL өгөгдлийн сан тохируулах
2. `DEBUG = False` болгох
3. `SECRET_KEY` аюулгүй болгох
4. `ALLOWED_HOSTS` тохируулах
5. Static files цуглуулах
6. Gunicorn эсвэл uWSGI ашиглах

### Frontend

1. `npm run build` ажиллуулах
2. Build файлуудыг static server дээр байрлуулах
3. Nginx эсвэл Apache ашиглах

### Model API

1. Production environment-д uvicorn ажиллуулах
2. Process manager (PM2, systemd) ашиглах
3. Reverse proxy (Nginx) тохируулах

## 🤝 Хувь нэмэр оруулах

1. Fork хийх
2. Feature branch үүсгэх (`git checkout -b feature/AmazingFeature`)
3. Commit хийх (`git commit -m 'Add some AmazingFeature'`)
4. Push хийх (`git push origin feature/AmazingFeature`)
5. Pull Request нээх

## 📄 Лиценз

Энэ төсөл нь хувийн хэрэглээнд зориулсан.

## 👥 Зохиогчид

- Backend: Django REST API
- Frontend: React TypeScript
- ML Model: FastAPI + scikit-learn

## 📞 Холбоо барих

Асуулт, санал хүсэлт байвал issue нээх эсвэл email илгээх.

---

**Тэмдэглэл**: Энэхүү README нь төслийн ерөнхий мэдээлэл агуулна. Дэлгэрэнгүй мэдээллийг тус бүрийн directory-д байрлах README файлуудаас харна уу.

macOS/Linux:
./start.sh
windows:
start.bat
python:
python start.py
