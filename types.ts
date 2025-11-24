export enum DownloadStatus {
  Queued = 'Queued',
  Downloading = 'Downloading',
  Completed = 'Completed',
  Failed = 'Failed',
  Paused = 'Paused'
}

export interface VideoFormat {
  id: string;
  quality: string; // e.g., '1080p', '720p'
  format: string; // e.g., 'MP4', 'WebM', 'MP3'
  size: string; // e.g., '145 MB'
  isVideo: boolean;
  isAudio?: boolean;
}

export interface DownloadTask {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  status: DownloadStatus;
  progress: number; // 0 to 100
  speed: string; // e.g., '2.5 MB/s'
  eta: string; // e.g., '45s'
  totalSize: string;
  selectedFormat: VideoFormat;
  dateAdded: Date;
  errorMessage?: string;
  playlistId?: string; // For grouping playlist downloads
  playlistIndex?: number; // Track position in playlist
}

export interface Account {
  id: string;
  platform: string;
  username: string;
  isLoggedIn: boolean;
  avatarUrl?: string;
}

export type Theme = 'light' | 'dark';

export interface AppSettings {
  defaultFolder: string;
  defaultFormat: string;
  language: 'en' | 'ar';
  theme: Theme;
  notifications: boolean;
  autoShutdown: boolean;
}

// Playlist Types
export interface PlaylistTrack {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  url: string;
  index: number;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  url: string;
  channel: string;
  thumbnail: string;
  trackCount: number;
  tracks: PlaylistTrack[];
  totalSize: string;
}