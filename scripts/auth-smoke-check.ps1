param(
    [string]$BaseUrl = "http://localhost",
    [string]$AdminEmail = "admin@gmail.com",
    [string]$AdminPassword = "Admin123!",
    [string]$DirectorEmail = "director@gmail.com",
    [string]$DirectorPassword = "Director123!"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
    param(
        [string]$Method,
        [string]$Url,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session,
        [object]$Body = $null
    )

    $params = @{
        Method = $Method
        Uri = $Url
        WebSession = $Session
        ContentType = "application/json"
        UseBasicParsing = $true
        TimeoutSec = 15
    }

    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Compress)
    }

    $response = Invoke-WebRequest @params
    return $response.Content | ConvertFrom-Json
}

function Assert-RoleFlow {
    param(
        [string]$RoleName,
        [string]$LoginPath,
        [string]$ExpectedRole,
        [string]$Email,
        [string]$Password
    )

    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    Invoke-JsonRequest -Method "POST" -Url "$BaseUrl$LoginPath" -Session $session -Body @{
        email = $Email
        password = $Password
    } | Out-Null
    Write-Host "[PASS] $RoleName login"

    $me = Invoke-JsonRequest -Method "GET" -Url "$BaseUrl/api/auth/me" -Session $session
    if (-not $me.user -or $me.user.role -ne $ExpectedRole) {
        throw "$RoleName session returned unexpected role"
    }
    Write-Host "[PASS] $RoleName /api/auth/me"

    Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/auth/logout" -Session $session -Body @{} | Out-Null
    Write-Host "[PASS] $RoleName logout"
}

Assert-RoleFlow -RoleName "Admin" -LoginPath "/api/auth/login/admin" -ExpectedRole "admin" -Email $AdminEmail -Password $AdminPassword
Assert-RoleFlow -RoleName "Director" -LoginPath "/api/auth/login/director" -ExpectedRole "director" -Email $DirectorEmail -Password $DirectorPassword
