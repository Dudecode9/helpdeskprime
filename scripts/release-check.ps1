param(
    [string]$BaseUrl = "http://localhost",
    [switch]$SkipBuild,
    [switch]$RunBackupSmokeTest
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $projectRoot
try {
    if (-not $SkipBuild) {
        Push-Location ".\frontend"
        try {
            npm run build
        }
        finally {
            Pop-Location
        }

        Push-Location ".\backend"
        try {
            node --check .\server.js
        }
        finally {
            Pop-Location
        }
    }

    & powershell -ExecutionPolicy Bypass -File .\scripts\production-gate.ps1 -BaseUrl $BaseUrl @(
        if ($RunBackupSmokeTest) { "-RunBackupSmokeTest" }
    )

    & powershell -ExecutionPolicy Bypass -File .\scripts\auth-smoke-check.ps1 -BaseUrl $BaseUrl

    Write-Host ""
    Write-Host "Release check passed." -ForegroundColor Green
}
finally {
    Pop-Location
}
