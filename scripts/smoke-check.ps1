param(
    [string]$BaseUrl = "http://localhost"
)

$ErrorActionPreference = "Stop"

function Assert-Endpoint {
    param(
        [string]$Url,
        [string]$Name
    )

    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw "$Name failed with status code $($response.StatusCode)"
    }

    Write-Host "[PASS] $Name => $Url"
}

Assert-Endpoint -Url "$BaseUrl/" -Name "Frontend root"
Assert-Endpoint -Url "$BaseUrl/api" -Name "API root"
Assert-Endpoint -Url "$BaseUrl/api/health" -Name "API health"
Assert-Endpoint -Url "$BaseUrl/api/v1" -Name "API v1 root"
Assert-Endpoint -Url "$BaseUrl/api/v1/health" -Name "API v1 health"
