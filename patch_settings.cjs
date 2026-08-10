const fs = require('fs');

const code = `import React, { useState } from 'react';
import { Settings as SettingsIcon, Languages, Save, Trash2, LogOut, LogIn, HardDrive } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth, getAccessToken, signIn, signOut } from '../contexts/AuthContext';
import { saveToDrive, loadFromDrive } from '../lib/driveSync';

export default function Settings() {
  const { language, setLanguage, clearAllData } = useStore();
  const { user } = useAuth();
  
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-xl">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-normal text-[var(--color-on-surface)] tracking-tight">Settings</h2>
      </div>
      
      <div className="space-y-6">
        {/* Language Settings */}
        <section className="bg-[var(--color-surface)] rounded-3xl p-6 md:p-8 border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-xl font-semibold text-[var(--color-on-surface)]">Language Preference</h3>
          </div>
          <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">Choose your preferred language for the application interface and tests.</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setLanguage('en')}
              className={\`flex-1 py-3 px-4 rounded-xl border-2 transition-all \${language === 'en' ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}\`}
            >
              <span className="font-medium">English</span>
            </button>
            <button 
              onClick={() => setLanguage('hi')}
              className={\`flex-1 py-3 px-4 rounded-xl border-2 transition-all \${language === 'hi' ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}\`}
            >
              <span className="font-medium">हिंदी (Hindi)</span>
            </button>
          </div>
        </section>

        {/* Sync Settings */}
        <section className="bg-[var(--color-surface)] rounded-3xl p-6 md:p-8 border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-xl font-semibold text-[var(--color-on-surface)]">Google Drive Sync</h3>
          </div>
          
          {!user ? (
             <div className="bg-[var(--color-surface-container)] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                   <p className="font-medium text-[var(--color-on-surface)]">Not signed in</p>
                   <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Sign in to sync your data across devices.</p>
                </div>
                <button 
                  onClick={signIn}
                  className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
             </div>
          ) : (
            <div className="space-y-4">
               <div className="bg-[var(--color-surface-container)] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                     <p className="font-medium text-[var(--color-on-surface)]">Signed in as {user.name}</p>
                     <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{user.email}</p>
                  </div>
                  <button 
                    onClick={signOut}
                    className="border border-[var(--color-outline)] text-[var(--color-on-surface)] px-6 py-2.5 rounded-full font-medium hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-4">
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
        <section className="bg-red-50 rounded-3xl p-6 md:p-8 border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="text-xl font-semibold text-red-900">Danger Zone</h3>
          </div>
          <p className="text-red-700 text-sm mb-6">Clearing data will remove all your imported tests, attempts, and SRS history from this device.</p>
          
          {showClearConfirm ? (
             <div className="bg-white p-4 rounded-xl border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
`;

fs.writeFileSync('src/pages/Settings.tsx', code);
