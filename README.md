# VidAudio Pro - Desktop Application

![VidAudio Pro](build/icon.png)

A modern, professional desktop application for downloading videos and audio from various websites.

## 🎉 Build Complete!

Your application has been successfully converted to a Windows desktop application (.exe) with:
- ✅ Custom application icon
- ✅ Background download functionality (yt-dlp)
- ✅ NSIS installer
- ✅ Portable executable

## 📦 Distribution Files

The built application files are located in `dist-electron/`:

| File | Size | Description |
|------|------|-------------|
| **VidAudio Pro Setup 1.0.0.exe** | ~106 MB | Windows installer (recommended) |
| **VidAudio Pro 1.0.0.exe** | ~105 MB | Portable executable (no installation) |

## 🚀 Installation Options

### Option 1: Installer (Recommended)
1. Run `VidAudio Pro Setup 1.0.0.exe`
2. Follow the installation wizard
3. Choose installation directory
4. Launch from Start Menu or Desktop shortcut

### Option 2: Portable
1. Run `VidAudio Pro 1.0.0.exe` directly
2. No installation required
3. Can run from USB drive or any folder

## 🎨 Features

- **Modern UI** - Beautiful, responsive interface with dark theme
- **Video Downloads** - Download videos in various qualities and formats
- **Audio Extraction** - Extract audio as MP3 from videos
- **Playlist Support** - Download entire playlists with track selection
- **Background Downloads** - Downloads run in background without blocking UI
- **Real-time Progress** - Live progress updates with speed and ETA
- **Download Management** - Pause, resume, and cancel downloads
- **History Tracking** - Keep track of all your downloads

## 🔧 Technical Details

### Built With
- **Electron** - Desktop application framework
- **React** - UI framework
- **Vite** - Build tool
- **yt-dlp** - Download engine (bundled)

### System Requirements
- Windows 10/11 (64-bit)
- ~200 MB disk space
- Internet connection

## 🛠️ Development

### Build from Source
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run electron:build
```

### Project Structure
```
VidAudio Pro/
├── build/              # Application icon
├── dist/               # Vite build output
├── dist-electron/      # Electron build output
├── resources/          # Bundled resources (yt-dlp.exe)
├── services/           # Download services
│   ├── DownloadService.js
│   └── YtDlpBinary.js
├── components/         # React components
├── pages/              # Application pages
├── electron.js         # Electron main process
├── preload.cjs         # Preload script
└── package.json        # Project configuration
```

## 📝 Configuration

### API Key Setup
On first launch, you'll be prompted to enter your Gemini API key for AI features. This is stored securely in:
```
%APPDATA%/vidaudio-pro/config.json
```

### Download Location
Default download location: `Downloads` folder
You can change this in Settings.

## 🎯 Usage

1. **Launch the application**
2. **Enter a video URL** in the input field
3. **Click "Analyze"** to fetch video information
4. **Select quality/format** from available options
5. **Click "Download"** to start
6. **Monitor progress** in the Downloads section

## 🔄 Rebuilding

To rebuild the application after making changes:

```bash
# Rebuild Vite frontend
npm run build

# Rebuild Electron app
npm run electron:build
```

## 📄 License

Private project - All rights reserved

## 🤝 Support

For issues or questions, please check the application logs in:
```
%APPDATA%/vidaudio-pro/logs/
```

---

**Enjoy VidAudio Pro!** 🎵🎬
