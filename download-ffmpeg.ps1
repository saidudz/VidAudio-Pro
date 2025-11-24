# FFmpeg Auto-Download Script for VidAudio Pro
# Downloads FFmpeg binaries directly from GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VidAudio Pro - FFmpeg Auto-Download" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$resourcesPath = "resources"
$ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
$zipPath = "$resourcesPath\ffmpeg.zip"
$extractPath = "$resourcesPath\ffmpeg_temp"

# Ensure resources folder exists
if (-not (Test-Path $resourcesPath)) {
    Write-Host "Creating resources folder..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $resourcesPath | Out-Null
}

# Check if FFmpeg already exists
if ((Test-Path "$resourcesPath\ffmpeg.exe") -and (Test-Path "$resourcesPath\ffprobe.exe")) {
    Write-Host "FFmpeg binaries already exist!" -ForegroundColor Green
    Write-Host "  - ffmpeg.exe: $((Get-Item "$resourcesPath\ffmpeg.exe").Length / 1MB) MB" -ForegroundColor Gray
    Write-Host "  - ffprobe.exe: $((Get-Item "$resourcesPath\ffprobe.exe").Length / 1MB) MB" -ForegroundColor Gray
    Write-Host ""
    $response = Read-Host "Re-download? (y/n)"
    if ($response -ne "y") {
        Write-Host "Skipping download." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "[1/4] Downloading FFmpeg (~140 MB)..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

try {
    # Use WebClient for better progress tracking
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($ffmpegUrl, $zipPath)
    Write-Host "Download complete!" -ForegroundColor Green
}
catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Extracting archive..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
    Write-Host "Extraction complete!" -ForegroundColor Green
}
catch {
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "[3/4] Copying binaries..." -ForegroundColor Yellow
try {
    $binFolder = Get-ChildItem -Path $extractPath -Recurse -Directory -Filter "bin" | Select-Object -First 1
    
    if ($binFolder) {
        Copy-Item "$($binFolder.FullName)\ffmpeg.exe" "$resourcesPath\ffmpeg.exe" -Force
        Copy-Item "$($binFolder.FullName)\ffprobe.exe" "$resourcesPath\ffprobe.exe" -Force
        
        $ffmpegSize = (Get-Item "$resourcesPath\ffmpeg.exe").Length / 1MB
        $ffprobeSize = (Get-Item "$resourcesPath\ffprobe.exe").Length / 1MB
        
        Write-Host "Binaries copied successfully!" -ForegroundColor Green
        Write-Host "  - ffmpeg.exe: $([math]::Round($ffmpegSize, 1)) MB" -ForegroundColor Gray
        Write-Host "  - ffprobe.exe: $([math]::Round($ffprobeSize, 1)) MB" -ForegroundColor Gray
    }
    else {
        Write-Host "Could not find bin folder" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "Copy failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] Cleaning up..." -ForegroundColor Yellow
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleanup complete!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "FFmpeg Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Build the application: npm run electron:build" -ForegroundColor White
Write-Host "  2. FFmpeg will be bundled automatically" -ForegroundColor White
Write-Host ""
