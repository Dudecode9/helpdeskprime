param(
    [string]$OutputDir = "db/backups"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $projectRoot ".env"

if (-not (Test-Path $envFile)) {
    throw ".env file not found at $envFile"
}

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

$backupDirPath = Join-Path $projectRoot $OutputDir
if (-not (Test-Path $backupDirPath)) {
    New-Item -ItemType Directory -Path $backupDirPath | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = Join-Path $backupDirPath ("helpdesk_backup_{0}.sql" -f $timestamp)

$dbUser = $envValues["POSTGRES_USER"]
$dbName = $envValues["POSTGRES_DB"]

if (-not $dbUser -or -not $dbName) {
    throw "POSTGRES_USER and POSTGRES_DB must be set in .env"
}

Push-Location $projectRoot
try {
    $command = "docker compose exec -T postgres pg_dump -U $dbUser -d $dbName --clean --if-exists"
    Invoke-Expression $command | Set-Content -Path $backupFile
    Write-Host "Backup created: $backupFile"
}
finally {
    Pop-Location
}
