import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, HardDrive, Download, Trash2, RefreshCw, CheckCircle2, FileJson, Folder, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import { DriveBackupFile } from '../lib/googleDriveSync';
import { formatDate } from '../lib/dateUtils';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTest?: (fileId: string) => void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectTest,
}) => {
  const {
    isConnected,
    isConnecting,
    isSyncing,
    files,
    connect,
    refreshFiles,
    importTest,
    restoreFromDrive,
    deleteFile,
  } = useGoogleDrive();

  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);

  if (!isOpen) return null;

  const handleImport = async (file: DriveBackupFile) => {
    if (file.isFullBackup) {
      setRestoringBackup(true);
      await restoreFromDrive();
      setRestoringBackup(false);
      onClose();
    } else {
      setLoadingFileId(file.id);
      await importTest(file.id);
      setLoadingFileId(null);
      if (onSelectTest) onSelectTest(file.id);
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this file from your Google Drive folder?')) return;
    setDeletingFileId(fileId);
    await deleteFile(fileId);
    setDeletingFileId(null);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Google Drive App Storage</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500 inline" />
                  <span>Folder: <strong>Mockly App Data</strong></span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <button
                  onClick={() => refreshFiles()}
                  disabled={isSyncing}
                  title="Refresh Files"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
            {!isConnected ? (
              <div className="text-center py-8 px-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                  <HardDrive className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Connect Your Google Drive</h4>
                <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
                  Store and load your test papers, question banks, and progress directly in your personal Google Drive with 100% privacy and free quota.
                </p>

                <button
                  onClick={() => connect()}
                  disabled={isConnecting}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center gap-2.5 disabled:opacity-60"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Connect Google Drive</span>
                </button>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FileJson className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No files in your Google Drive folder yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Export any test from the Question Bank or create a full backup in Settings to view them here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Files in Drive ({files.length})
                </p>
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleImport(file)}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          file.isFullBackup
                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                      >
                        {file.isFullBackup ? (
                          <HardDrive className="w-4 h-4" />
                        ) : (
                          <FileJson className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700 transition-colors">
                            {file.name.replace('.json', '')}
                          </h4>
                          {file.isFullBackup && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                              Full Backup
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {file.size && <span>{file.size}</span>}
                          {file.modifiedTime && (
                            <>
                              <span>•</span>
                              <span>Modified: {formatDate(file.modifiedTime)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDelete(e, file.id)}
                        disabled={deletingFileId === file.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete from Google Drive"
                      >
                        {deletingFileId === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        {loadingFileId === file.id || (file.isFullBackup && restoringBackup) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{file.isFullBackup ? 'Restore' : 'Import'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>All files are stored in your Google Drive free quota</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
