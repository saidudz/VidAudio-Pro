const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getApiKey: () => ipcRenderer.invoke('get-api-key'),
    setApiKey: (key) => ipcRenderer.invoke('set-api-key', key),
    hasApiKey: () => ipcRenderer.invoke('has-api-key'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),

    // Download API
    fetchVideoInfo: (url) => ipcRenderer.invoke('fetch-video-info', url),
    fetchPlaylistInfo: (url) => ipcRenderer.invoke('fetch-playlist-info', url),
    startDownload: (downloadId, options) => ipcRenderer.invoke('start-download', downloadId, options),
    cancelDownload: (downloadId) => ipcRenderer.invoke('cancel-download', downloadId),
    verifyYtDlp: () => ipcRenderer.invoke('verify-ytdlp'),
    getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
    getHistory: () => ipcRenderer.invoke('get-history'),
    clearHistory: () => ipcRenderer.invoke('clear-history'),
    getActiveDownloads: () => ipcRenderer.invoke('get-active-downloads'),
    verifyFFmpeg: () => ipcRenderer.invoke('verify-ffmpeg'),
    downloadFFmpeg: () => ipcRenderer.invoke('download-ffmpeg'),
    openFolder: (filepath) => ipcRenderer.invoke('open-folder', filepath),

    // Event listeners
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, progress) => callback(progress));
    },
    onDownloadComplete: (callback) => {
        ipcRenderer.on('download-complete', (event, data) => callback(data));
    },
    onDownloadError: (callback) => {
        ipcRenderer.on('download-error', (event, data) => callback(data));
    },
    onFFmpegDownloadStart: (callback) => {
        ipcRenderer.on('ffmpeg-download-start', () => callback());
    },
    onFFmpegDownloadProgress: (callback) => {
        ipcRenderer.on('ffmpeg-download-progress', (event, progress) => callback(progress));
    },
    onFFmpegDownloadComplete: (callback) => {
        ipcRenderer.on('ffmpeg-download-complete', () => callback());
    },
    onFFmpegDownloadError: (callback) => {
        ipcRenderer.on('ffmpeg-download-error', (event, error) => callback(error));
    },
    removeDownloadListeners: () => {
        ipcRenderer.removeAllListeners('download-progress');
        ipcRenderer.removeAllListeners('download-complete');
        ipcRenderer.removeAllListeners('download-error');
    }
});
