import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Utility class to locate and manage FFmpeg binaries
 */
export class FFmpegBinary {
    static cachedPath = null;

    /**
     * Get the path to the ffmpeg executable
     * Checks multiple locations in order:
     * 1. Bundled with app (production)
     * 2. Resources folder (development)
     * 3. System PATH
     */
    static getPath() {
        if (this.cachedPath) {
            return this.cachedPath;
        }

        const possiblePaths = [
            // Production: bundled with app
            path.join(process.resourcesPath, 'ffmpeg.exe'),

            // Development: resources folder
            path.join(app.getAppPath(), 'resources', 'ffmpeg.exe'),

            // Alternative development path
            path.join(process.cwd(), 'resources', 'ffmpeg.exe'),
        ];

        for (const ffmpegPath of possiblePaths) {
            if (fs.existsSync(ffmpegPath)) {
                console.log(`[FFmpegBinary] Found ffmpeg at: ${ffmpegPath}`);
                this.cachedPath = ffmpegPath;
                return ffmpegPath;
            }
        }

        // Fallback to system PATH
        console.warn('[FFmpegBinary] ffmpeg not found in bundled locations, using system PATH');
        this.cachedPath = 'ffmpeg';
        return 'ffmpeg';
    }

    /**
     * Get the directory containing ffmpeg (for --ffmpeg-location)
     * Returns the directory path, not the full path to the executable
     */
    static getLocation() {
        const ffmpegPath = this.getPath();

        // If it's just 'ffmpeg' (system PATH), return null
        // yt-dlp will find it automatically
        if (ffmpegPath === 'ffmpeg') {
            return null;
        }

        // Return the directory containing ffmpeg
        return path.dirname(ffmpegPath);
    }

    /**
     * Verify that ffmpeg is accessible and working
     */
    static async verify() {
        const { spawn } = await import('child_process');
        const ffmpegPath = this.getPath();

        return new Promise((resolve) => {
            const process = spawn(ffmpegPath, ['-version']);

            process.on('error', (error) => {
                console.error('[FFmpegBinary] Verification failed:', error);
                resolve(false);
            });

            process.on('close', (code) => {
                resolve(code === 0);
            });
        });
    }

    /**
     * Get ffmpeg version
     */
    static async getVersion() {
        const { spawn } = await import('child_process');
        const ffmpegPath = this.getPath();

        return new Promise((resolve) => {
            const process = spawn(ffmpegPath, ['-version']);
            let output = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('error', () => {
                resolve(null);
            });

            process.on('close', (code) => {
                if (code === 0) {
                    // Extract version from first line: "ffmpeg version X.X.X"
                    const match = output.match(/ffmpeg version ([^\s]+)/);
                    resolve(match ? match[1] : output.split('\n')[0]);
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Check if both ffmpeg and ffprobe are available
     */
    static async verifyComplete() {
        const ffmpegAvailable = await this.verify();

        if (!ffmpegAvailable) {
            return {
                available: false,
                ffmpeg: false,
                ffprobe: false,
                message: 'FFmpeg not found. Audio extraction and video conversion require FFmpeg.'
            };
        }

        // If ffmpeg is found, ffprobe should be in the same location
        return {
            available: true,
            ffmpeg: true,
            ffprobe: true,
            message: 'FFmpeg is available and ready.'
        };
    }
}
