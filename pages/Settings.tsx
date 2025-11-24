import React, { useState } from 'react';
import { Save, Folder } from 'lucide-react';

const Settings: React.FC = () => {
  const [downloadFolder, setDownloadFolder] = useState('C:\\Users\\Admin\\Downloads\\VidAudio');
  const [language, setLanguage] = useState('English');
  const [defaultFormat, setDefaultFormat] = useState('Ask every time');
  const [speedLimit, setSpeedLimit] = useState(false);
  const [autoShutdown, setAutoShutdown] = useState(false);
  const [clipboardMonitor, setClipboardMonitor] = useState(true);

  const handleBrowseFolder = async () => {
    // Check if we're in Electron environment
    if (window.electronAPI) {
      // Use IPC to open folder selection dialog
      const result = await window.electronAPI.selectFolder();
      if (result) setDownloadFolder(result);
    } else {
      // Fallback for web/development
      const newPath = prompt('Enter download folder path:', downloadFolder);
      if (newPath) {
        setDownloadFolder(newPath);
      }
    }
  };

  const handleSave = () => {
    alert('Settings saved! (This will persist to electron-store in production)');
    // Future: Save to electron-store or local storage
    console.log('Saving settings:', {
      downloadFolder,
      language,
      defaultFormat,
      speedLimit,
      autoShutdown,
      clipboardMonitor
    });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure download behavior and app appearance.</p>
      </div>

      <div className="space-y-6">
        {/* General Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">General</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Default Download Folder
              </label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={downloadFolder}
                  className="flex-1 block w-full rounded-l-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-500 sm:text-sm px-3 py-2"
                />
                <button
                  onClick={handleBrowseFolder}
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-lg bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Browse
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                >
                  <option>English</option>
                  <option>Arabic</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Default Format
                </label>
                <select
                  value={defaultFormat}
                  onChange={(e) => setDefaultFormat(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                >
                  <option>Ask every time</option>
                  <option>Best Video (MP4)</option>
                  <option>Best Audio (MP3)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Network & Performance */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Network & Scheduler</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Speed Limit</div>
                <div className="text-xs text-slate-500">Limit download speed to save bandwidth</div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={speedLimit}
                  onChange={(e) => setSpeedLimit(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Auto-Shutdown</div>
                <div className="text-xs text-slate-500">Shutdown PC when all downloads complete</div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoShutdown}
                  onChange={(e) => setAutoShutdown(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Clipboard Monitor</div>
                <div className="text-xs text-slate-500">Automatically detect URLs in clipboard</div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={clipboardMonitor}
                  onChange={(e) => setClipboardMonitor(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="flex items-center px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;