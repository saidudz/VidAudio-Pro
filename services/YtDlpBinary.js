import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Utility class to locate and manage the yt-dlp binary
 */
export class YtDlpBinary {
    static cachedPath = null;

    /**
     * Get the path to the yt-dlp executable
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
            path.join(process.resourcesPath, 'yt-dlp.exe'),

            // Development: resources folder
            path.join(app.getAppPath(), 'resources', 'yt-dlp.exe'),

            // Alternative development path
            path.join(process.cwd(), 'resources', 'yt-dlp.exe'),
        ];

        for (const ytDlpPath of possiblePaths) {
            if (fs.existsSync(ytDlpPath)) {
                console.log(`[YtDlpBinary] Found yt-dlp at: ${ytDlpPath}`);
                this.cachedPath = ytDlpPath;
                return ytDlpPath;
            }
        }

        // Fallback to system PATH
        console.warn('[YtDlpBinary] yt-dlp not found in bundled locations, using system PATH');
        this.cachedPath = 'yt-dlp';
        return 'yt-dlp';
    }

    /**
     * Verify that yt-dlp is accessible and working
     */
    static async verify() {
        const { spawn } = await import('child_process');
        const ytDlpPath = this.getPath();

        return new Promise((resolve) => {
            const process = spawn(ytDlpPath, ['--version']);

            process.on('error', (error) => {
                console.error('[YtDlpBinary] Verification failed:', error);
                resolve(false);
            });

            process.on('close', (code) => {
                resolve(code === 0);
            });
        });
    }

    /**
     * Get yt-dlp version
     */
    static async getVersion() {
        const { spawn } = await import('child_process');
        const ytDlpPath = this.getPath();

        return new Promise((resolve) => {
            const process = spawn(ytDlpPath, ['--version']);
            let output = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('error', () => {
                resolve(null);
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    resolve(null);
                }
            });
        });
    }
}
