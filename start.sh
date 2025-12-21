#!/bin/bash

# Tosol - All Services Startup Script
# This script starts backend, frontend, and model services

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tosol - Starting All Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    exit
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Start Backend (Django)
echo -e "${GREEN}[1/3] Starting Backend (Django) on port 8000...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Warning: Virtual environment not found. Creating one...${NC}"
    python3 -m venv venv
fi
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
python manage.py runserver > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
sleep 2

# Start Model API (FastAPI)
echo -e "${GREEN}[2/3] Starting Model API (FastAPI) on port 8001...${NC}"
cd model
# Use the same Python environment or create a new one
if [ -d "../backend/venv" ]; then
    source ../backend/venv/bin/activate 2>/dev/null || source ../backend/venv/Scripts/activate 2>/dev/null || true
fi
uvicorn api_server:app --host 0.0.0.0 --port 8001 > ../logs/model.log 2>&1 &
MODEL_PID=$!
cd ..
echo -e "${GREEN}Model API started (PID: $MODEL_PID)${NC}"
sleep 2

# Start Frontend (React)
echo -e "${GREEN}[3/3] Starting Frontend (React) on port 8080...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3

# Create logs directory if it doesn't exist
mkdir -p logs

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "Frontend: ${GREEN}http://localhost:8080${NC}"
echo -e "Model API: ${GREEN}http://localhost:8001${NC}"
echo ""
echo -e "${YELLOW}Logs are saved in the 'logs' directory${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background jobs
wait

