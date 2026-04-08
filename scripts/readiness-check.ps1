param(
    [switch]$RunBackupSmokeTest
)

$ErrorActionPreference = "Stop"

function Write-Check {
    param(
        [string]$Status,
        [string]$Message
    )

    $color = switch ($Status) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
        default { "White" }
    }

    Write-Host ("[{0}] {1}" -f $Status, $Message) -ForegroundColor $color
}

function Load-EnvFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw ".env file not found at $Path"
    }

    $values = @{}
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
            return
        }

        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $values[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $values
}

function Require-DockerContainer {
    param([string]$ContainerName)

    $running = docker inspect -f "{{.State.Running}}" $ContainerName 2>$null
    if ($LASTEXITCODE -ne 0 -or $running.Trim() -ne "true") {
        throw "Container '$ContainerName' is not running"
    }

    $health = docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $ContainerName 2>$null
    return $health.Trim()
}

function Run-ScalarQuery {
    param(
        [string]$DbUser,
        [string]$DbName,
        [string]$Sql
    )

    $command = "docker compose exec -T postgres psql -U $DbUser -d $DbName -t -A -c ""$Sql"""
    $result = Invoke-Expression $command
    if ($LASTEXITCODE -ne 0) {
        throw "SQL command failed: $Sql"
    }

    return ($result | Out-String).Trim()
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envValues = Load-EnvFile -Path (Join-Path $projectRoot ".env")

$requiredTables = @(
    "admins",
    "directordev",
    "tickets",
    "completed_tickets",
    "refresh_tokens",
    "audit_logs",
    "user_sessions"
)

$requiredIndexes = @(
    "idx_tickets_email",
    "idx_tickets_created_at",
    "idx_tickets_status",
    "idx_completed_tickets_email",
    "idx_completed_tickets_completed_at",
    "idx_completed_tickets_admin_email",
    "idx_audit_logs_created_at",
    "idx_audit_logs_actor_email",
    "idx_audit_logs_event_type",
    "idx_audit_logs_status",
    "idx_user_sessions_last_seen_at"
)

$failures = New-Object System.Collections.Generic.List[string]

Push-Location $projectRoot
try {
    try {
        $dbHealth = Require-DockerContainer -ContainerName "helpdesk_db"
        Write-Check -Status "PASS" -Message "Container helpdesk_db is running (health: $dbHealth)"
        if ($dbHealth -ne "healthy") {
            $failures.Add("helpdesk_db health is '$dbHealth'")
        }
    }
    catch {
        $failures.Add($_.Exception.Message)
        Write-Check -Status "FAIL" -Message $_.Exception.Message
    }

    try {
        $backendHealth = Require-DockerContainer -ContainerName "helpdesk_backend"
        Write-Check -Status "PASS" -Message "Container helpdesk_backend is running (health: $backendHealth)"
        if ($backendHealth -ne "healthy") {
            $failures.Add("helpdesk_backend health is '$backendHealth'")
        }
    }
    catch {
        $failures.Add($_.Exception.Message)
        Write-Check -Status "FAIL" -Message $_.Exception.Message
    }

    try {
        $frontendHealth = Require-DockerContainer -ContainerName "helpdesk_frontend"
        Write-Check -Status "PASS" -Message "Container helpdesk_frontend is running (health: $frontendHealth)"
    }
    catch {
        $failures.Add($_.Exception.Message)
        Write-Check -Status "FAIL" -Message $_.Exception.Message
    }

    try {
        $healthUrl = "http://localhost:{0}/api/health" -f $envValues["PORT"]
        $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
        if ($healthResponse.status -ne "ok") {
            throw "Health endpoint returned unexpected payload"
        }

        Write-Check -Status "PASS" -Message "Health endpoint responded successfully: $healthUrl"
    }
    catch {
        $failures.Add("Health endpoint check failed: $($_.Exception.Message)")
        Write-Check -Status "FAIL" -Message "Health endpoint check failed"
    }

    foreach ($table in $requiredTables) {
        try {
            $result = Run-ScalarQuery -DbUser $envValues["POSTGRES_USER"] -DbName $envValues["POSTGRES_DB"] -Sql "SELECT to_regclass('public.$table');"
            if ($result -ne $table) {
                throw "Table '$table' is missing"
            }

            Write-Check -Status "PASS" -Message "Table '$table' exists"
        }
        catch {
            $failures.Add($_.Exception.Message)
            Write-Check -Status "FAIL" -Message $_.Exception.Message
        }
    }

    foreach ($index in $requiredIndexes) {
        try {
            $result = Run-ScalarQuery -DbUser $envValues["POSTGRES_USER"] -DbName $envValues["POSTGRES_DB"] -Sql "SELECT to_regclass('public.$index');"
            if ($result -ne $index) {
                throw "Index '$index' is missing"
            }

            Write-Check -Status "PASS" -Message "Index '$index' exists"
        }
        catch {
            $failures.Add($_.Exception.Message)
            Write-Check -Status "FAIL" -Message $_.Exception.Message
        }
    }

    $backupScript = Join-Path $projectRoot "scripts\backup-db.ps1"
    $restoreScript = Join-Path $projectRoot "scripts\restore-db.ps1"
    $backupDir = Join-Path $projectRoot "db\backups"

    if (Test-Path $backupScript) {
        Write-Check -Status "PASS" -Message "Backup script exists"
    } else {
        $failures.Add("Backup script is missing")
        Write-Check -Status "FAIL" -Message "Backup script is missing"
    }

    if (Test-Path $restoreScript) {
        Write-Check -Status "PASS" -Message "Restore script exists"
    } else {
        $failures.Add("Restore script is missing")
        Write-Check -Status "FAIL" -Message "Restore script is missing"
    }

    if (Test-Path $backupDir) {
        Write-Check -Status "PASS" -Message "Backup directory exists"
    } else {
        $failures.Add("Backup directory is missing")
        Write-Check -Status "FAIL" -Message "Backup directory is missing"
    }

    if ($RunBackupSmokeTest) {
        try {
            & powershell -ExecutionPolicy Bypass -File $backupScript
            Write-Check -Status "PASS" -Message "Backup smoke test completed"
        }
        catch {
            $failures.Add("Backup smoke test failed: $($_.Exception.Message)")
            Write-Check -Status "FAIL" -Message "Backup smoke test failed"
        }
    } else {
        Write-Check -Status "WARN" -Message "Backup smoke test skipped. Re-run with -RunBackupSmokeTest to execute it."
    }

    if ($failures.Count -gt 0) {
        Write-Host ""
        Write-Host "Readiness gate failed:" -ForegroundColor Red
        $failures | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
        exit 1
    }

    Write-Host ""
    Write-Host "Readiness gate passed." -ForegroundColor Green
}
finally {
    Pop-Location
}
