import React, { useState, useEffect } from 'react';
import { ArrowDown, Filter, Trash2, Link as LinkIcon, AlertCircle, Music, Clipboard, List, CheckSquare, Square } from 'lucide-react';
import DownloadCard from '../components/DownloadCard';
import { DownloadTask, DownloadStatus, VideoFormat, PlaylistInfo, PlaylistTrack } from '../types';
import { PLAYLIST_PATTERNS } from '../constants';
import clsx from 'clsx';

// Helper to convert yt-dlp format to our VideoFormat type
const convertFormat = (ytdlpFormat: any): VideoFormat => {
  const isVideo = ytdlpFormat.isVideo;
  const isAudio = ytdlpFormat.isAudio;

  // Calculate size display
  const sizeInMB = ytdlpFormat.filesize ? (ytdlpFormat.filesize / (1024 * 1024)).toFixed(0) : '?';

  return {
    id: ytdlpFormat.formatId,
    quality: ytdlpFormat.quality || ytdlpFormat.resolution || (isAudio ? `${ytdlpFormat.abr}kbps` : 'unknown'),
    format: ytdlpFormat.format,
    size: `${sizeInMB} MB`,
    isVideo: isVideo,
    isAudio: isAudio
  };
};

const Downloads: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DownloadStatus | 'All'>('All');
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [currentVideoInfo, setCurrentVideoInfo] = useState<any>(null);

  // Format Selection State
  const [detectedFormats, setDetectedFormats] = useState<VideoFormat[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');

  // Playlist State
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistInfo | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());

  // FFmpeg State
  const [ffmpegAvailable, setFFmpegAvailable] = useState<boolean | null>(null);
  const [showFFmpegWarning, setShowFFmpegWarning] = useState(false);
  const [isDownloadingFFmpeg, setIsDownloadingFFmpeg] = useState(false);
  const [ffmpegDownloadProgress, setFFmpegDownloadProgress] = useState(0);

  // Setup download event listeners and fetch initial state
  useEffect(() => {
    if (!window.electronAPI) return;

    // Fetch active downloads on mount
    const fetchActiveDownloads = async () => {
      const result = await window.electronAPI.getActiveDownloads();
      if (result.success && result.tasks) {
        setTasks(result.tasks);
      }
    };
    fetchActiveDownloads();

    // Check FFmpeg availability
    const checkFFmpeg = async () => {
      const result = await window.electronAPI.verifyFFmpeg();
      if (result.success) {
        setFFmpegAvailable(result.available);
        if (!result.available) {
          console.warn('[Downloads] FFmpeg not available:', result.message);
        }
      }
    };
    checkFFmpeg();

    window.electronAPI.onDownloadProgress((progress: any) => {
      setTasks(currentTasks => {
        // Check if task exists, if not (maybe started in another window/session), add it
        const exists = currentTasks.some(t => t.id === progress.downloadId);
        if (!exists) {
          // We might need to fetch full list again or handle this case. 
          // For now, let's just update if exists.
          return currentTasks;
        }

        return currentTasks.map(task =>
          task.id === progress.downloadId
            ? {
              ...task,
              progress: progress.percent,
              speed: progress.speed,
              eta: progress.eta,
              status: DownloadStatus.Downloading
            }
            : task
        );
      });
    });

    window.electronAPI.onDownloadComplete((data: { downloadId: string; filepath: string }) => {
      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === data.downloadId
            ? { ...task, status: DownloadStatus.Completed, progress: 100, speed: '0 MB/s', eta: '-' }
            : task
        )
      );
    });

    window.electronAPI.onDownloadError((data: { downloadId: string; error: string }) => {
      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === data.downloadId
            ? { ...task, status: DownloadStatus.Failed, errorMessage: data.error }
            : task
        )
      );
    });

    // FFmpeg global listeners
    window.electronAPI.onFFmpegDownloadStart(() => {
      setIsDownloadingFFmpeg(true);
      setShowFFmpegWarning(false); // Hide warning if open
    });

    window.electronAPI.onFFmpegDownloadProgress((progress: { percent: string; downloaded: number; total: number }) => {
      setIsDownloadingFFmpeg(true);
      setFFmpegDownloadProgress(parseFloat(progress.percent));
    });

    window.electronAPI.onFFmpegDownloadComplete(() => {
      setIsDownloadingFFmpeg(false);
      setFFmpegDownloadProgress(100);
      setFFmpegAvailable(true);
      // Optional: Show a toast or notification
    });

    window.electronAPI.onFFmpegDownloadError((error: string) => {
      setIsDownloadingFFmpeg(false);
      console.error('FFmpeg auto-download failed:', error);
    });

    return () => {
      window.electronAPI?.removeDownloadListeners();
    };
  }, []);

  // Check if URL is a playlist
  const isPlaylistUrl = (url: string): boolean => {
    return PLAYLIST_PATTERNS.some(pattern => pattern.test(url));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const handleDownloadFFmpeg = async () => {
    if (!window.electronAPI) return;

    // State will be updated by global listeners
    try {
      const result = await window.electronAPI.downloadFFmpeg();
      if (!result.success) {
        alert(`Failed to download FFmpeg: ${result.error}`);
      }
    } catch (error) {
      console.error('FFmpeg download error:', error);
      alert(`Error downloading FFmpeg: ${error}`);
    }
  };

  const handleFetchInfo = async () => {
    if (!urlInput || !window.electronAPI) return;

    setIsFetchingInfo(true);

    try {
      // Check if it's a playlist URL
      if (isPlaylistUrl(urlInput)) {
        const result = await window.electronAPI.fetchPlaylistInfo(urlInput);

        if (result.success && result.data) {
          const playlistData = result.data;
          const playlist: PlaylistInfo = {
            id: playlistData.id,
            title: playlistData.title,
            url: urlInput,
            channel: playlistData.uploader,
            thumbnail: playlistData.entries[0]?.thumbnail || '',
            trackCount: playlistData.entries.length,
            totalSize: '~Unknown',
            tracks: playlistData.entries.map((entry: any, index: number) => ({
              id: entry.id,
              title: entry.title,
              duration: entry.duration ? `${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, '0')}` : 'Unknown',
              thumbnail: entry.thumbnail || '',
              url: entry.url,
              index: index + 1
            }))
          };

          setCurrentPlaylist(playlist);
          setSelectedTracks(new Set(playlist.tracks.map(t => t.id)));
          setShowPlaylistModal(true);
        } else {
          alert(`Error fetching playlist: ${result.error}`);
        }
      } else {
        // Regular single video/audio
        const result = await window.electronAPI.fetchVideoInfo(urlInput);

        if (result.success && result.data) {
          const videoInfo = result.data;
          setCurrentVideoInfo(videoInfo);

          // Convert formats
          let formats = videoInfo.formats.map(convertFormat);

          // Filter based on audio mode
          if (isAudioMode) {
            formats = formats.filter((f: VideoFormat) => !f.isVideo);
          } else {
            // For video mode, prefer formats with both video and audio
            formats = formats.filter((f: VideoFormat) => f.isVideo);
          }

          setDetectedFormats(formats);
          setShowFormatModal(true);

          if (formats.length > 0) {
            setSelectedFormatId(formats[0].id);
          }
        } else {
          alert(`Error fetching video info: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error fetching info:', error);
      alert(`Error: ${error}`);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const startDownload = async () => {
    if (!window.electronAPI || !currentVideoInfo) return;

    const format = detectedFormats.find(f => f.id === selectedFormatId) || detectedFormats[0];
    const downloadId = Math.random().toString(36).substr(2, 9);

    const newTask: DownloadTask = {
      id: downloadId,
      url: urlInput,
      title: currentVideoInfo.title,
      thumbnail: currentVideoInfo.thumbnail,
      status: DownloadStatus.Downloading,
      progress: 0,
      speed: 'Starting...',
      eta: 'Calculating...',
      totalSize: format.size,
      selectedFormat: format,
      dateAdded: new Date(),
    };

    setTasks(prev => [newTask, ...prev]);

    // Determine format ID string
    // For video downloads, always merge with best audio to ensure sound works
    let formatIdStr: string | undefined;
    if (isAudioMode) {
      formatIdStr = undefined; // Let yt-dlp handle audio extraction
    } else {
      // Always use format+bestaudio to ensure we get both video and audio
      formatIdStr = `${format.id}+bestaudio/best`;
    }

    // Start the actual download
    const downloadOptions = {
      url: urlInput,
      formatId: formatIdStr,
      audioOnly: isAudioMode,
      outputPath: 'C:\\Users\\SAIDU\\Downloads\\VidAudio', // TODO: Get from settings
      filename: `${currentVideoInfo.title}.mp4`,
      metadata: newTask // Pass metadata to service for persistence
    };

    await window.electronAPI.startDownload(downloadId, downloadOptions);

    setShowFormatModal(false);
    setUrlInput('');
    setCurrentVideoInfo(null);
  };

  const startPlaylistDownload = async () => {
    if (!window.electronAPI || !currentPlaylist) return;
    // For each selected track, start a download using yt-dlp
    const tracksToDownload = currentPlaylist.tracks.filter(track => selectedTracks.has(track.id));
    for (const track of tracksToDownload) {
      const downloadId = Math.random().toString(36).substr(2, 9);
      const format = {
        id: 'best',
        quality: 'best',
        format: 'best',
        size: '~Unknown',
        isVideo: true
      };
      const newTask: DownloadTask = {
        id: downloadId,
        url: track.url,
        title: track.title,
        thumbnail: track.thumbnail,
        status: DownloadStatus.Downloading,
        progress: 0,
        speed: 'Starting...',
        eta: 'Calculating...',
        totalSize: format.size,
        selectedFormat: format,
        dateAdded: new Date()
      };
      setTasks(prev => [newTask, ...prev]);
      const downloadOptions = {
        url: track.url,
        formatId: undefined,
        audioOnly: isAudioMode,
        outputPath: 'C:\\Users\\SAIDU\\Downloads\\VidAudio',
        filename: `${track.title}.mp4`,
        metadata: newTask // Pass metadata to service for persistence
      };
      await window.electronAPI.startDownload(downloadId, downloadOptions);
    }
    setShowPlaylistModal(false);
    setSelectedTracks(new Set());
  };

  const handlePause = (id: string) => {
    // TODO: Implement pause
    setTasks(tasks.map(t => t.id === id ? { ...t, status: DownloadStatus.Paused, speed: '0 MB/s' } : t));
  };

  const handleResume = (id: string) => {
    // TODO: Implement resume
    setTasks(tasks.map(t => t.id === id ? { ...t, status: DownloadStatus.Downloading } : t));
  };

  const handleCancel = async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.cancelDownload(id);
    }
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleRetry = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: DownloadStatus.Downloading, progress: 0, errorMessage: undefined } : t));
  };

  const handleOpenFolder = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && task.path && window.electronAPI) {
      await window.electronAPI.openFolder(task.path);
    } else {
      console.warn('Cannot open folder: Task or path missing', task);
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const selectAllTracks = () => {
    if (currentPlaylist) {
      setSelectedTracks(new Set(currentPlaylist.tracks.map(t => t.id)));
    }
  };

  const deselectAllTracks = () => {
    setSelectedTracks(new Set());
  };

  const filteredTasks = activeTab === 'All'
    ? tasks
    : tasks.filter(t => t.status === activeTab);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Input Area */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex-shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste video or playlist URL here..."
                className="block w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
              />
            </div>

            <button
              onClick={handlePaste}
              className="inline-flex items-center px-4 py-3 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Paste</span>
            </button>

            <button
              onClick={handleFetchInfo}
              disabled={!urlInput || isFetchingInfo}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isFetchingInfo ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <ArrowDown className="w-5 h-5 mr-2" />
                  Download
                </>
              )}
            </button>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer select-none group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isAudioMode}
                  onChange={(e) => setIsAudioMode(e.target.checked)}
                />
                <div className={clsx("block w-10 h-6 rounded-full transition-colors", isAudioMode ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700")}></div>
                <div className={clsx("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", isAudioMode ? "transform translate-x-4" : "")}></div>
              </div>
              <div className="ml-3 flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <Music className="w-4 h-4 mr-2" />
                <span>Audio Only Mode (Extract MP3, FLAC, M4A, etc.)</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(['All', DownloadStatus.Downloading, DownloadStatus.Queued, DownloadStatus.Completed] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === tab
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {tab === DownloadStatus.Downloading ? 'Active' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400" title="Clear Completed">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <ArrowDown className="w-16 h-16 mb-4 opacity-20" />
            <p className="mt-4 text-sm font-medium">No downloads in this section</p>
            <p className="text-xs text-slate-500 mt-1">Paste a URL above to get started</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <DownloadCard
              key={task.id}
              task={task}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onOpenFolder={handleOpenFolder}
            />
          ))
        )}
      </div>

      {/* Playlist Preview Modal */}
      {showPlaylistModal && currentPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-4">
                <img src={currentPlaylist.thumbnail} alt={currentPlaylist.title} className="w-32 h-18 object-cover rounded-lg" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <List className="w-5 h-5 text-brand-500" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{currentPlaylist.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{currentPlaylist.channel}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <span>{currentPlaylist.trackCount} tracks</span>
                    <span>•</span>
                    <span>{currentPlaylist.totalSize}</span>
                  </div>
                </div>
              </div>

              {/* Track Selection Controls */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={selectAllTracks}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllTracks}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  Deselect All
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                  {selectedTracks.size} of {currentPlaylist.trackCount} selected
                </span>
              </div>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {currentPlaylist.tracks.map((track) => (
                <label
                  key={track.id}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                    selectedTracks.has(track.id)
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex-shrink-0">
                    {selectedTracks.has(track.id) ? (
                      <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <img src={track.thumbnail} alt={track.title} className="w-20 h-11 object-cover rounded" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{track.index}. {track.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{track.duration}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedTracks.has(track.id)}
                    onChange={() => toggleTrackSelection(track.id)}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => { setShowPlaylistModal(false); setSelectedTracks(new Set()); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startPlaylistDownload}
                disabled={selectedTracks.size === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download {selectedTracks.size} Track{selectedTracks.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Selection Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Format</h3>
                {isAudioMode && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
                    Audio Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose the quality for your download.</p>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {detectedFormats.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No compatible formats found for this mode.</p>
                  </div>
                ) : (
                  detectedFormats.map((format) => (
                    <label
                      key={format.id}
                      className={clsx(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        selectedFormatId === format.id
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value={format.id}
                          checked={selectedFormatId === format.id}
                          onChange={() => setSelectedFormatId(format.id)}
                          className="w-4 h-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                        />
                        <div className="ml-3">
                          <div className="flex items-center space-x-2">
                            <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                              {format.quality}
                            </span>
                            {!format.isVideo && (
                              <Music className="w-3 h-3 text-brand-500" />
                            )}
                          </div>
                          <span className="block text-xs text-slate-500">
                            {format.format}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                        {format.size}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowFormatModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startDownload}
                disabled={detectedFormats.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Downloads;