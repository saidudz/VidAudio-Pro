import { VideoFormat, DownloadTask, DownloadStatus, Account, PlaylistInfo } from './types';

export const MOCK_FORMATS: VideoFormat[] = [
  // Video Formats
  { id: 'v1', quality: '8K Ultra HD', format: 'WEBM', size: '2.4 GB', isVideo: true },
  { id: 'v2', quality: '4K Ultra HD', format: 'MP4', size: '1.2 GB', isVideo: true },
  { id: 'v3', quality: '2K QHD', format: 'MKV', size: '850 MB', isVideo: true },
  { id: 'v4', quality: '1080p (60fps)', format: 'MP4', size: '250 MB', isVideo: true },
  { id: 'v5', quality: '1080p', format: 'AVI', size: '220 MB', isVideo: true },
  { id: 'v6', quality: '1080p', format: 'MOV', size: '240 MB', isVideo: true },
  { id: 'v7', quality: '720p', format: 'MP4', size: '95 MB', isVideo: true },
  { id: 'v8', quality: '720p', format: 'FLV', size: '90 MB', isVideo: true },
  { id: 'v9', quality: '480p', format: 'WebM', size: '45 MB', isVideo: true },
  { id: 'v10', quality: '480p', format: 'WMV', size: '48 MB', isVideo: true },

  // Audio Formats
  { id: 'a1', quality: 'High (320kbps)', format: 'MP3', size: '12 MB', isVideo: false },
  { id: 'a2', quality: 'Lossless (FLAC)', format: 'FLAC', size: '35 MB', isVideo: false },
  { id: 'a3', quality: 'High (WAV)', format: 'WAV', size: '45 MB', isVideo: false },
  { id: 'a4', quality: 'Medium (192kbps)', format: 'MP3', size: '8 MB', isVideo: false },
  { id: 'a5', quality: 'Medium (OGG)', format: 'OGG', size: '7 MB', isVideo: false },
  { id: 'a6', quality: 'AAC', format: 'M4A', size: '6 MB', isVideo: false },
  { id: 'a7', quality: 'Low (128kbps)', format: 'MP3', size: '5 MB', isVideo: false },
  { id: 'a8', quality: 'Opus', format: 'OPUS', size: '4 MB', isVideo: false },
  { id: 'a9', quality: 'WMA', format: 'WMA', size: '5 MB', isVideo: false },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: '1', platform: 'YouTube', username: 'PremiumUser_99', isLoggedIn: true, avatarUrl: 'https://picsum.photos/40/40' },
  { id: '2', platform: 'Vimeo', username: 'CreativeDirector', isLoggedIn: true, avatarUrl: 'https://picsum.photos/41/41' },
  { id: '3', platform: 'SoundCloud', username: 'MusicLover', isLoggedIn: false },
];

// Initial mock history
export const MOCK_HISTORY: DownloadTask[] = [
  {
    id: 'h1',
    url: 'https://youtube.com/watch?v=example1',
    title: 'Lo-Fi Beats to Relax/Study To',
    thumbnail: 'https://picsum.photos/200/112',
    status: DownloadStatus.Completed,
    progress: 100,
    speed: '0 MB/s',
    eta: '-',
    totalSize: '1.2 GB',
    selectedFormat: MOCK_FORMATS[1], // 4K MP4
    dateAdded: new Date(Date.now() - 86400000), // Yesterday
  },
  {
    id: 'h2',
    url: 'https://vimeo.com/example2',
    title: 'Documentary on Nature',
    thumbnail: 'https://picsum.photos/200/113',
    status: DownloadStatus.Failed,
    progress: 45,
    speed: '0 MB/s',
    eta: '-',
    totalSize: '850 MB',
    selectedFormat: MOCK_FORMATS[2], // 2K MKV
    errorMessage: 'Network timeout',
    dateAdded: new Date(Date.now() - 172800000), // 2 days ago
  },
  {
    id: 'h3',
    url: 'https://soundcloud.com/artist/track',
    title: 'Podcast Episode 42: Future Tech',
    thumbnail: 'https://picsum.photos/200/114',
    status: DownloadStatus.Completed,
    progress: 100,
    speed: '0 MB/s',
    eta: '-',
    totalSize: '35 MB',
    selectedFormat: MOCK_FORMATS[11], // FLAC (approx index)
    dateAdded: new Date(Date.now() - 259200000), // 3 days ago
  }
];

// Playlist URL Patterns
export const PLAYLIST_PATTERNS = [
  /[\?&]list=([a-zA-Z0-9_-]+)/i, // YouTube playlist
  /soundcloud\.com\/[^\/]+\/sets\//i, // SoundCloud sets
  /^https?:\/\/.*[?&]playlist=/i, // Generic playlist param
];

// Mock Playlist Data
export const MOCK_PLAYLIST: PlaylistInfo = {
  id: 'pl_' + Math.random().toString(36).substr(2, 9),
  title: 'Chill Vibes 2025 - Complete Collection',
  url: 'https://youtube.com/playlist?list=PLexample123',
  channel: 'MusicChannel',
  thumbnail: 'https://picsum.photos/300/169',
  trackCount: 12,
  totalSize: '~850 MB',
  tracks: [
    { id: 't1', title: 'Sunset Dreams', duration: '3:45', thumbnail: 'https://picsum.photos/120/68?1', url: 'https://youtube.com/watch?v=1', index: 1 },
    { id: 't2', title: 'Ocean Waves', duration: '4:20', thumbnail: 'https://picsum.photos/120/68?2', url: 'https://youtube.com/watch?v=2', index: 2 },
    { id: 't3', title: 'Mountain Air', duration: '3:30', thumbnail: 'https://picsum.photos/120/68?3', url: 'https://youtube.com/watch?v=3', index: 3 },
    { id: 't4', title: 'City Lights', duration: '4:15', thumbnail: 'https://picsum.photos/120/68?4', url: 'https://youtube.com/watch?v=4', index: 4 },
    { id: 't5', title: 'Forest Path', duration: '5:00', thumbnail: 'https://picsum.photos/120/68?5', url: 'https://youtube.com/watch?v=5', index: 5 },
    { id: 't6', title: 'Desert Sunset', duration: '3:55', thumbnail: 'https://picsum.photos/120/68?6', url: 'https://youtube.com/watch?v=6', index: 6 },
    { id: 't7', title: 'Rainy Afternoon', duration: '4:40', thumbnail: 'https://picsum.photos/120/68?7', url: 'https://youtube.com/watch?v=7', index: 7 },
    { id: 't8', title: 'Northern Lights', duration: '6:10', thumbnail: 'https://picsum.photos/120/68?8', url: 'https://youtube.com/watch?v=8', index: 8 },
    { id: 't9', title: 'Tropical Paradise', duration: '4:25', thumbnail: 'https://picsum.photos/120/68?9', url: 'https://youtube.com/watch?v=9', index: 9 },
    { id: 't10', title: 'Winter Wonderland', duration: '3:50', thumbnail: 'https://picsum.photos/120/68?10', url: 'https://youtube.com/watch?v=10', index: 10 },
    { id: 't11', title: 'Spring Awakening', duration: '4:05', thumbnail: 'https://picsum.photos/120/68?11', url: 'https://youtube.com/watch?v=11', index: 11 },
    { id: 't12', title: 'Autumn Colors', duration: '5:20', thumbnail: 'https://picsum.photos/120/68?12', url: 'https://youtube.com/watch?v=12', index: 12 },
  ],
};