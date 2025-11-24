import { spawn } from 'child_process';
import { YtDlpBinary } from './YtDlpBinary.js';
import { FFmpegBinary } from './FFmpegBinary.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Service class for managing video downloads using yt-dlp
 */
export class DownloadService {
    constructor() {
        this.activeDownloads = new Map();
        this.activeTasks = new Map(); // Store full task metadata
        this.downloadSpeeds = new Map(); // Track speed per download
        this.dailyActivity = new Map(); // Track downloads per day
        this.history = []; // Persistent history
        this.store = null; // Electron store instance
        this.progressCallbacks = new Map();
        this.completeCallbacks = new Map();
        this.errorCallbacks = new Map();
        this.initStore();
    }

    async initStore() {
        const { default: Store } = await import('electron-store');
        this.store = new Store();
        this.history = this.store.get('history', []) || [];
        this.dailyActivity = new Map(Object.entries(this.store.get('dailyActivity', {}) || {}));
    }

    saveStore() {
        if (this.store) {
            this.store.set('history', this.history);
            this.store.set('dailyActivity', Object.fromEntries(this.dailyActivity));
        }
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        this.history = [];
        this.saveStore();
        return true;
    }

    /**
     * Fetch video information from URL
     */
    async fetchVideoInfo(url) {
        const ytDlpPath = YtDlpBinary.getPath();

        return new Promise((resolve, reject) => {
            const args = [
                '--dump-json',
                '--no-playlist',
                '--skip-download',
                '--write-thumbnail',
                url
            ];

            const process = spawn(ytDlpPath, args);
            let output = '';
            let errorOutput = '';

            // Log start
            const logPath = path.join(app.getPath('userData'), 'ytdlp_debug.log');
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] START fetchVideoInfo: ${url}\n`);
            fs.appendFileSync(logPath, `Command: ${ytDlpPath} ${args.join(' ')}\n`);

            // Set a timeout of 60 seconds
            const timeout = setTimeout(() => {
                process.kill();
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] TIMEOUT (60s)\n`);
                reject(new Error('Request timed out (60s) - check your internet connection or try again'));
            }, 60000);

            process.stdout.on('data', (data) => {
                const str = data.toString();
                output += str;
                fs.appendFileSync(logPath, `STDOUT: ${str}\n`);
            });

            process.stderr.on('data', (data) => {
                const str = data.toString();
                errorOutput += str;
                fs.appendFileSync(logPath, `STDERR: ${str}\n`);
            });

            process.on('close', (code) => {
                clearTimeout(timeout);
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] EXIT code: ${code}\n`);

                if (code === 0 && output) {
                    try {
                        const data = JSON.parse(output);
                        const videoInfo = this.parseVideoInfo(data);
                        resolve(videoInfo);
                    } catch (error) {
                        fs.appendFileSync(logPath, `PARSE ERROR: ${error}\n`);
                        reject(new Error(`Failed to parse video info: ${error}`));
                    }
                } else {
                    reject(new Error(errorOutput || 'Failed to fetch video info'));
                }
            });

            process.on('error', (error) => {
                clearTimeout(timeout);
                fs.appendFileSync(logPath, `PROCESS ERROR: ${error}\n`);
                reject(error);
            });
        });
    }

    /**
     * Fetch playlist information
     */
    async fetchPlaylistInfo(url) {
        const ytDlpPath = YtDlpBinary.getPath();

        return new Promise((resolve, reject) => {
            const args = [
                '--dump-json',
                '--flat-playlist',
                '--write-thumbnail',
                url
            ];

            const process = spawn(ytDlpPath, args);
            let output = '';
            let errorOutput = '';

            // Log start
            const logPath = path.join(app.getPath('userData'), 'ytdlp_debug.log');
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] START fetchPlaylistInfo: ${url}\n`);
            fs.appendFileSync(logPath, `Command: ${ytDlpPath} ${args.join(' ')}\n`);

            // Set a timeout of 60 seconds
            const timeout = setTimeout(() => {
                process.kill();
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] TIMEOUT (60s)\n`);
                reject(new Error('Request timed out (60s) - check your internet connection or try again'));
            }, 60000);

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0 && output) {
                    try {
                        const lines = output.trim().split('\n');
                        const entries = lines.map(line => {
                            const data = JSON.parse(line);
                            let thumbnail = data.thumbnail || '';

                            // Fallback for YouTube thumbnails if missing
                            if (!thumbnail && (data.id || data.url)) {
                                const id = data.id || (data.url && data.url.match(/v=([^&]+)/)?.[1]);
                                if (id) {
                                    thumbnail = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
                                }
                            }

                            return {
                                id: data.id || data.url,
                                title: data.title || 'Unknown',
                                url: data.url || data.webpage_url,
                                duration: data.duration || 0,
                                thumbnail: thumbnail
                            };
                        });

                        const playlistInfo = {
                            id: entries[0]?.id || 'unknown',
                            title: 'Playlist',
                            uploader: 'Unknown',
                            entries
                        };

                        resolve(playlistInfo);
                    } catch (error) {
                        reject(new Error(`Failed to parse playlist info: ${error}`));
                    }
                } else {
                    reject(new Error(errorOutput || 'Failed to fetch playlist info'));
                }
            });

            process.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Verify FFmpeg availability
     */
    async verifyFFmpeg() {
        return await FFmpegBinary.verifyComplete();
    }

    /**
     * Download and install FFmpeg automatically
     */
    async downloadFFmpeg(onProgress) {
        const https = await import('https');
        const AdmZip = await import('adm-zip').then(m => m.default);

        const ffmpegUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
        const tempDir = app.getPath('temp');
        const zipPath = path.join(tempDir, 'ffmpeg.zip');
        const resourcesPath = app.isPackaged
            ? process.resourcesPath
            : path.join(app.getAppPath(), 'resources');

        return new Promise((resolve, reject) => {
            const downloadFile = (url) => {
                https.get(url, (response) => {
                    // Handle redirects
                    if (response.statusCode === 301 || response.statusCode === 302) {
                        downloadFile(response.headers.location);
                        return;
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`Failed to download FFmpeg: HTTP ${response.statusCode}`));
                        return;
                    }

                    const totalBytes = parseInt(response.headers['content-length'], 10);
                    let downloadedBytes = 0;

                    const file = fs.createWriteStream(zipPath);

                    response.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                        if (onProgress && totalBytes) {
                            const percent = (downloadedBytes / totalBytes) * 100;
                            onProgress({ percent: percent.toFixed(1), downloaded: downloadedBytes, total: totalBytes });
                        }
                    });

                    response.pipe(file);

                    file.on('finish', () => {
                        file.close();

                        try {
                            // Extract the ZIP
                            const zip = new AdmZip(zipPath);
                            const zipEntries = zip.getEntries();

                            // Find and extract ffmpeg.exe and ffprobe.exe
                            let foundFFmpeg = false;
                            let foundFFprobe = false;

                            zipEntries.forEach((entry) => {
                                if (entry.entryName.endsWith('bin/ffmpeg.exe')) {
                                    zip.extractEntryTo(entry, resourcesPath, false, true, false, 'ffmpeg.exe');
                                    foundFFmpeg = true;
                                } else if (entry.entryName.endsWith('bin/ffprobe.exe')) {
                                    zip.extractEntryTo(entry, resourcesPath, false, true, false, 'ffprobe.exe');
                                    foundFFprobe = true;
                                }
                            });

                            // Clean up
                            fs.unlinkSync(zipPath);

                            if (foundFFmpeg && foundFFprobe) {
                                // Clear cached path so it re-detects
                                FFmpegBinary.cachedPath = null;
                                resolve({ success: true, message: 'FFmpeg installed successfully' });
                            } else {
                                reject(new Error('Could not find ffmpeg.exe or ffprobe.exe in the downloaded archive'));
                            }
                        } catch (error) {
                            reject(new Error(`Extraction failed: ${error.message}`));
                        }
                    });
                }).on('error', (error) => {
                    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                    reject(error);
                });
            };

            downloadFile(ffmpegUrl);
        });
    }

    /**
     * Start a download
     */
    startDownload(downloadId, options, onProgress, onComplete, onError) {
        const ytDlpPath = YtDlpBinary.getPath();

        // Store initial task metadata
        if (options.metadata) {
            this.activeTasks.set(downloadId, {
                ...options.metadata,
                status: 'Downloading',
                progress: 0,
                speed: 'Starting...',
                eta: 'Calculating...'
            });
        }

        // Store callbacks
        if (onProgress) this.progressCallbacks.set(downloadId, onProgress);
        if (onComplete) this.completeCallbacks.set(downloadId, onComplete);
        if (onError) this.errorCallbacks.set(downloadId, onError);

        // Build arguments
        const args = [
            '--newline',
            '--no-playlist',
            '--merge-output-format', 'mp4',
            '-o', path.join(options.outputPath, options.filename || '%(title)s.%(ext)s')
        ];

        // Add FFmpeg location if available
        const ffmpegLocation = FFmpegBinary.getLocation();
        if (ffmpegLocation) {
            args.push('--ffmpeg-location', ffmpegLocation);
            console.log(`[DownloadService] Using FFmpeg from: ${ffmpegLocation}`);
        }

        if (options.audioOnly) {
            args.push('-x', '--audio-format', 'mp3');
        } else if (options.formatId) {
            args.push('-f', options.formatId);
        } else {
            args.push('-f', 'bestvideo+bestaudio/best');
        }

        args.push(options.url);

        const process = spawn(ytDlpPath, args);
        this.activeDownloads.set(downloadId, process);

        let errorOutput = '';

        process.stdout.on('data', (data) => {
            const output = data.toString();
            this.parseProgress(downloadId, output);
        });

        process.stderr.on('data', (data) => {
            const errorText = data.toString();
            errorOutput += errorText;

            // Log FFmpeg-related errors for debugging
            if (errorText.includes('ffmpeg') || errorText.includes('ffprobe')) {
                console.error(`[DownloadService] FFmpeg error for ${downloadId}:`, errorText);
            }
        });

        process.on('close', (code) => {
            this.activeDownloads.delete(downloadId);
            this.progressCallbacks.delete(downloadId);

            if (code === 0) {
                const callback = this.completeCallbacks.get(downloadId);
                const filepath = path.join(options.outputPath, options.filename || 'download');

                if (callback) {
                    callback(filepath);
                }
                this.completeCallbacks.delete(downloadId);

                // Update daily activity
                const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                const currentCount = this.dailyActivity.get(today) || 0;
                this.dailyActivity.set(today, currentCount + 1);

                // Add to history
                this.history.unshift({
                    id: downloadId,
                    title: options.filename ? options.filename.replace(/\.[^/.]+$/, "") : 'Unknown',
                    url: options.url,
                    thumbnail: options.thumbnail || '',
                    format: options.formatLabel || 'Unknown',
                    quality: options.qualityLabel || 'Unknown',
                    size: 'Unknown', // TODO: Capture actual size
                    date: new Date().toISOString(),
                    status: 'Completed',
                    path: filepath
                });
                this.saveStore();
            } else {
                const callback = this.errorCallbacks.get(downloadId);
                if (callback) {
                    callback(errorOutput || 'Download failed');
                }
            }
            this.errorCallbacks.delete(downloadId);
        });

        process.on('error', (error) => {
            const callback = this.errorCallbacks.get(downloadId);
            if (callback) {
                callback(error.message);
            }
            this.cleanup(downloadId);
        });
    }

    /**
     * Cancel a download
     */
    cancelDownload(downloadId) {
        const process = this.activeDownloads.get(downloadId);
        if (process) {
            process.kill();
            this.cleanup(downloadId);
            return true;
        }
        return false;
    }

    /**
     * Parse video info from yt-dlp JSON output
     */
    parseVideoInfo(data) {
        const formats = (data.formats || []).map((f) => ({
            formatId: f.format_id,
            quality: f.format_note || f.quality || 'unknown',
            format: f.ext?.toUpperCase() || 'UNKNOWN',
            filesize: f.filesize || f.filesize_approx || null,
            ext: f.ext || 'mp4',
            isVideo: f.vcodec !== 'none',
            isAudio: f.acodec !== 'none',
            resolution: f.resolution,
            fps: f.fps,
            vcodec: f.vcodec,
            acodec: f.acodec,
            abr: f.abr
        }));

        return {
            id: data.id,
            title: data.title || 'Unknown',
            thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails[0] && data.thumbnails[0].url) || '',
            duration: data.duration || 0,
            uploader: data.uploader || 'Unknown',
            url: data.webpage_url || data.url,
            formats,
            isPlaylist: false
        };
    }

    /**
     * Parse download progress from yt-dlp output
     */
    parseProgress(downloadId, output) {
        const callback = this.progressCallbacks.get(downloadId);
        if (!callback) return;

        // Parse yt-dlp progress line
        // Example: [download]  45.5% of 123.45MiB at 1.23MiB/s ETA 00:45
        const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
        // Accept units like KiB/s, MiB/s, GB/s, etc.
        const speedMatch = output.match(/at\s+([\d.]+[A-Za-z]+\/s)/);
        const etaMatch = output.match(/ETA\s+([\d:]+)/);
        const sizeMatch = output.match(/of\s+([\d.]+\w+)/);

        if (progressMatch) {
            const speedStr = speedMatch ? speedMatch[1] : '0 B/s';
            this.downloadSpeeds.set(downloadId, speedStr);

            const progress = {
                downloadId,
                percent: parseFloat(progressMatch[1]),
                speed: speedStr,
                eta: etaMatch ? etaMatch[1] : 'Unknown',
                downloaded: '0 MB',
                total: sizeMatch ? sizeMatch[1] : 'Unknown'
            };

            callback(progress);

            // Update stored task state
            const currentTask = this.activeTasks.get(downloadId);
            if (currentTask) {
                this.activeTasks.set(downloadId, {
                    ...currentTask,
                    progress: progress.percent,
                    speed: progress.speed,
                    eta: progress.eta,
                    status: 'Downloading'
                });
            }
        }
    }

    /**
     * Cleanup download resources
     */
    cleanup(downloadId) {
        this.activeDownloads.delete(downloadId);
        this.activeTasks.delete(downloadId);
        this.downloadSpeeds.delete(downloadId);
        this.progressCallbacks.delete(downloadId);
        this.completeCallbacks.delete(downloadId);
        this.errorCallbacks.delete(downloadId);
    }

    /**
     * Get current download stats
     */
    getStats() {
        let totalSpeedBytes = 0;

        for (const speedStr of this.downloadSpeeds.values()) {
            // Parse speed string (e.g. "1.5MiB/s")
            const match = speedStr.match(/([\d.]+)([A-Za-z]+)\/s/);
            if (match) {
                const val = parseFloat(match[1]);
                const unit = match[2].toLowerCase();
                let multiplier = 1;
                if (unit === 'kib' || unit === 'k') multiplier = 1024;
                if (unit === 'mib' || unit === 'm') multiplier = 1024 * 1024;
                if (unit === 'gib' || unit === 'g') multiplier = 1024 * 1024 * 1024;
                totalSpeedBytes += val * multiplier;
            }
        }

        // Format total speed
        let formattedSpeed = '0 B/s';
        if (totalSpeedBytes > 0) {
            if (totalSpeedBytes > 1024 * 1024 * 1024) formattedSpeed = (totalSpeedBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GiB/s';
            else if (totalSpeedBytes > 1024 * 1024) formattedSpeed = (totalSpeedBytes / (1024 * 1024)).toFixed(1) + ' MiB/s';
            else if (totalSpeedBytes > 1024) formattedSpeed = (totalSpeedBytes / 1024).toFixed(1) + ' KiB/s';
            else formattedSpeed = totalSpeedBytes.toFixed(0) + ' B/s';
        }

        // Format activity data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const activityData = days.map(day => ({
            name: day,
            downloads: this.dailyActivity.get(day) || 0
        }));

        return {
            activeDownloads: this.activeDownloads.size,
            currentSpeed: formattedSpeed,
            activity: activityData
        };
    }
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
}
