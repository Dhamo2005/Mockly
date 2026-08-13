const fs = require('fs');

let content = fs.readFileSync('src/pages/TestDetails.tsx', 'utf8');

const oldHeroActions = `<div className="flex items-center gap-1 sm:gap-2 shrink-0 mt-1">
                  <button
                    onClick={handleExportTest}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Export Test to JSON"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Test Paper"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>`;

const newHeroActions = `<div className="flex items-center gap-1 sm:gap-2 shrink-0 mt-1">
                  <button
                    onClick={() => setShowPersonalityModal(true)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Configure Scheme & Settings"
                  >
                    <Sliders className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleExportTest}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Export Test to JSON"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Test Paper"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>`;

if (content.includes(oldHeroActions)) {
  content = content.replace(oldHeroActions, newHeroActions);
  fs.writeFileSync('src/pages/TestDetails.tsx', content);
  console.log("Replaced hero actions successfully");
} else {
  console.log("Could not find hero actions block");
}
