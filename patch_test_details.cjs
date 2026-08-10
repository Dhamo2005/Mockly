const fs = require('fs');
let code = fs.readFileSync('src/pages/TestDetails.tsx', 'utf8');

// replace the grid section with more info

const newGrid = `
        <div className="flex flex-wrap gap-2 mb-6">
          {test.examCategory && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider">
              {test.examCategory}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <ListTodo className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Questions</p>
              <p className="font-semibold text-gray-900">{test.questions.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Clock className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Time Limit</p>
              <p className="font-semibold text-gray-900">{Math.floor(test.timeLimit / 60)} Minutes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl sm:col-span-2 md:col-span-1">
            <FileText className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Sections</p>
              <p className="font-semibold text-gray-900">{test.sections?.length || 1}</p>
            </div>
          </div>
        </div>

        {test.sections && test.sections.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sections Details</h3>
            <div className="space-y-2">
              {test.sections.map((section, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                  <span className="font-medium text-gray-800">{section.name}</span>
                  <span className="text-sm text-gray-500">{Math.floor(section.timeLimit / 60)} mins</span>
                </div>
              ))}
            </div>
          </div>
        )}
`;

code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">.*?<\/div>\s*<\/div>\s*<div className="flex/s, newGrid + '\n        <div className="flex');

fs.writeFileSync('src/pages/TestDetails.tsx', code);
