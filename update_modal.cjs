const fs = require('fs');
let code = fs.readFileSync('src/components/ExamPersonalityModal.tsx', 'utf8');

// 1. Add Clock to lucide-react imports if not there
if (!code.includes('Clock')) {
  code = code.replace(/import \{ Award, Check, ShieldCheck, ShieldAlert, Sparkles, Sliders, X \} from 'lucide-react';/, "import { Award, Check, ShieldCheck, ShieldAlert, Sparkles, Sliders, X, Clock } from 'lucide-react';");
}

// 2. Add strictSectionalTiming to ExamPersonalityModalProps
code = code.replace(/onSave: \(updatedFields: \{ examCategory\?: string; positiveMarks: number; negativeMarks: number \}\) => void;/, "onSave: (updatedFields: { examCategory?: string; positiveMarks: number; negativeMarks: number; settings?: any }) => void;");

// 3. Add state for strictSectionalTiming
code = code.replace(/const \[negativeMarks, setNegativeMarks\] = useState<number>\(0\.25\);/, "const [negativeMarks, setNegativeMarks] = useState<number>(0.25);\n  const [strictSectionalTiming, setStrictSectionalTiming] = useState<boolean>(false);");

// 4. Update useEffect to initialize strictSectionalTiming
code = code.replace(/setNegativeMarks\(neg\);/, "setNegativeMarks(neg);\n      setStrictSectionalTiming(test.settings?.strictSectionalTiming === true);");

// 5. Update handleSave to include settings
code = code.replace(/negativeMarks: Math\.max\(0, Number\(negativeMarks\) \|\| 0\),/, "negativeMarks: Math.max(0, Number(negativeMarks) || 0),\n      settings: { ...test.settings, strictSectionalTiming },");

// 6. Add the UI for Strict Sectional Timing toggle before "Custom Values Adjustment"
const toggleUI = `
            {/* Strict Sectional Timing Toggle */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                  strictSectionalTiming ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                }\`}>
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
                className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors \${
                  strictSectionalTiming ? 'bg-blue-600' : 'bg-slate-300'
                }\`}
              >
                <span
                  className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                    strictSectionalTiming ? 'translate-x-6' : 'translate-x-1'
                  }\`}
                />
              </button>
            </div>
`;

code = code.replace(/\{\/\* Custom Values Adjustment \*\/\}/, toggleUI + "\n            {/* Custom Values Adjustment */}");

fs.writeFileSync('src/components/ExamPersonalityModal.tsx', code);
