import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Trash2, LogOut, LogIn, HardDrive } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth, getAccessToken } from '../contexts/AuthContext';
import { saveToDrive, loadFromDrive } from '../lib/driveSync';

export default function Settings() {
  const { clearAllData } = useStore();
  const { user, signInWithGoogle, signOut } = useAuth();
  
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleForceSync = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSyncStatus('Saving to Google Drive...');
    const state = useStore.getState();
    await saveToDrive(token, state);
    setTimeout(() => {
      setSyncStatus('Data successfully synced to Google Drive!');
      setTimeout(() => setSyncStatus(''), 3000);
    }, 2000); // Give it some time since saveToDrive is debounced internally
  };
  
  const handleForceLoad = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSyncStatus('Loading from Google Drive...');
    await loadFromDrive(token);
    setSyncStatus('Data successfully loaded from Google Drive!');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-xl">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-normal text-[var(--color-on-surface)] tracking-tight">Settings</h2>
      </div>
      
      <div className="space-y-3">
        

        {/* Sync Settings */}
        <section className="bg-[var(--color-surface)] rounded-xl p-3 md:p-3 border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <HardDrive className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-base font-semibold text-[var(--color-on-surface)]">Google Drive Sync</h3>
          </div>
          
          {!user ? (
             <div className="bg-[var(--color-surface-container)] p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                   <p className="font-medium text-[var(--color-on-surface)]">Not signed in</p>
                   <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Sign in to sync your data across devices.</p>
                </div>
                <button 
                  onClick={signInWithGoogle}
                  className="gsi-material-button relative flex items-center justify-center bg-white border border-[#dadce0] rounded text-[#3c4043] font-medium text-sm h-10 px-3 hover:bg-[#f8fafc] focus:outline-none transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] block">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>Sign in with Google</span>
                  </div>
                </button>
             </div>
          ) : (
            <div className="space-y-3">
               <div className="bg-[var(--color-surface-container)] p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                     <p className="font-medium text-[var(--color-on-surface)]">Signed in as {user.displayName}</p>
                  </div>
                  <button 
                    onClick={signOut}
                    className="border border-[var(--color-outline)] text-[var(--color-on-surface)] px-6 py-2.5 rounded-full font-medium hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-3">
                 <button 
                   onClick={handleForceSync}
                   className="flex-1 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-6 py-3 rounded-xl font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                 >
                   <Save className="w-4 h-4" /> Backup to Drive
                 </button>
                 <button 
                   onClick={handleForceLoad}
                   className="flex-1 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-6 py-3 rounded-xl font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                 >
                   <HardDrive className="w-4 h-4" /> Load from Drive
                 </button>
               </div>
               
               {syncStatus && (
                 <p className="text-sm font-medium text-emerald-600 text-center animate-fade-in">{syncStatus}</p>
               )}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 rounded-xl p-3 md:p-3 border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-semibold text-red-900">Danger Zone</h3>
          </div>
          <p className="text-red-700 text-sm mb-3">Clearing data will remove all your imported tests, attempts, and SRS history from this device.</p>
          
          {showClearConfirm ? (
             <div className="bg-white p-3 rounded-xl border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="font-medium text-red-800">Are you absolutely sure?</p>
                <div className="flex gap-3">
                   <button 
                     onClick={() => setShowClearConfirm(false)}
                     className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleClearData}
                     className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                   >
                     Yes, Clear Data
                   </button>
                </div>
             </div>
          ) : (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-100 text-red-700 border border-red-200 px-6 py-3 rounded-xl font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Clear All Local Data
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
