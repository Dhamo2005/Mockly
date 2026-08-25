const fs = require('fs');
const path = 'src/components/ExamPersonalityModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';\nimport { useStore } from '../store/useStore';"
);

const stateBlock = `  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [examCategory, setExamCategory] = useState<string>('');`;

const newStateBlock = `  const tests = useStore((state) => state.tests);
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [examCategory, setExamCategory] = useState<string>('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategorySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryRef]);

  const existingCategories = Array.from(new Set(tests.map(t => t.examCategory?.trim()).filter(Boolean))) as string[];
  const presetCategories = EXAM_PRESETS.map(p => p.category);
  const allCategorySuggestions = Array.from(new Set([...presetCategories, ...existingCategories])).filter(c => c.toLowerCase().includes(examCategory.toLowerCase()) && c !== examCategory);`;

content = content.replace(stateBlock, newStateBlock);

const inputBlock = `              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Exam Label / Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL, Banking, Railway RRB NTPC, Custom"
                  value={examCategory}
                  onChange={(e) => setExamCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-100/80 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>`;

const newInputBlock = `              <div ref={categoryRef} className="relative">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Exam Label / Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL, Banking, Railway RRB NTPC, Custom"
                  value={examCategory}
                  onChange={(e) => {
                    setExamCategory(e.target.value);
                    setShowCategorySuggestions(true);
                  }}
                  onFocus={() => setShowCategorySuggestions(true)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-100/80 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                <AnimatePresence>
                  {showCategorySuggestions && allCategorySuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar"
                    >
                      {allCategorySuggestions.map((cat, idx) => (
                        <div
                          key={idx}
                          className="px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 font-medium transition-colors"
                          onClick={() => {
                            setExamCategory(cat);
                            setShowCategorySuggestions(false);
                          }}
                        >
                          {cat}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>`;

content = content.replace(inputBlock, newInputBlock);

fs.writeFileSync(path, content, 'utf8');
