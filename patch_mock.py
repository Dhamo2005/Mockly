import re

with open("src/pages/MockTestInterface.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# I need to add useKeyboardShortcuts hook just before return (
# Let's insert the keyboard shortcuts handling in the component.

keyboard_hook = """
  // Keyboard Shortcuts
  useEffect(() => {
    if (isPaused || showConfirm || showReportModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1-4 or A-D for options
      if (!currentQuestion) return;
      const opts = currentQuestion.options;
      
      let selectedIdx = -1;
      if (e.key >= '1' && e.key <= '4') {
        selectedIdx = parseInt(e.key) - 1;
      } else if (e.key.toLowerCase() === 'a') selectedIdx = 0;
      else if (e.key.toLowerCase() === 'b') selectedIdx = 1;
      else if (e.key.toLowerCase() === 'c') selectedIdx = 2;
      else if (e.key.toLowerCase() === 'd') selectedIdx = 3;

      if (selectedIdx >= 0 && selectedIdx < opts.length) {
        handleOptionSelect(opts[selectedIdx].id);
        return;
      }

      if (e.key === 'Enter') {
        if (currentQuestionIndex === test.questions.length - 1) {
           setShowConfirm('submit');
        } else {
           handleNext();
        }
      } else if (e.key === 'ArrowRight') {
        if (currentQuestionIndex < test.questions.length - 1) handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key.toLowerCase() === 'm') {
        handleMarkReview();
      } else if (e.key.toLowerCase() === 'c') {
        handleClearResponse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, showConfirm, showReportModal, currentQuestion, currentQuestionIndex, test.questions.length, handleNext, handlePrev, handleMarkReview, handleClearResponse, handleOptionSelect]);

  const qText = getLocalizedText(currentQuestion?.text, language);
"""

code = code.replace("  const qText = getLocalizedText(currentQuestion?.text, language);", keyboard_hook)


# We are replacing everything from `return (\n    <div className="flex h-[100dvh]` to the end of the file.
pattern = r'  return \(\n    <div className="flex h-\[100dvh\] flex-col.*'
match = re.search(pattern, code, re.DOTALL)

if not match:
    print("Could not find the return statement to replace.")
    exit(1)

new_return = """  return (
    <div className="flex h-[100dvh] flex-col bg-white font-sans text-slate-800 overflow-hidden select-none" id="mock-test-root">
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
           <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col items-center text-center">
             <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
               <Clock className="w-7 h-7" />
             </div>
             <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Test Paused</h2>
             <p className="text-slate-500 text-sm mb-6 max-w-sm">
               Timer is frozen at <strong className="font-mono text-slate-800">{formatTime(timeLeft)}</strong>. Responses are saved.
             </p>
             <div className="w-full flex flex-col gap-2">
               <button 
                 onClick={() => { setIsPaused(false); syncSession({ isPaused: false }); }}
                 className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
               >
                 <Play className="w-4 h-4 fill-white" /> Resume
               </button>
               <button 
                 onClick={() => { syncSession({ isPaused: true }); navigate(`/test-details/${test.id}`); }}
                 className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
               >
                 <LogOut className="w-4 h-4" /> Save & Exit
               </button>
               <button 
                 onClick={() => setShowConfirm('restart')}
                 className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
               >
                 <RotateCcw className="w-3.5 h-3.5" /> Restart
               </button>
             </div>
           </div>
        </div>
      )}
      
      {showConfirm === 'restart' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2 text-red-600">
              <RotateCcw className="w-5 h-5" /> Restart Test?
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              This will clear all your answers and restart the timer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={() => { setShowConfirm(null); handleRestartTest(); }} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors">Restart</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm === 'exit' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" /> Exit Test?
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              Your progress will be saved, but time continues unless paused.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  setShowConfirm(null);
                  if (testId) clearActiveTestSession(testId);
                  const token = getAccessToken();
                  saveSQLiteToDrive(token, useStore.getState(), true);
                  navigate(`/test-details/${test.id}`);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors"
              >Exit</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm === 'submit' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Submit Test?</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{counts.answered + counts.answered_marked}</div>
                <div className="text-xs font-semibold text-green-700 uppercase">Answered</div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{counts.unanswered}</div>
                <div className="text-xs font-semibold text-red-700 uppercase">Unanswered</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{counts.marked}</div>
                <div className="text-xs font-semibold text-purple-700 uppercase">Marked</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-slate-600">{counts.unvisited}</div>
                <div className="text-xs font-semibold text-slate-700 uppercase">Not Visited</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors">Back</button>
              <button onClick={() => { setShowConfirm(null); handleSubmit(); }} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors">Submit</button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Report Issue
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <select id="report-reason" className="w-full text-sm border-slate-300 rounded-lg p-2 bg-slate-50 focus:ring-blue-500 focus:border-blue-500">
                  <option value="wrong_answer">Wrong Answer Key</option>
                  <option value="translation">Translation Issue</option>
                  <option value="incomplete">Incomplete Question</option>
                  <option value="formatting">Formatting/Image Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Details (Optional)</label>
                <textarea id="report-comment" className="w-full text-sm border-slate-300 rounded-lg p-2 bg-slate-50 h-20 focus:ring-blue-500 focus:border-blue-500" placeholder="Briefly describe the issue..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  const reason = (document.getElementById('report-reason') as HTMLSelectElement).value;
                  const comment = (document.getElementById('report-comment') as HTMLTextAreaElement).value;
                  reportedQuestionsRef.current[currentQuestion.id] = { reason, comment };
                  setShowReportModal(false);
                }} 
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors"
              >Report</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="h-12 border-b border-slate-200 bg-white px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 w-1/3">
          <span className="font-bold text-sm text-slate-800 truncate hidden sm:inline">{test.examCategory || "SSC CGL"}</span>
          <div className="hidden sm:block w-px h-4 bg-slate-300" />
          <span className="text-sm font-semibold text-slate-600 truncate max-w-[120px] sm:max-w-[200px]" title={test.title}>{test.title}</span>
        </div>
        
        <div className="hidden md:flex items-center justify-center gap-3 text-sm font-medium text-slate-600 w-1/3">
          <span className="truncate">{sections[currentSectionIndex]}</span>
          <div className="w-px h-4 bg-slate-300" />
          <span className="whitespace-nowrap">Q {currentQuestionIndex + 1} / {test.questions.length}</span>
        </div>
        
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3 shrink-0">
          <div className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 whitespace-nowrap" title="Save Status">
            {driveSyncStatus === 'saving' && <span className="text-blue-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Saving...</span>}
            {driveSyncStatus === 'synced' && <span className="text-green-600 flex items-center gap-1"><Cloud className="w-3 h-3"/> ✓ Saved</span>}
            {driveSyncStatus === 'offline' && <span className="text-amber-600 flex items-center gap-1"><CloudOff className="w-3 h-3"/> Offline</span>}
            {driveSyncStatus === 'error' && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Error</span>}
            {driveSyncStatus === 'idle' && <span className="flex items-center gap-1"><Check className="w-3 h-3"/> Saved</span>}
          </div>

          <div className={cn("font-mono font-bold text-sm sm:text-base px-2 py-0.5 rounded whitespace-nowrap", timeLeft < 60 ? "bg-red-100 text-red-700" : timeLeft < 300 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700")}>
            {formatTime(isStrictSectional ? (sectionTimeLeft[currentSectionIndex] || 0) : timeLeft)}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button title="Full Screen" onClick={handleToggleFullscreen} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden sm:block"><Maximize size={16}/></button>
            <button title={isPaused ? "Resume" : "Pause"} onClick={() => { const n = !isPaused; setIsPaused(n); syncSession({ isPaused: n }); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden sm:block">{isPaused ? <Play size={16}/> : <Pause size={16}/>}</button>
            <button title="Exit" onClick={() => setShowConfirm('exit')} className="p-1.5 hover:bg-red-50 text-red-600 rounded hidden sm:block"><LogOut size={16}/></button>
            <button onClick={() => setShowPalette(!showPalette)} className="lg:hidden p-1.5 hover:bg-slate-100 text-slate-600 rounded"><Menu size={18}/></button>
          </div>
        </div>
      </header>

      {/* Sections Bar */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 shrink-0 h-10 px-1 overflow-x-auto z-10 scrollbar-hide">
        <div className="flex items-center h-full min-w-max px-1">
           {sections.map((sec, idx) => {
             const isCurrent = idx === currentSectionIndex;
             const isLocked = isStrictSectional && !canSwitchSections && !isCurrent;
             
             const sectionQuestions = test.questions.filter(q => q.section === sec);
             const answeredInSection = sectionQuestions.filter(q => statuses[q.id] === 'answered' || statuses[q.id] === 'answered_marked').length;

             return (
               <button 
                 key={sec} 
                 disabled={isLocked}
                 onClick={() => {
                   if (isLocked) return;
                   setCurrentSectionIndex(idx);
                   const firstQIndex = test.questions.findIndex(q => q.section === sec);
                   if (firstQIndex !== -1) handleJumpToQuestion(firstQIndex, sec);
                 }}
                 className={cn(
                   "px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors h-full flex items-center border-b-2",
                   isLocked ? "cursor-not-allowed opacity-40 text-slate-400 border-transparent" : "cursor-pointer",
                   isCurrent 
                     ? "border-blue-600 text-blue-700 bg-blue-50/50" 
                     : !isLocked ? "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900" : ""
                 )}
               >
                 {sec} <span className="ml-1.5 opacity-70 font-semibold">{answeredInSection}/{sectionQuestions.length}</span>
               </button>
             );
           })}
        </div>
        <div className="flex items-center gap-2 px-3 text-xs shrink-0">
          {availableLanguages.length > 1 && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none text-slate-700 font-semibold text-xs cursor-pointer outline-none hover:text-blue-600"
            >
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang === 'en' ? 'ENG' : lang === 'hi' ? 'HIN' : lang.toUpperCase()}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Question & Answer Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col mx-auto w-full max-w-5xl">
            
            {/* Question Meta */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4 shrink-0">
               <span className="font-bold text-base sm:text-lg text-slate-800">Question {currentQuestionIndex + 1}</span>
               <div className="flex items-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    <span className="text-green-600">+1</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-red-500">-0.25</span>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className={cn(
                      "flex items-center gap-1 transition-colors px-2 py-1 rounded",
                      reportedQuestions[currentQuestion?.id] ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                    title={reportedQuestions[currentQuestion?.id] ? "Reported" : "Report"}
                  >
                     <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>
            
            {/* Question Text */}
            <div className="text-base sm:text-[17px] text-slate-800 mb-6 leading-relaxed flex-1 select-text">
              <div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText || ''}</Markdown></div>
            </div>
            
            {/* Options */}
            <div className="space-y-2 mt-auto shrink-0 pb-4">
              {currentQuestion?.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const optText = getLocalizedText(option.text, language);
                const char = String.fromCharCode(65 + idx);
                
                return (
                  <label 
                    key={option.id} 
                    className={cn(
                      "flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all",
                      isSelected ? "bg-blue-50/50 border-blue-600" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center h-6 mt-0.5 mr-3">
                       <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() => handleOptionSelect(option.id)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                       />
                    </div>
                    <span className="text-sm sm:text-base text-slate-800 flex-1 pt-[1px] select-text">
                      <div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{optText || ''}</Markdown></div>
                    </span>
                    <span className="hidden sm:flex text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 ml-2 mt-0.5 bg-white">
                      {char}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <footer className="h-14 sm:h-16 flex items-center justify-between px-2 sm:px-4 bg-white border-t border-slate-200 shrink-0 gap-2">
            <div className="flex gap-2">
              <button 
                onClick={handleMarkReview}
                className="px-3 sm:px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center gap-1"
                title="Shortcut: M"
              >
                <Flag className="w-3.5 h-3.5 hidden sm:block" /> Mark <span className="hidden sm:inline">& Next</span>
              </button>
              <button 
                onClick={handleClearResponse}
                className="px-3 sm:px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                title="Shortcut: C"
              >
                Clear
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-3 sm:px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
              </button>
              
              {currentQuestionIndex === test.questions.length - 1 ? (
                <button 
                  onClick={() => { handleNext(); setShowConfirm('submit'); }}
                  className="px-5 sm:px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                >
                  Submit
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="px-5 sm:px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center gap-1"
                  title="Shortcut: Enter"
                >
                  Save & Next <ChevronRight className="w-4 h-4 hidden sm:block" />
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* Right Sidebar - Offcanvas on mobile */}
        {showPalette && (
           <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowPalette(false)} />
        )}
        
        <aside className={cn(
          "fixed inset-y-0 right-0 z-50 w-[280px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 lg:static lg:flex transition-transform duration-300 ease-in-out",
          showPalette ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Candidate Box */}
          <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'C'}&background=f1f5f9&color=334155`} alt="User" className="w-9 h-9 rounded border border-slate-200" />
              <div className="font-bold text-sm text-slate-800 truncate w-36">{user?.displayName || 'Candidate'}</div>
            </div>
            <button className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded" onClick={() => setShowPalette(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Status Legends (Compact) */}
          <div className="p-2 border-b border-slate-200 bg-white grid grid-cols-4 gap-1 text-center">
            <div className="flex flex-col items-center p-1" title="Answered">
              <div className="w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold bg-[#25b55d] rounded-t-full rounded-b-sm mb-1">{counts.answered}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Ans</span>
            </div>
            <div className="flex flex-col items-center p-1" title="Not Answered">
              <div className="w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold bg-[#e53935] rounded-b-full rounded-t-sm mb-1">{counts.unanswered}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Not</span>
            </div>
            <div className="flex flex-col items-center p-1" title="Marked">
              <div className="w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold bg-[#7e57c2] rounded-full mb-1">{counts.marked}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Mark</span>
            </div>
            <div className="flex flex-col items-center p-1" title="Not Visited">
              <div className="w-5 h-5 flex items-center justify-center text-slate-600 text-[10px] font-bold bg-white border border-slate-300 rounded-sm mb-1">{counts.unvisited}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">New</span>
            </div>
            <div className="col-span-4 flex justify-center mt-1">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  <div className="w-3 h-3 bg-[#7e57c2] rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-1.5 after:h-1.5 after:bg-[#25b55d] after:rounded-full after:border after:border-white"></div>
                  Ans & Marked: {counts.answered_marked}
               </div>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {sections.map(sec => {
              const secQuestions = test.questions.map((q, idx) => ({ q, idx })).filter(item => item.q.section === sec);
              if (secQuestions.length === 0) return null;
              
              return (
                <div key={sec} className="mb-4">
                  <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{sec}</h3>
                  <div className="grid grid-cols-5 gap-1.5">
                    {secQuestions.map(({q, idx}) => {
                      const status = statuses[q.id] || 'unvisited';
                      const isActive = currentQuestionIndex === idx;
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            if (q.section !== sections[currentSectionIndex] && isStrictSectional && !canSwitchSections) return;
                            handleJumpToQuestion(idx);
                          }}
                          disabled={q.section !== sections[currentSectionIndex] && isStrictSectional && !canSwitchSections}
                          className={cn(
                            "w-9 h-9 flex items-center justify-center text-[11px] font-bold transition-all mx-auto",
                            getStatusShapeClasses(status),
                            isActive && "ring-2 ring-blue-600 ring-offset-2 scale-105 z-10",
                            q.section !== sections[currentSectionIndex] && isStrictSectional && !canSwitchSections && "opacity-40 grayscale cursor-not-allowed"
                          )}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
"""

code = code[:match.start()] + new_return
with open("src/pages/MockTestInterface.tsx", "w", encoding="utf-8") as f:
    f.write(code)

