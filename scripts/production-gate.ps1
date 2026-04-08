param(
    [string]$BaseUrl = "http://localhost",
    [switch]$RunBackupSmokeTest
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $projectRoot
try {
    & powershell -ExecutionPolicy Bypass -File .\scripts\readiness-check.ps1 @(
        if ($RunBackupSmokeTest) { "-RunBackupSmokeTest" }
    )

    & powershell -ExecutionPolicy Bypass -File .\scripts\smoke-check.ps1 -BaseUrl $BaseUrl

    Write-Host ""
    Write-Host "Production gate passed." -ForegroundColor Green
}
finally {
    Pop-Location
}
