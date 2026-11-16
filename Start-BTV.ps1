param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$nodePath = Join-Path $projectRoot 'bin\node.exe'
if (-not (Test-Path -LiteralPath $nodePath)) { $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (-not $nodePath) { throw 'Can cai Node.js 22 tro len. Xem HUONG_DAN.md.' }
$configPath = Join-Path $projectRoot 'runtime-config.json'
$dataPath = Join-Path $env:USERPROFILE 'BTV Credit Studio'
if (Test-Path -LiteralPath $configPath) {
    $localConfig = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ($localConfig.dataDir) { $dataPath = $localConfig.dataDir }
}
if ($env:BTV_DATA) { $dataPath = $env:BTV_DATA }
[System.IO.Directory]::CreateDirectory($dataPath) | Out-Null
$port = if ($env:BTV_PORT) { $env:BTV_PORT } else { '43189' }
$address = 'http://127.0.0.1:' + $port
$alreadyRunning = $false
try {
    $page = Invoke-WebRequest -Uri $address -UseBasicParsing -TimeoutSec 2
    $alreadyRunning = $page.Content.Contains('BTV') -and $page.Content.Contains('btv-token')
} catch {}
if (-not $alreadyRunning) {
    $scriptPath = Join-Path $projectRoot 'app\server.mjs'
    Start-Process -FilePath $nodePath -ArgumentList @('"' + $scriptPath + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $dataPath 'server.log') -RedirectStandardError (Join-Path $dataPath 'server-error.log') | Out-Null
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 250
        try { $page = Invoke-WebRequest -Uri $address -UseBasicParsing -TimeoutSec 1; if ($page.Content.Contains('btv-token')) { $alreadyRunning = $true; break } } catch {}
    }
}
if (-not $alreadyRunning) { throw "Khong khoi dong duoc tool. Kiem tra $dataPath\server-error.log" }
if (-not $NoBrowser) { Start-Process $address }
