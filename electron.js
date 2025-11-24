import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DownloadService } from './services/DownloadService.js';
import { YtDlpBinary } from './services/YtDlpBinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store for the API key
let apiKey = null;
const configPath = path.join(app.getPath('userData'), 'config.json');

// Initialize download service
const downloadService = new DownloadService();
let mainWindow = null;

// Load API key from config file if exists
function loadApiKey() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(data);
            apiKey = config.GEMINI_API_KEY || null;
        }
    } catch (error) {
        console.error('Error loading API key:', error);
    }
}

// Save API key to config file
function saveApiKey(key) {
    try {
        const config = { GEMINI_API_KEY: key };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        apiKey = key;
    } catch (error) {
        console.error('Error saving API key:', error);
    }
}
function createWindow() {
    // Load saved API key
    loadApiKey();

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        icon: path.join(__dirname, 'build', 'icon.ico'),
        title: 'VidAudio Pro',
        autoHideMenuBar: true,
        backgroundColor: '#0f172a'
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            import('electron').then(({ shell }) => shell.openExternal(url));
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Existing IPC handlers
    ipcMain.handle('get-api-key', async () => apiKey);
    ipcMain.handle('set-api-key', async (event, key) => {
        saveApiKey(key);
        return { success: true };
    });
    ipcMain.handle('has-api-key', async () => !!apiKey);
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    // Download IPC handlers
    ipcMain.handle('fetch-video-info', async (event, url) => {
        try {
            console.log('[IPC] Fetching video info for:', url);
            const info = await downloadService.fetchVideoInfo(url);
            return { success: true, data: info };
        } catch (error) {
            console.error('[IPC] Error fetching video info:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('fetch-playlist-info', async (event, url) => {
        try {
            console.log('[IPC] Fetching playlist info for:', url);
            const info = await downloadService.fetchPlaylistInfo(url);
            return { success: true, data: info };
        } catch (error) {
            console.error('[IPC] Error fetching playlist info:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('start-download', async (event, downloadId, options) => {
        try {
            console.log('[IPC] Starting download:', downloadId, options);

            downloadService.startDownload(
                downloadId,
                options,
                // onProgress
                (progress) => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('download-progress', progress);
                    }
                },
                // onComplete
                (filepath) => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('download-complete', { downloadId, filepath });
                    }
                },
                // onError
                (error) => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('download-error', { downloadId, error });
                    }
                }
            );

            return { success: true };
        } catch (error) {
            console.error('[IPC] Error starting download:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-active-downloads', async () => {
        try {
            const tasks = downloadService.getActiveTasks();
            return { success: true, tasks };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cancel-download', async (event, downloadId) => {
        try {
            console.log('[IPC] Canceling download:', downloadId);
            const success = downloadService.cancelDownload(downloadId);
            return { success };
        } catch (error) {
            console.error('[IPC] Error canceling download:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('verify-ytdlp', async () => {
        try {
            const isValid = await YtDlpBinary.verify();
            const version = await YtDlpBinary.getVersion();
            return { success: true, isValid, version };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('verify-ffmpeg', async () => {
        try {
            const result = await downloadService.verifyFFmpeg();
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message, available: false };
        }
    });

    ipcMain.handle('download-ffmpeg', async (event) => {
        try {
            const result = await downloadService.downloadFFmpeg((progress) => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('ffmpeg-download-progress', progress);
                }
            });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-dashboard-stats', async () => {
        try {
            // Get download stats
            const downloadStats = downloadService.getStats();

            // Get disk space (userData path drive)
            const drivePath = app.getPath('userData');
            const stats = await fs.promises.statfs(drivePath);
            const freeSpaceGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
            const totalSpaceGB = (stats.blocks * stats.bsize) / (1024 * 1024 * 1024);
            const usedSpaceGB = totalSpaceGB - freeSpaceGB;

            return {
                success: true,
                stats: {
                    activeDownloads: downloadStats.activeDownloads,
                    currentSpeed: downloadStats.currentSpeed,
                    freeSpace: `${freeSpaceGB.toFixed(0)} GB`,
                    usedSpace: `${usedSpaceGB.toFixed(0)} GB`,
                    totalSpace: `${totalSpaceGB.toFixed(0)} GB`,
                    downloadedToday: '0 MB', // Placeholder for now
                    activity: downloadStats.activity
                }
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-history', async () => {
        try {
            const history = downloadService.getHistory();
            return { success: true, history };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clear-history', async () => {
        try {
            downloadService.clearHistory();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-folder', async (event, filepath) => {
        try {
            const { shell } = await import('electron');
            if (filepath) {
                shell.showItemInFolder(filepath);
                return { success: true };
            }
            return { success: false, error: 'No filepath provided' };
        } catch (error) {
            console.error('Error opening folder:', error);
            return { success: false, error: error.message };
        }
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

const logPath = path.join(app.getPath('userData'), 'startup_debug.log');

function logToFile(message) {
    try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `${timestamp}: ${message}\n`);
    } catch (e) {
        // ignore
    }
}

app.whenReady().then(async () => {
    logToFile('App started');
    createWindow();
    logToFile('Window created');

    // Check and download FFmpeg if missing
    try {
        logToFile('Checking FFmpeg...');
        const ffmpegStatus = await downloadService.verifyFFmpeg();
        logToFile(`FFmpeg status: ${JSON.stringify(ffmpegStatus)}`);

        if (!ffmpegStatus.available) {
            console.log('FFmpeg not found, starting background download...');
            logToFile('FFmpeg missing, starting download');
            if (mainWindow) {
                mainWindow.webContents.send('ffmpeg-download-start');
            }

            await downloadService.downloadFFmpeg((progress) => {
                console.log(`FFmpeg Download Progress: ${progress.percent}%`);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('ffmpeg-download-progress', progress);
                }
            });

            console.log('FFmpeg download complete.');
            logToFile('FFmpeg download complete');
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('ffmpeg-download-complete');
            }
        } else {
            console.log('FFmpeg is already available.');
            logToFile('FFmpeg available');
        }
    } catch (error) {
        console.error('Error checking/downloading FFmpeg:', error);
        logToFile(`FFmpeg error: ${error.message}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ffmpeg-download-error', error.message);
        }
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    logToFile('All windows closed');
    if (process.platform !== 'darwin') app.quit();
});

