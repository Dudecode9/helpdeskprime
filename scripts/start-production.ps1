param(
    [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $projectRoot

try {
    if (-not $SkipChecks) {
        & powershell -ExecutionPolicy Bypass -File .\scripts\check-production-certs.ps1
        & powershell -ExecutionPolicy Bypass -File .\scripts\readiness-check.ps1
    }

    docker compose -f docker-compose.yml -f docker-compose.production.yml up --build -d
}
finally {
    Pop-Location
}
