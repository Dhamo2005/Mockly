import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings as SettingsIcon, Save, Trash2, LogOut, LogIn, HardDrive, ShieldAlert } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth, getAccessToken } from '../contexts/AuthContext';
import { saveSQLiteToDrive, loadSQLiteFromDrive } from '../lib/sqliteDriveSync';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const { clearAllData, clearTests, clearAttempts, tests, attempts } = useStore();
  const { user, isSigningIn, signInWithGoogle, signOut } = useAuth();
  
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'all' | 'tests' | 'attempts' | null>(null);

  const handleForceSync = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSyncStatus('Saving SQLite Database to Google Drive...');
    const state = useStore.getState();
    await saveSQLiteToDrive(token, state, true);
    setSyncStatus('SQLite Database successfully synced to Google Drive!');
    setTimeout(() => setSyncStatus(''), 3000);
  };
  
  const handleForceLoad = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSyncStatus('Loading SQLite Database from Google Drive...');
    await loadSQLiteFromDrive(token);
    setSyncStatus('SQLite Database successfully loaded from Google Drive!');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      <div className="pt-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account and preferences.</p>
      </div>
      
      <div className="space-y-6">
        {/* Sync Settings */}
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Cloud Sync</h3>
          </div>
          
          {!user ? (
             <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                   <p className="font-bold text-slate-800">Not signed in</p>
                   <p className="text-sm text-slate-500 mt-1">Sign in to securely sync your data across devices.</p>
                </div>
                <motion.button 
                  whileHover={{ scale: isSigningIn ? 1 : 1.02 }}
                  whileTap={{ scale: isSigningIn ? 1 : 0.98 }}
                  onClick={signInWithGoogle}
                  disabled={isSigningIn}
                  className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm px-5 py-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  <span>Continue with Google</span>
                </motion.button>
             </div>
          ) : (
            <div className="space-y-4">
               <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                     <p className="font-bold text-slate-800">{user.displayName}</p>
                     <p className="text-sm text-slate-500 mt-1">{user.displayName}</p>
                  </div>
                  <button 
                    onClick={signOut}
                    className="w-full sm:w-auto border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-white hover:text-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-3">
                 <motion.button 
                   whileHover={{ scale: 1.01 }}
                   whileTap={{ scale: 0.99 }}
                   onClick={handleForceSync}
                   className="flex-1 bg-slate-800 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
                 >
                   <Save className="w-5 h-5" /> Backup to Drive
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.01 }}
                   whileTap={{ scale: 0.99 }}
                   onClick={handleForceLoad}
                   className="flex-1 bg-blue-50 text-blue-700 px-6 py-4 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200/50"
                 >
                   <HardDrive className="w-5 h-5" /> Restore Backup
                 </motion.button>
               </div>
               
               <AnimatePresence>
                 {syncStatus && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="bg-green-50 text-green-700 p-4 rounded-xl text-center text-sm font-bold border border-green-200/50"
                   >
                     {syncStatus}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          )}
        </section>

        {/* Data Management & Danger Zone */}
        <section className="bg-red-50/70 rounded-2xl p-6 md:p-8 border border-red-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldAlert className="w-24 h-24 text-red-600" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-red-900">Record Management & Danger Zone</h3>
            </div>
            
            <p className="text-red-700 text-sm mb-6 max-w-lg leading-relaxed">
              Selectively delete specific categories of data, or perform a complete purge of all local storage and cached databases.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-4 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Test Papers</h4>
                  <p className="text-xs text-slate-500">{tests.length} tests in bank</p>
                </div>
                <button
                  onClick={() => setConfirmAction('tests')}
                  disabled={tests.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Clear Tests
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Attempt History</h4>
                  <p className="text-xs text-slate-500">{attempts.length} attempts recorded</p>
                </div>
                <button
                  onClick={() => setConfirmAction('attempts')}
                  disabled={attempts.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>

            <button 
              onClick={() => setConfirmAction('all')}
              className="w-full bg-red-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <Trash2 className="w-5 h-5" /> Purge & Clear All Local Data
            </button>
          </div>
        </section>

      {/* Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {confirmAction && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative z-10"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {confirmAction === 'all' && 'Purge All Local Data?'}
                  {confirmAction === 'tests' && 'Clear All Test Papers?'}
                  {confirmAction === 'attempts' && 'Clear Attempt History?'}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {confirmAction === 'all' && 'Are you sure you want to permanently delete all test papers, attempts, and cached SQLite database files?'}
                  {confirmAction === 'tests' && 'Are you sure you want to remove all imported test papers and associated attempts?'}
                  {confirmAction === 'attempts' && 'Are you sure you want to clear your test score history and analytics?'}
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmAction === 'all') clearAllData();
                      if (confirmAction === 'tests') clearTests();
                      if (confirmAction === 'attempts') clearAttempts();
                      setConfirmAction(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm text-sm"
                  >
                    Yes, Confirm Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      </div>
    </motion.div>
  );
}
