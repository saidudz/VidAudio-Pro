import React from 'react';
import { MOCK_ACCOUNTS } from '../constants';
import { Plus, LogOut, CheckCircle, XCircle } from 'lucide-react';

const Keyring: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Accounts & Sessions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage logins for premium downloads.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_ACCOUNTS.map((account) => (
          <div key={account.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm relative group hover:border-brand-500 dark:hover:border-brand-500 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                 <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                    {account.avatarUrl ? (
                        <img src={account.avatarUrl} alt={account.platform} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xl font-bold text-slate-400">{account.platform[0]}</span>
                    )}
                 </div>
                 <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{account.platform}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{account.isLoggedIn ? account.username : 'Not connected'}</p>
                 </div>
              </div>
              <div className="flex items-center">
                 {account.isLoggedIn ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                 ) : (
                    <XCircle className="w-5 h-5 text-slate-400" />
                 )}
              </div>
            </div>
            
            <div className="mt-6 flex space-x-2">
                {account.isLoggedIn ? (
                     <button className="flex-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center justify-center">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                     </button>
                ) : (
                    <button className="flex-1 px-3 py-2 text-sm text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        Log in
                     </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Keyring;