# How to Add FFmpeg to VidAudio Pro

## Quick Steps

1. **Download FFmpeg**
   - Go to: https://github.com/BtbN/FFmpeg-Builds/releases/latest
   - Download: `ffmpeg-master-latest-win64-gpl.zip`

2. **Extract the ZIP file**
   - Right-click the downloaded ZIP
   - Select "Extract All..."

3. **Find the binaries**
   - Open the extracted folder
   - Navigate to the `bin` subfolder
   - You'll see: `ffmpeg.exe`, `ffprobe.exe`, and `ffplay.exe`

4. **Copy to VidAudio Pro**
   - Copy `ffmpeg.exe` to: `c:\Users\SAIDU\Desktop\VidAudio Pro\resources\`
   - Copy `ffprobe.exe` to: `c:\Users\SAIDU\Desktop\VidAudio Pro\resources\`

5. **Verify**
   Your resources folder should now contain:
   ```
   resources/
   ├── yt-dlp.exe
   ├── ffmpeg.exe  ← NEW
   └── ffprobe.exe ← NEW
   ```

6. **Rebuild the app**
   ```
   npm run electron:build
   ```

## What This Does

- FFmpeg will be automatically bundled with your .exe
- Users won't need to install FFmpeg separately
- Audio extraction will work out of the box
- No more "ffmpeg not found" errors

## File Sizes

- ffmpeg.exe: ~100 MB
- ffprobe.exe: ~100 MB
- Total app size increase: ~200 MB

This is normal for full FFmpeg functionality!
