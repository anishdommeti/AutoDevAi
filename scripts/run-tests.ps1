# Run AutoDevAI Full Test Suite (Backend & Frontend)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     AutoDevAI Test Suite Execution     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location $rootDir

Write-Host "`n[1/2] Running Backend Unit & Integration Tests..." -ForegroundColor Yellow
$env:PYTHONPATH = "$rootDir\backend"
& "$rootDir\backend\venv\Scripts\pytest.exe" "$rootDir\backend\tests" -v
$backendExit = $LASTEXITCODE

Write-Host "`n[2/2] Running Frontend Unit & Component Tests..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend"
npm test
$frontendExit = $LASTEXITCODE

Set-Location $rootDir

Write-Host "`n========================================" -ForegroundColor Cyan
if ($backendExit -eq 0 -and $frontendExit -eq 0) {
    Write-Host "  ALL TESTS PASSED SUCCESSFULLY! (100%) " -ForegroundColor Green
} else {
    Write-Host "  TEST FAILURES DETECTED!               " -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan

exit ($backendExit + $frontendExit)

