import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Globe, DownloadCloud, Trash2 } from 'lucide-react';
import { Ripple } from '../components/Ripple';

export default function Tests() {
  const { tests, deleteTest } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'imported' | 'online'>('imported');

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--color-on-surface)]">Mock Tests</h2>
      </div>

      <div className="flex border-b border-[var(--color-outline-variant)]">
        <button
          onClick={() => setActiveTab('imported')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'imported' ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}`}
        >
          <DownloadCloud className="w-4 h-4" />
          Imported Tests
          {activeTab === 'imported' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('online')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'online' ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}`}
        >
          <Globe className="w-4 h-4" />
          Online Tests
          {activeTab === 'online' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
          )}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'imported' && (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={`${test.id}-${index}`} className="bg-[var(--color-surface)] p-3 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-shadow hover:shadow-md border border-[var(--color-outline-variant)]">
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] cursor-pointer hover:text-[var(--color-primary)] hover:underline" onClick={() => navigate(`/test-details/${test.id}`)}>{test.title}</h4>
                  <p className="text-sm text-[var(--color-on-surface-variant)] line-clamp-1 mt-1">{test.description}</p>
                  <div className="flex gap-3 mt-3">
                    <span className="text-xs font-medium text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-3 py-1 rounded-full">
                      {test.questions.length} Questions
                    </span>
                    <span className="text-xs font-medium text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-3 py-1 rounded-full">
                      {Math.floor(test.timeLimit / 60)} Mins
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteTest(test.id)}
                    className="p-2.5 text-[var(--color-on-surface-variant)] hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                    title="Delete Test"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/test-details/${test.id}`)}
                    className="relative overflow-hidden flex-shrink-0 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] px-6 py-2.5 rounded-full hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    View Details
                    <Ripple color="bg-white/30" />
                  </button>
                </div>
              </div>
            ))}
            {tests.length === 0 && (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-xl bg-white">
                <DownloadCloud className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium text-gray-900">No mock tests available.</p>
                <p className="text-sm mt-1">Import some from the Question Bank.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'online' && (
          <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-outline-variant)]">
            <Globe className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-[var(--color-on-surface)]">Online Tests</h3>
            <p className="text-[var(--color-on-surface-variant)] mt-2 max-w-sm mx-auto">
              Connect to our online repository to discover and take new tests directly from the cloud. Coming soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
