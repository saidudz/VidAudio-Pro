declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.jpg' {
    const value: string;
    export default value;
}

declare module '*.svg' {
    const value: string;
    export default value;
}

interface Window {
    electronAPI: {
        getApiKey: () => Promise<string>;
        setApiKey: (key: string) => Promise<{ success: boolean }>;
        hasApiKey: () => Promise<boolean>;
        selectFolder: () => Promise<string>;
        fetchVideoInfo: (url: string) => Promise<any>;
        fetchPlaylistInfo: (url: string) => Promise<any>;
        startDownload: (downloadId: string, options: any) => Promise<any>;
        cancelDownload: (downloadId: string) => Promise<any>;
        verifyYtDlp: () => Promise<any>;
        getDashboardStats: () => Promise<any>;
        getHistory: () => Promise<any>;
        clearHistory: () => Promise<any>;
        getActiveDownloads: () => Promise<any>;
        verifyFFmpeg: () => Promise<any>;
        downloadFFmpeg: () => Promise<any>;
        openFolder: (filepath: string) => Promise<{ success: boolean; error?: string }>;
        onDownloadProgress: (callback: (progress: any) => void) => void;
        onDownloadComplete: (callback: (data: { downloadId: string; filepath: string }) => void) => void;
        onDownloadError: (callback: (data: { downloadId: string; error: string }) => void) => void;
        onFFmpegDownloadStart: (callback: () => void) => void;
        onFFmpegDownloadProgress: (callback: (progress: { percent: string; downloaded: number; total: number }) => void) => void;
        onFFmpegDownloadComplete: (callback: () => void) => void;
        onFFmpegDownloadError: (callback: (error: string) => void) => void;
        removeDownloadListeners: () => void;
    };
}
