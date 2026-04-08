param(
    [string]$CertDir = ".\infra\certs"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedCertDir = Join-Path $projectRoot $CertDir
$fullchainPath = Join-Path $resolvedCertDir "fullchain.pem"
$privkeyPath = Join-Path $resolvedCertDir "privkey.pem"

if (-not (Test-Path $fullchainPath)) {
    throw "Certificate file not found: $fullchainPath"
}

if (-not (Test-Path $privkeyPath)) {
    throw "Private key file not found: $privkeyPath"
}

Write-Host "[PASS] TLS certificate files found."
Write-Host " - $fullchainPath"
Write-Host " - $privkeyPath"
