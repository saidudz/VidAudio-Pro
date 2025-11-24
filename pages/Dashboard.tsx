import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Download, HardDrive, Zap, Clock } from 'lucide-react';

// Data will be fetched from backend
const defaultActivity = [
  { name: 'Mon', downloads: 0 },
  { name: 'Tue', downloads: 0 },
  { name: 'Wed', downloads: 0 },
  { name: 'Thu', downloads: 0 },
  { name: 'Fri', downloads: 0 },
  { name: 'Sat', downloads: 0 },
  { name: 'Sun', downloads: 0 },
];

const dataDisk = [
  { name: 'Used', value: 420, color: '#0ea5e9' }, // Brand 500
  { name: 'Free', value: 580, color: '#e2e8f0' }, // Slate 200
];

const dataNetwork = [
  { time: '10:00', mbps: 12 },
  { time: '10:05', mbps: 25 },
  { time: '10:10', mbps: 18 },
  { time: '10:15', mbps: 45 },
  { time: '10:20', mbps: 30 },
  { time: '10:25', mbps: 55 },
  { time: '10:30', mbps: 40 },
];

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; colorClass: string }> = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    downloadedToday: '0 MB',
    freeSpace: 'Calculating...',
    currentSpeed: '0 B/s',
    activeDownloads: 0,
    usedSpace: '0 GB',
    totalSpace: '0 GB',
    activity: defaultActivity
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.getDashboardStats();
        if (result.success && result.stats) {
          setStats(result.stats);
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const diskData = [
    { name: 'Used', value: parseFloat(stats.usedSpace) || 0, color: '#0ea5e9' },
    { name: 'Free', value: parseFloat(stats.freeSpace) || 1, color: '#e2e8f0' },
  ];
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Downloaded Today"
          value={stats.downloadedToday}
          icon={Download}
          colorClass="bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
        />
        <StatCard
          title="Free Space"
          value={stats.freeSpace}
          icon={HardDrive}
          colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          title="Current Speed"
          value={stats.currentSpeed}
          icon={Zap}
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatCard
          title="Active Tasks"
          value={stats.activeDownloads.toString()}
          icon={Clock}
          colorClass="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Download Activity</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.activity || defaultActivity}>
                <defs>
                  <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#bae6fd' }}
                />
                <Area type="monotone" dataKey="downloads" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorDownloads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 self-start">Disk Usage</h3>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {diskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.round((parseFloat(stats.usedSpace) / (parseFloat(stats.totalSpace) || 1)) * 100)}%
              </span>
              <span className="text-xs text-slate-500">Used</span>
            </div>
          </div>
          <div className="w-full mt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-brand-500 mr-2"></span>
                Used Space
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{stats.usedSpace}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600 mr-2"></span>
                Free Space
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{stats.freeSpace}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Performance (Bottom) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Network Speed (Last 30 mins)</h3>
          <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded font-medium">Stable</span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataNetwork}>
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }} />
              <Bar dataKey="mbps" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;