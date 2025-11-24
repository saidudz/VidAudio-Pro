declare global {
    interface Window {
        electronAPI: {
            getApiKey: () => Promise<string | null>;
            setApiKey: (key: string) => Promise<{ success: boolean }>;
            hasApiKey: () => Promise<boolean>;
            selectFolder: () => Promise<string | null>;

            // Download API
            fetchVideoInfo: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
            fetchPlaylistInfo: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
            startDownload: (downloadId: string, options: any) => Promise<{ success: boolean; error?: string }>;
            cancelDownload: (downloadId: string) => Promise<{ success: boolean }>;
            verifyYtDlp: () => Promise<{ success: boolean; isValid?: boolean; version?: string; error?: string }>;
            getDashboardStats: () => Promise<{ success: boolean; stats?: any; error?: string }>;
            getHistory: () => Promise<{ success: boolean; history?: any[]; error?: string }>;
            clearHistory: () => Promise<{ success: boolean; error?: string }>;
            getActiveDownloads: () => Promise<{ success: boolean; tasks?: any[]; error?: string }>;
            verifyFFmpeg: () => Promise<{ success: boolean; available: boolean; ffmpeg?: boolean; ffprobe?: boolean; message?: string; error?: string }>;
            downloadFFmpeg: () => Promise<{ success: boolean; message?: string; error?: string }>;

            // Event listeners
            onDownloadProgress: (callback: (progress: any) => void) => void;
            onDownloadComplete: (callback: (data: { downloadId: string; filepath: string }) => void) => void;
            onDownloadError: (callback: (data: { downloadId: string; error: string }) => void) => void;
            onFFmpegDownloadProgress: (callback: (progress: { percent: string; downloaded: number; total: number }) => void) => void;
            removeDownloadListeners: () => void;
        };
    }
}

export { };
