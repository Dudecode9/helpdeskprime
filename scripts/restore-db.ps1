param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $projectRoot ".env"

if (-not (Test-Path $envFile)) {
    throw ".env file not found at $envFile"
}

$resolvedBackupFile = Resolve-Path $BackupFile

$envValues = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
        return
    }

    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
        $envValues[$parts[0].Trim()] = $parts[1].Trim()
    }
}

$dbUser = $envValues["POSTGRES_USER"]
$dbName = $envValues["POSTGRES_DB"]

if (-not $dbUser -or -not $dbName) {
    throw "POSTGRES_USER and POSTGRES_DB must be set in .env"
}

Push-Location $projectRoot
try {
    Get-Content $resolvedBackupFile | docker compose exec -T postgres psql -U $dbUser -d $dbName
    Write-Host "Restore completed from: $resolvedBackupFile"
}
finally {
    Pop-Location
}
