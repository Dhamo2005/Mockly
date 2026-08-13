const fs = require('fs');
let code = fs.readFileSync('src/components/ExamPersonalityModal.tsx', 'utf8');

// Update onSave type
code = code.replace(/onSave: \(updatedFields: \{ examCategory\?: string; positiveMarks: number; negativeMarks: number; settings\?: any \}\) => void;/, "onSave: (updatedFields: { examCategory?: string; positiveMarks: number; negativeMarks: number; settings?: any; sections?: any[]; timeLimit?: number }) => void;");

// Add state for sections
code = code.replace(/const \[strictSectionalTiming, setStrictSectionalTiming\] = useState<boolean>\(false\);/, "const [strictSectionalTiming, setStrictSectionalTiming] = useState<boolean>(false);\n  const [sections, setSections] = useState<{ name: string; timeLimit: number }[]>([]);");

// Add to useEffect
code = code.replace(/setStrictSectionalTiming\(test\.settings\?\.strictSectionalTiming === true\);/, "setStrictSectionalTiming(test.settings?.strictSectionalTiming === true);\n      setSections(test.sections || []);");

// Add to handleSave
code = code.replace(/settings: \{ \.\.\.test\.settings, strictSectionalTiming \},/, "settings: { ...test.settings, strictSectionalTiming },\n      sections: sections,\n      timeLimit: strictSectionalTiming ? sections.reduce((acc, s) => acc + s.timeLimit, 0) : test.timeLimit,");

// Add the UI for section timings
const toggleUI = `
            {/* Strict Sectional Timing Toggle */}
`;

const newUI = `
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
`;

code = code.replace(/\{\/\* Custom Values Adjustment \*\/\}/, newUI + "\n            {/* Custom Values Adjustment */}");

fs.writeFileSync('src/components/ExamPersonalityModal.tsx', code);
