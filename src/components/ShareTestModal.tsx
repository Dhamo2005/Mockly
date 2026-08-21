import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Link2, Globe, Lock, Check, Copy, Shield, Sparkles, 
  ExternalLink, UserCheck, PlayCircle, Eye, Info
} from 'lucide-react';
import { Test } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { updateTestSharingInFirestore } from '../lib/firebaseSync';

interface ShareTestModalProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareTestModal({ test, isOpen, onClose }: ShareTestModalProps) {
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState<'details' | 'direct' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!isOpen || !test) return null;

  const isOwner = !test.ownerId || (user && test.ownerId === user.uid);
  const currentVisibility = test.visibility || (test.isPublic === false ? 'private' : 'public');
  const isPublic = currentVisibility === 'public' || currentVisibility === 'unlisted';

  // Construct absolute sharing links
  const origin = window.location.origin;
  const detailsUrl = `${origin}/test-details/${test.id}`;
  const directTestUrl = `${origin}/test/${test.id}`;

  const handleCopy = async (type: 'details' | 'direct', url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(type);
      setCopyFeedback(type === 'direct' ? 'Direct exam link copied!' : 'Test details link copied!');
      setTimeout(() => {
        setCopiedLink(null);
        setCopyFeedback(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  const handleVisibilityChange = async (newVisibility: 'public' | 'private') => {
    if (!user || !isOwner) return;
    setIsUpdating(true);
    try {
      await updateTestSharingInFirestore(
        user.uid,
        test.id,
        newVisibility,
        newVisibility === 'public',
        {
          ownerName: user.displayName || 'Creator',
          ownerEmail: user.email || ''
        }
      );
    } catch (e) {
      console.error('Error changing visibility:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Dialog Window (Google Drive style) */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden z-10 flex flex-col font-sans"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Share Mock Test</h2>
                <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-xs">{test.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Owner Details Card */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                People with access
              </label>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Owner" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (user?.displayName?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {isOwner ? (user?.displayName || 'You') : (test.ownerName || 'Test Creator')}
                      </span>
                      {isOwner && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {isOwner ? (user?.email || '') : (test.ownerEmail || 'Shared via Firebase')}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  Owner
                </span>
              </div>
            </div>

            {/* General Access Section (Google Drive Model) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                General access
              </label>
              
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-2xl mt-0.5 shrink-0 ${
                    isPublic 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        {isOwner ? (
                          <select
                            value={isPublic ? 'public' : 'private'}
                            disabled={isUpdating}
                            onChange={(e) => handleVisibilityChange(e.target.value as 'public' | 'private')}
                            className="text-xs font-bold text-slate-800 bg-slate-100/80 hover:bg-slate-100 border border-slate-300/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="public">🌐 Anyone with the link</option>
                            <option value="private">🔒 Restricted (Only You)</option>
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-slate-800">
                            {isPublic ? '🌐 Anyone with the link' : '🔒 Restricted'}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                        Test Taker / Candidate
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {isPublic 
                        ? 'Anyone on the internet who has this link can view the test overview and take the mock exam.'
                        : 'Only you can view and attempt this test paper. Other users cannot open the link.'
                      }
                    </p>
                  </div>
                </div>

                {!isOwner && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Only the test creator can change this test’s sharing permissions.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Copy Links Bar */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Shareable Links
              </label>

              {/* Option 1: Test Details & Overview Link */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                  <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-700 block">Test Details Page</span>
                    <span className="text-[11px] text-slate-400 font-mono truncate block">{detailsUrl}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('details', detailsUrl)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    copiedLink === 'details'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                  }`}
                >
                  {copiedLink === 'details' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Direct Exam Launch Link */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                  <PlayCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-700 block">Direct Exam Start Link</span>
                    <span className="text-[11px] text-slate-400 font-mono truncate block">{directTestUrl}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('direct', directTestUrl)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    copiedLink === 'direct'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                  }`}
                >
                  {copiedLink === 'direct' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {copyFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{copyFeedback}</span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Synced securely with Firebase</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
