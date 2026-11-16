$ErrorActionPreference = 'Stop'
$target = Join-Path $PSScriptRoot 'bin'
$configPath = Join-Path $PSScriptRoot 'runtime-config.json'
if (Test-Path -LiteralPath $configPath) {
    $localConfig = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ($localConfig.binDir) { $target = $localConfig.binDir }
}
[System.IO.Directory]::CreateDirectory($target) | Out-Null
$ProgressPreference = 'SilentlyContinue'
Write-Host 'Dang tai yt-dlp tu GitHub chinh thuc...'
Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile (Join-Path $target 'yt-dlp.exe') -UseBasicParsing
Write-Host 'Dang tai FFmpeg Windows (yt-dlp/FFmpeg-Builds)...'
$archive = Join-Path $target 'ffmpeg-download.zip'
Invoke-WebRequest -Uri 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile $archive -UseBasicParsing
$unpack = Join-Path $target ('ffmpeg-unpack-' + [Guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $archive -DestinationPath $unpack
foreach ($name in @('ffmpeg.exe','ffprobe.exe')) {
    $source = Get-ChildItem -LiteralPath $unpack -Recurse -Filter $name | Select-Object -First 1
    if (-not $source) { throw "Thieu $name trong goi tai ve." }
    Copy-Item -LiteralPath $source.FullName -Destination (Join-Path $target $name) -Force
}
Write-Host 'Da cai bo xu ly. Hay mo Mo BTV Studio.cmd.'
