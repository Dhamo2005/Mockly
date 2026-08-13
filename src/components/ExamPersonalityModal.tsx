import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Test } from '../types';
import { Award, Check, ShieldCheck, ShieldAlert, Sparkles, Sliders, X, Clock } from 'lucide-react';

export interface ExamPreset {
  id: string;
  name: string;
  category: string;
  positiveMarks: number;
  negativeMarks: number;
  badge: string;
  description: string;
}

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'ssc',
    name: 'SSC CGL / CHSL / CPO',
    category: 'SSC CGL',
    positiveMarks: 2.0,
    negativeMarks: 0.5,
    badge: '+2.0 / -0.50 Penalty',
    description: 'Standard 2 marks for correct answers with 0.50 (25%) deduction for wrong answers.'
  },
  {
    id: 'upsc',
    name: 'UPSC / Banking / Civil Services',
    category: 'UPSC / Banking',
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    badge: '+1.0 / -0.25 Penalty',
    description: '1 mark for correct answers with 0.25 (25%) deduction for incorrect responses.'
  },
  {
    id: 'jee',
    name: 'JEE Main / NEET / NTA Exams',
    category: 'JEE / NEET',
    positiveMarks: 4.0,
    negativeMarks: 1.0,
    badge: '+4.0 / -1.00 Penalty',
    description: '4 marks per question with 1 mark (25%) deduction for wrong answers.'
  },
  {
    id: 'no_negative',
    name: 'State Exams / CTET / Quiz (No Negative Marks)',
    category: 'No Negative Marks',
    positiveMarks: 1.0,
    negativeMarks: 0.0,
    badge: '+1.0 / No Penalty',
    description: 'Zero penalty for wrong answers! Perfect for exams without negative marking.'
  },
  {
    id: 'custom',
    name: 'Custom Marking Scheme',
    category: 'Custom Scheme',
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    badge: 'Custom Rules',
    description: 'Manually specify positive marks and negative penalty per question.'
  }
];

interface ExamPersonalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test;
  onSave: (updatedFields: { examCategory?: string; positiveMarks: number; negativeMarks: number; settings?: any; sections?: any[]; timeLimit?: number }) => void;
}

export function ExamPersonalityModal({ isOpen, onClose, test, onSave }: ExamPersonalityModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [examCategory, setExamCategory] = useState<string>('');
  const [positiveMarks, setPositiveMarks] = useState<number>(1.0);
  const [negativeMarks, setNegativeMarks] = useState<number>(0.25);
  const [strictSectionalTiming, setStrictSectionalTiming] = useState<boolean>(false);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && test) {
      const pos = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
      const neg = test.negativeMarks ?? (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
      
      setPositiveMarks(pos);
      setNegativeMarks(neg);
      setStrictSectionalTiming(test.settings?.strictSectionalTiming === true);
      
      let initialSections = test.sections || [];
      if (initialSections.length === 0 && test.questions && test.questions.length > 0) {
        const sectionsMap = new Map<string, number>();
        test.questions.forEach(q => {
          const sec = q.section || 'General Section';
          sectionsMap.set(sec, (sectionsMap.get(sec) || 0) + 1);
        });
        initialSections = Array.from(sectionsMap.entries()).map(([name, count], index) => ({
          name,
          timeLimit: Math.floor((test.timeLimit || 3600) / sectionsMap.size),
          order: index + 1,
          questionCount: count,
          questionIds: test.questions.filter(q => q.section === name).map(q => q.id) || []
        }));
      }
      setSections(initialSections);

      setExamCategory(test.examCategory || 'General Exam');

      // Match against standard presets
      const matched = EXAM_PRESETS.find(p => p.id !== 'custom' && p.positiveMarks === pos && p.negativeMarks === neg);
      if (matched) {
        setSelectedPresetId(matched.id);
      } else {
        setSelectedPresetId('custom');
      }
    }
  }, [isOpen, test]);

  const handleSelectPreset = (preset: ExamPreset) => {
    setSelectedPresetId(preset.id);
    setPositiveMarks(preset.positiveMarks);
    setNegativeMarks(preset.negativeMarks);
    if (preset.id !== 'custom') {
      setExamCategory(preset.category);
    }
  };

  const handleToggleNoNegative = () => {
    if (negativeMarks === 0) {
      setNegativeMarks(0.25);
      setSelectedPresetId('custom');
    } else {
      setNegativeMarks(0);
      setSelectedPresetId('no_negative');
      setExamCategory('No Negative Marks');
    }
  };

  const handleSave = () => {
    onSave({
      examCategory: examCategory.trim() || 'General Exam',
      positiveMarks: Math.max(0.1, Number(positiveMarks) || 1.0),
      negativeMarks: Math.max(0, Number(negativeMarks) || 0),
      settings: { ...test.settings, strictSectionalTiming },
      sections: sections,
      timeLimit: strictSectionalTiming ? sections.reduce((acc, s) => acc + s.timeLimit, 0) : test.timeLimit
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden relative z-10 my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Sparkles className="w-4 h-4" />
              <span>Exam Personality & Scheme Settings</span>
            </div>

            <h2 className="text-2xl font-black mt-1 text-white tracking-tight">
              Configure Test Marking Rules
            </h2>
            <p className="text-xs text-blue-100 mt-1 line-clamp-1">
              {test?.title}
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Presets Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Choose Exam Preset / Personality
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXAM_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm leading-tight">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 ml-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className={`font-semibold px-2 py-0.5 rounded-md ${
                          preset.negativeMarks === 0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {preset.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick No Negative Marking Toggle */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  negativeMarks === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {negativeMarks === 0 ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {negativeMarks === 0 ? 'No Negative Penalty Enabled' : 'Enable No Negative Marking'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {negativeMarks === 0 ? 'Incorrect answers will deduct 0 marks.' : 'Toggle on for exams where wrong answers lose no points.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleNoNegative}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  negativeMarks === 0 ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    negativeMarks === 0 ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            
            {/* Strict Sectional Timing Toggle */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  strictSectionalTiming ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {strictSectionalTiming ? 'Strict Sectional Timing Enabled' : 'Enable Strict Sectional Timing'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {strictSectionalTiming ? 'Sections lock when time expires. No jumping back.' : 'Toggle on to enforce mandatory time limits per section.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStrictSectionalTiming(!strictSectionalTiming)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  strictSectionalTiming ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    strictSectionalTiming ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            
            {/* Section Timing Configuration */}
            {strictSectionalTiming && sections.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Section Timing (Minutes)</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sections.map((section, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-600 truncate" title={typeof section.name === 'string' ? section.name : 'Section'}>
                        {typeof section.name === 'string' ? section.name : 'Section'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={Math.round(section.timeLimit / 60)}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          const newSections = [...sections];
                          newSections[idx].timeLimit = val * 60;
                          setSections(newSections);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Values Adjustment */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Custom Scheme Numerical Tuning</span>
                </h4>
                {selectedPresetId !== 'custom' && (
                  <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    Preset Values Loaded
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Positive Marks (+ per question)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.1"
                    max="100"
                    value={positiveMarks}
                    onChange={(e) => {
                      setPositiveMarks(parseFloat(e.target.value) || 0);
                      setSelectedPresetId('custom');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Negative Penalty (- per question)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="100"
                    value={negativeMarks}
                    onChange={(e) => {
                      setNegativeMarks(parseFloat(e.target.value) || 0);
                      setSelectedPresetId('custom');
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                      negativeMarks === 0 
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50/30' 
                        : 'border-slate-200 text-rose-700 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Exam Label / Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL, Banking, Railway RRB NTPC, Custom"
                  value={examCategory}
                  onChange={(e) => setExamCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Impact Preview */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-2xl text-white shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  Simulated Scoring Impact
                </span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                  negativeMarks === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}>
                  {negativeMarks === 0 ? 'No Negative Penalty Mode' : `Penalty: -${negativeMarks} per wrong`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/10 text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">10 Correct</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">
                    +{(10 * positiveMarks).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">10 Incorrect</p>
                  <p className={`text-sm font-black mt-0.5 ${negativeMarks === 0 ? 'text-slate-300' : 'text-rose-400'}`}>
                    -{ (10 * negativeMarks).toFixed(1) }
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Net Combined</p>
                  <p className="text-sm font-black text-blue-300 mt-0.5">
                    { ((10 * positiveMarks) - (10 * negativeMarks)).toFixed(1) }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Scheme to Test</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
