const fs = require('fs');
let content = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

const startStr = "{/* Bottom Action Bar */}";
const endStr = "</footer>";
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newFooter = `{/* Bottom Action Bar */}
          <footer className="grid grid-cols-2 md:flex md:flex-wrap items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-200 border-r shrink-0 gap-2">
            <button 
              onClick={handleMarkReview}
              className="col-span-1 md:col-auto relative overflow-hidden px-2 sm:px-6 py-2.5 sm:py-2 bg-white border border-blue-600 text-blue-600 font-bold sm:font-medium rounded-xl sm:rounded-full hover:bg-blue-50 transition-colors text-xs sm:text-sm text-center"
            >
              Mark for Review <span className="hidden sm:inline">& Next</span>
              <Ripple color="bg-blue-600/20" />
            </button>
            <button 
              onClick={handleClearResponse}
              className="col-span-1 md:col-auto relative overflow-hidden px-2 sm:px-6 py-2.5 sm:py-2 bg-white border border-gray-300 text-gray-600 font-bold sm:font-medium rounded-xl sm:rounded-full hover:bg-gray-100 transition-colors text-xs sm:text-sm text-center"
            >
              Clear <span className="hidden sm:inline">Response</span>
              <Ripple color="bg-gray-900/10" />
            </button>
            <div className="col-span-2 md:col-auto flex">
              {currentQuestionIndex === test.questions.length - 1 ? (
                <button 
                  onClick={() => {
                    handleNext();
                    setShowConfirm('submit');
                  }}
                  className="w-full relative overflow-hidden px-6 sm:px-8 py-2.5 sm:py-2 bg-emerald-600 text-white font-bold sm:font-medium rounded-xl sm:rounded-full hover:bg-emerald-700 transition-colors text-xs sm:text-sm shadow-sm"
                >
                  Save & Submit Test
                  <Ripple color="bg-white/30" />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    const currentSectionQuestions = test.questions.filter(q => q.section === sections[currentSectionIndex]);
                    const lastQ = currentSectionQuestions[currentSectionQuestions.length - 1];
                    if (currentQuestion.id === lastQ.id && test.settings?.strictSectionalTiming) {
                      // At the end of a section, if they click next they can't advance until time is up, or they can submit section early
                      handleSaveNext();
                    } else {
                      handleSaveNext();
                    }
                  }}
                  className="w-full relative overflow-hidden px-6 sm:px-10 py-2.5 sm:py-2 bg-[#25b55d] text-white font-bold sm:font-medium rounded-xl sm:rounded-full hover:bg-[#1e9a4f] transition-colors text-xs sm:text-sm shadow-sm"
                >
                  Save & Next
                  <Ripple color="bg-white/30" />
                </button>
              )}
            </div>
          `;
  const before = content.slice(0, startIndex);
  const after = content.slice(endIndex);
  content = before + newFooter + after;
  fs.writeFileSync('src/pages/MockTestInterface.tsx', content);
  console.log("Replaced footer!");
} else {
  console.log("Could not find boundaries!");
}
