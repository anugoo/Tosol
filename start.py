#!/usr/bin/env python3
"""
Tosol - All Services Startup Script (Cross-platform)
This script starts backend, frontend, and model services
"""

import os
import sys
import subprocess
import signal
import time
import platform
from pathlib import Path

# Colors for output (ANSI codes)
GREEN = '\033[0;32m'
BLUE = '\033[0;34m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'  # No Color

# Get the directory where the script is located
SCRIPT_DIR = Path(__file__).parent.absolute()
os.chdir(SCRIPT_DIR)

# Store process IDs
processes = []

def cleanup(signum=None, frame=None):
    """Cleanup function to stop all processes"""
    print(f"\n{YELLOW}Stopping all services...{NC}")
    for proc in processes:
        try:
            if platform.system() == "Windows":
                proc.terminate()
            else:
                proc.send_signal(signal.SIGTERM)
            proc.wait(timeout=5)
        except:
            try:
                proc.kill()
            except:
                pass
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def check_command(cmd, name):
    """Check if a command is available"""
    try:
        subprocess.run([cmd, "--version"], 
                      capture_output=True, 
                      check=True, 
                      timeout=5)
        return True
    except:
        print(f"{RED}Error: {name} is not installed or not in PATH{NC}")
        return False

def find_python():
    """Find Python executable"""
    for cmd in ["python3", "python"]:
        try:
            result = subprocess.run([cmd, "--version"], 
                                   capture_output=True, 
                                   check=True, 
                                   timeout=5)
            return cmd
        except:
            continue
    return None

def find_node():
    """Find Node.js executable"""
    for cmd in ["node"]:
        try:
            result = subprocess.run([cmd, "--version"], 
                                   capture_output=True, 
                                   check=True, 
                                   timeout=5)
            return cmd
        except:
            continue
    return None

def get_venv_python(venv_path):
    """Get Python executable from virtual environment"""
    if platform.system() == "Windows":
        python_exe = venv_path / "Scripts" / "python.exe"
    else:
        python_exe = venv_path / "bin" / "python"
    
    if python_exe.exists():
        return str(python_exe)
    return None

print(f"{BLUE}========================================{NC}")
print(f"{BLUE}  Tosol - Starting All Services{NC}")
print(f"{BLUE}========================================{NC}")
print("")

# Check prerequisites
python_cmd = find_python()
if not python_cmd:
    print(f"{RED}Error: Python is not installed{NC}")
    sys.exit(1)

node_cmd = find_node()
if not node_cmd:
    print(f"{RED}Error: Node.js is not installed{NC}")
    sys.exit(1)

# Create logs directory
logs_dir = SCRIPT_DIR / "logs"
logs_dir.mkdir(exist_ok=True)

# Start Backend (Django)
print(f"{GREEN}[1/3] Starting Backend (Django) on port 8000...{NC}")
backend_dir = SCRIPT_DIR / "backend"
venv_dir = backend_dir / "venv"

# Check/create virtual environment
if not venv_dir.exists():
    print(f"{YELLOW}Creating virtual environment...{NC}")
    subprocess.run([python_cmd, "-m", "venv", str(venv_dir)], check=True)

# Get Python from venv
venv_python = get_venv_python(venv_dir)
if venv_python:
    python_cmd = venv_python

# Start Django server
backend_log = logs_dir / "backend.log"
with open(backend_log, "w") as f:
    proc = subprocess.Popen(
        [python_cmd, "manage.py", "runserver"],
        cwd=str(backend_dir),
        stdout=f,
        stderr=subprocess.STDOUT
    )
    processes.append(proc)
    print(f"{GREEN}Backend started (PID: {proc.pid}){NC}")

time.sleep(2)

# Start Model API (FastAPI)
print(f"{GREEN}[2/3] Starting Model API (FastAPI) on port 8001...{NC}")
model_dir = SCRIPT_DIR / "model"

# Use uvicorn to start FastAPI
model_log = logs_dir / "model.log"
with open(model_log, "w") as f:
    # Try to use uvicorn from venv, otherwise use system
    uvicorn_cmd = None
    if venv_python:
        venv_uvicorn = venv_dir / ("Scripts" if platform.system() == "Windows" else "bin") / "uvicorn"
        if venv_uvicorn.exists():
            uvicorn_cmd = str(venv_uvicorn)
    
    if not uvicorn_cmd:
        uvicorn_cmd = "uvicorn"
    
    proc = subprocess.Popen(
        [uvicorn_cmd, "api_server:app", "--host", "0.0.0.0", "--port", "8001"],
        cwd=str(model_dir),
        stdout=f,
        stderr=subprocess.STDOUT
    )
    processes.append(proc)
    print(f"{GREEN}Model API started (PID: {proc.pid}){NC}")

time.sleep(2)

# Start Frontend (React)
print(f"{GREEN}[3/3] Starting Frontend (React) on port 8080...{NC}")
frontend_dir = SCRIPT_DIR / "frontend"

# Check if node_modules exists
if not (frontend_dir / "node_modules").exists():
    print(f"{YELLOW}Installing frontend dependencies...{NC}")
    subprocess.run([node_cmd.replace("node", "npm"), "install"], 
                  cwd=str(frontend_dir), 
                  check=True)

frontend_log = logs_dir / "frontend.log"
with open(frontend_log, "w") as f:
    proc = subprocess.Popen(
        [node_cmd.replace("node", "npm"), "run", "dev"],
        cwd=str(frontend_dir),
        stdout=f,
        stderr=subprocess.STDOUT
    )
    processes.append(proc)
    print(f"{GREEN}Frontend started (PID: {proc.pid}){NC}")

time.sleep(3)

print("")
print(f"{BLUE}========================================{NC}")
print(f"{GREEN}All services started successfully!{NC}")
print(f"{BLUE}========================================{NC}")
print("")
print(f"Backend:  {GREEN}http://localhost:8000{NC}")
print(f"Frontend: {GREEN}http://localhost:8080{NC}")
print(f"Model API: {GREEN}http://localhost:8001{NC}")
print("")
print(f"{YELLOW}Logs are saved in the 'logs' directory{NC}")
print(f"{YELLOW}Press Ctrl+C to stop all services{NC}")
print("")

# Wait for all processes
try:
    for proc in processes:
        proc.wait()
except KeyboardInterrupt:
    cleanup()

