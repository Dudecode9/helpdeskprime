param(
    [string]$CertDir = "",
    [string]$EnvFile = ".\.env.production"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedCertDir = $null

if ([string]::IsNullOrWhiteSpace($CertDir) -and (Test-Path (Join-Path $projectRoot $EnvFile))) {
    $tlsSourceLine = Get-Content (Join-Path $projectRoot $EnvFile) |
        Where-Object { $_ -match '^TLS_SOURCE_DIR=' } |
        Select-Object -First 1

    if ($tlsSourceLine) {
        $CertDir = ($tlsSourceLine -split '=', 2)[1].Trim()
    }
}

if ([string]::IsNullOrWhiteSpace($CertDir)) {
    $CertDir = ".\infra\certs"
}

if ([System.IO.Path]::IsPathRooted($CertDir)) {
    $resolvedCertDir = $CertDir
}
else {
    $resolvedCertDir = Join-Path $projectRoot $CertDir
}

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
