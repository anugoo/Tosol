@echo off
REM Tosol - All Services Startup Script (Windows)
REM This script starts backend, frontend, and model services

setlocal enabledelayedexpansion

echo ========================================
echo   Tosol - Starting All Services
echo ========================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Create logs directory
if not exist "logs" mkdir logs

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

REM Start Backend (Django)
echo [1/3] Starting Backend (Django) on port 8000...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
start "Django Backend" cmd /c "python manage.py runserver > ..\logs\backend.log 2>&1"
cd ..
timeout /t 2 /nobreak >nul
echo Backend started
echo.

REM Start Model API (FastAPI)
echo [2/3] Starting Model API (FastAPI) on port 8001...
cd model
call ..\backend\venv\Scripts\activate.bat
start "Model API" cmd /c "uvicorn api_server:app --host 0.0.0.0 --port 8001 > ..\logs\model.log 2>&1"
cd ..
timeout /t 2 /nobreak >nul
echo Model API started
echo.

REM Start Frontend (React)
echo [3/3] Starting Frontend (React) on port 8080...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
start "React Frontend" cmd /c "npm run dev > ..\logs\frontend.log 2>&1"
cd ..
timeout /t 3 /nobreak >nul
echo Frontend started
echo.

echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:8080
echo Model API: http://localhost:8001
echo.
echo Logs are saved in the 'logs' directory
echo Close the command windows to stop services
echo.
pause

