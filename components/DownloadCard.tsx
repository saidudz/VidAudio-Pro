import React from 'react';
import { DownloadTask, DownloadStatus } from '../types';
import { Play, Pause, X, FileVideo, FileAudio, FolderOpen, RefreshCw, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface DownloadCardProps {
  task: DownloadTask;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onOpenFolder: (id: string) => void;
}

const DownloadCard: React.FC<DownloadCardProps> = ({ task, onPause, onResume, onCancel, onRetry, onOpenFolder }) => {
  const isCompleted = task.status === DownloadStatus.Completed;
  const isFailed = task.status === DownloadStatus.Failed;
  const isPaused = task.status === DownloadStatus.Paused;
  const isDownloading = task.status === DownloadStatus.Downloading;

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img src={task.thumbnail} alt={task.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            {task.selectedFormat.isVideo ? <FileVideo className="text-white/80 w-6 h-6" /> : <FileAudio className="text-white/80 w-6 h-6" />}
          </div>
          {isCompleted && (
            <div className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              {task.selectedFormat.quality}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate pr-4" title={task.title}>
                {task.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                  {task.selectedFormat.format}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {task.totalSize}
                </span>
                {isFailed && (
                  <span className="text-xs text-red-500 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {task.errorMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {isDownloading && (
                <button onClick={() => onPause(task.id)} className="p-1.5 text-slate-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <Pause className="w-4 h-4" />
                </button>
              )}
              {isPaused && (
                <button onClick={() => onResume(task.id)} className="p-1.5 text-slate-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <Play className="w-4 h-4" />
                </button>
              )}
              {isFailed && (
                <button onClick={() => onRetry(task.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              {isCompleted && (
                 <button onClick={() => onOpenFolder(task.id)} className="p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-full transition-colors">
                  <FolderOpen className="w-4 h-4" />
                </button>
              )}
              {!isCompleted && (
                <button onClick={() => onCancel(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {!isCompleted && !isFailed && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>{task.status === DownloadStatus.Queued ? 'Waiting...' : `${task.progress}%`}</span>
                <span className="font-mono">{task.speed} &bull; {task.eta} left</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-300",
                    isPaused ? "bg-amber-400" : "bg-brand-500"
                  )}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {isCompleted && (
             <div className="mt-3 text-xs text-green-600 dark:text-green-400 flex items-center font-medium">
                Download successful
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadCard;