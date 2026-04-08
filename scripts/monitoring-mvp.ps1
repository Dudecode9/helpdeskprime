param(
    [string]$BaseUrl = "http://localhost",
    [string]$OutputDir = "ops/monitoring"
)

$ErrorActionPreference = "Stop"

function Load-EnvFile {
    param([string]$Path)

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

function Append-MonitorEvent {
    param(
        [string]$Status,
        [string]$Message,
        [hashtable]$Metadata
    )

    $entry = @{
        timestamp = (Get-Date).ToString("o")
        status = $Status
        message = $Message
        metadata = $Metadata
    } | ConvertTo-Json -Compress

    Add-Content -Path $script:MonitorLogFile -Value $entry
}

function Assert-HttpOk {
    param(
        [string]$Url,
        [string]$Name
    )

    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw "$Name failed with status code $($response.StatusCode)"
    }
}

function Assert-ContainerHealthy {
    param([string]$ContainerName)

    $health = docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $ContainerName 2>$null
    if ($LASTEXITCODE -ne 0) {
      throw "Container '$ContainerName' not found"
    }

    $trimmed = $health.Trim()
    if ($trimmed -notin @("healthy", "none")) {
      throw "Container '$ContainerName' health is '$trimmed'"
    }

    return $trimmed
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envValues = Load-EnvFile -Path (Join-Path $projectRoot ".env")
$resolvedOutputDir = Join-Path $projectRoot $OutputDir

if (-not (Test-Path $resolvedOutputDir)) {
    New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null
}

$script:MonitorLogFile = Join-Path $resolvedOutputDir "monitoring.log"

try {
    Assert-HttpOk -Url "$BaseUrl/" -Name "Frontend root"
    Assert-HttpOk -Url "$BaseUrl/api/health" -Name "API health"

    $dbHealth = Assert-ContainerHealthy -ContainerName "helpdesk_db"
    $backendHealth = Assert-ContainerHealthy -ContainerName "helpdesk_backend"
    $frontendHealth = Assert-ContainerHealthy -ContainerName "helpdesk_frontend"

    Append-MonitorEvent -Status "ok" -Message "Monitoring check passed" -Metadata @{
        baseUrl = $BaseUrl
        port = $envValues["PORT"]
        containers = @{
            helpdesk_db = $dbHealth
            helpdesk_backend = $backendHealth
            helpdesk_frontend = $frontendHealth
        }
    }

    Write-Host "[PASS] Monitoring check passed"
}
catch {
    Append-MonitorEvent -Status "failed" -Message "Monitoring check failed" -Metadata @{
        baseUrl = $BaseUrl
        error = $_.Exception.Message
    }

    Write-Error $_.Exception.Message
    exit 1
}
