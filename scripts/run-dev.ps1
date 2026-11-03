# AutoDevAI Single-Command Development Starter
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     AutoDevAI Autonomous Coding Agent — Dev Environment   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

# Start backend in a background process
Write-Host "Starting Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendProc = Start-Process -FilePath "$rootDir\backend\venv\Scripts\python.exe" `
    -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" `
    -WorkingDirectory "$rootDir\backend" `
    -Environment @{ PYTHONPATH = "$rootDir\backend" } `
    -PassThru

# Start frontend in foreground
Write-Host "Starting Frontend on http://localhost:5173..." -ForegroundColor Green
try {
    Set-Location "$rootDir\frontend"
    npm run dev
} finally {
    Write-Host "`nStopping backend process (PID: $($backendProc.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
}

