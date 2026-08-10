const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/import \{ PlayCircle, CheckCircle2, Clock, BarChart \} from 'lucide-react';/, "import { PlayCircle, CheckCircle2, Clock, BarChart, Trash2 } from 'lucide-react';");

code = code.replace(/const \{ tests, attempts, srsItems \} = useStore\(\);/, "const { tests, attempts, srsItems, deleteAttempt } = useStore();");

const uiToReplace = `                      <button 
                        onClick={() => navigate(\`/review/\${attempt.id}\`)}
                        className="relative overflow-hidden text-xs bg-[var(--color-surface-container)] text-[var(--color-on-surface)] px-4 py-2 rounded-full hover:bg-[var(--color-outline-variant)] font-medium transition-colors"
                      >
                        View Analytics
                        <Ripple color="bg-gray-900/10" />
                      </button>`;

const newUI = `                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => deleteAttempt(attempt.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove attempt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(\`/review/\${attempt.id}\`)}
                          className="relative overflow-hidden text-xs bg-[var(--color-surface-container)] text-[var(--color-on-surface)] px-4 py-2 rounded-full hover:bg-[var(--color-outline-variant)] font-medium transition-colors"
                        >
                          View Analytics
                          <Ripple color="bg-gray-900/10" />
                        </button>
                      </div>`;

code = code.replace(uiToReplace, newUI);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
