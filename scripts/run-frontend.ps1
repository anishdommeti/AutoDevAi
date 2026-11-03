# Start AutoDevAI React Frontend Server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting AutoDevAI Frontend (Vite)   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location "$rootDir\frontend"

npm run dev

