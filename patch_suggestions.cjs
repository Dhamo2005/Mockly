const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewInterface.tsx', 'utf8');

const regexSuggestions = /<div className="md:col-span-2 bg-\[var\(--color-surface\)\] p-6 rounded-xl border border-gray-200 shadow-sm">[\s\S]*?<\/ResponsiveContainer>\s*<\/div>\s*<\/div>\s*<div className="bg-\[var\(--color-surface\)\] p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">[\s\S]*?\{\/\* Sidebar \*\//m;

const newCode = `<div className="md:col-span-3 bg-[var(--color-surface)] p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Section Performance</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="correct" name="Correct" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="incorrect" name="Incorrect" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="unanswered" name="Skipped" stackId="a" fill="#9ca3af" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in">
          {/* Sidebar */`;

code = code.replace(regexSuggestions, newCode);
fs.writeFileSync('src/pages/ReviewInterface.tsx', code);
