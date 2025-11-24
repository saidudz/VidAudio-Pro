# FFmpeg Setup Instructions

## Download FFmpeg Binaries

To bundle FFmpeg with VidAudio Pro, you need to download the FFmpeg binaries and place them in the resources folder.

### Step 1: Download FFmpeg

1. Go to [https://github.com/BtbN/FFmpeg-Builds/releases](https://github.com/BtbN/FFmpeg-Builds/releases)
2. Download the **latest** release for Windows:
   - Look for: `ffmpeg-master-latest-win64-gpl.zip` (or similar)
   - This is the essentials build for Windows 64-bit

### Step 2: Extract the Files

1. Extract the downloaded ZIP file
2. Navigate to the `bin` folder inside the extracted directory
3. You'll find three files:
   - `ffmpeg.exe` (~100 MB)
   - `ffprobe.exe` (~100 MB)
   - `ffplay.exe` (optional, not needed)

### Step 3: Copy to Resources Folder

Copy the following files to the `resources` folder in your project:
```
c:/Users/SAIDU/Desktop/VidAudio Pro/resources/
├── yt-dlp.exe (already present)
├── ffmpeg.exe (add this)
└── ffprobe.exe (add this)
```

### Step 4: Verify Setup

After copying the files, your resources folder should contain:
- yt-dlp.exe
- ffmpeg.exe  
- ffprobe.exe

### Step 5: Rebuild the Application

Run the build command:
```powershell
npm run electron:build
```

The FFmpeg binaries will now be automatically bundled with your application!

---

## Alternative: Automated Download

If you prefer, you can download FFmpeg automatically using PowerShell:

```powershell
# Run this in PowerShell from the project root
$resourcesPath = "resources"
$ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
$zipPath = "$resourcesPath\ffmpeg.zip"
$extractPath = "$resourcesPath\ffmpeg_temp"

# Download
Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipPath

# Extract
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

# Copy binaries
Copy-Item "$extractPath\ffmpeg-*\bin\ffmpeg.exe" "$resourcesPath\ffmpeg.exe"
Copy-Item "$extractPath\ffmpeg-*\bin\ffprobe.exe" "$resourcesPath\ffprobe.exe"

# Cleanup
Remove-Item $zipPath
Remove-Item $extractPath -Recurse

Write-Host "FFmpeg binaries installed successfully!"
```

---

## File Sizes

Note: FFmpeg binaries will add approximately **~200 MB** to your application's total size:
- ffmpeg.exe: ~100 MB
- ffprobe.exe: ~100 MB

This is normal and expected for full FFmpeg functionality.
