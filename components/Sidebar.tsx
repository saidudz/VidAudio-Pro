import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Download, History, Key, Settings, Github, Bug } from 'lucide-react';
import clsx from 'clsx';
import logo from '../assets/logo.png';

const Sidebar: React.FC = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Download, label: 'Downloads', path: '/downloads' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-colors duration-200">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 overflow-hidden">
          <img src={logo} alt="VidAudio Pro Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">
            VidAudio Pro
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">v2.4.0</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Support</h3>
        <div className="space-y-1">
          <a
            href="https://github.com/saidudz/VidAudio-Pro.git"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repo</span>
          </a>
          <a
            href="https://discord.com/channels/1442115050197221408/1442115255135240284"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Bug className="w-4 h-4" />
            <span>Report Bug</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;