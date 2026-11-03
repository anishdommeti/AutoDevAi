# Start AutoDevAI FastAPI Backend Server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting AutoDevAI Backend (FastAPI)  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location $rootDir

if (-not (Test-Path "$rootDir\backend\venv\Scripts\python.exe")) {
    Write-Host "Error: Virtual environment not found in backend\venv." -ForegroundColor Red
    Write-Host "Please run: python -m venv backend\venv; .\backend\venv\Scripts\pip install -r backend\requirements.txt"
    exit 1
}

$env:PYTHONPATH = "$rootDir\backend"
& "$rootDir\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

