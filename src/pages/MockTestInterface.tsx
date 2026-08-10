import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QuestionStatus, TestAttempt, Language } from '../types';
import { Ripple } from '../components/Ripple';
import { AlertTriangle, Clock, Play, Maximize, AlertCircle, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MockTestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { tests, language, setLanguage, addAttempt } = useStore();
  
  const test = tests.find(t => t.id === testId);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(test?.timeLimit || 0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'submit' | 'exit' | null>(null);
  
  const availableLanguages = useMemo(() => {
    if (!test) return ['en'];
    const langs = new Set<string>();
    test.questions.forEach(q => {
      if (q.text) {
        Object.keys(q.text).forEach(lang => langs.add(lang));
      }
    });
    return Array.from(langs);
  }, [test]);

  // Quick hack: Initialize statuses for unvisited
  useEffect(() => {
    if (test && Object.keys(statuses).length === 0) {
      const initialStatuses: Record<string, QuestionStatus> = {};
      test.questions.forEach((q, idx) => {
        initialStatuses[q.id] = idx === 0 ? 'unanswered' : 'unvisited';
      });
      setStatuses(initialStatuses);
    }
  }, [test]);

  useEffect(() => {
    if (!test || isSubmitted || isPaused) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [test, isSubmitted, isPaused]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };



  if (!test) return <div>Test not found</div>;
  const currentQuestion = test.questions[currentQuestionIndex];

  const [activeSidebarSection, setActiveSidebarSection] = useState<string>('');
  
  useEffect(() => {
    if (currentQuestion) {
      setActiveSidebarSection(currentQuestion.section);
    }
  }, [currentQuestionIndex, currentQuestion]);

  const handleOptionSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
    setStatuses(prev => ({ 
      ...prev, 
      [currentQuestion.id]: prev[currentQuestion.id] === 'marked' || prev[currentQuestion.id] === 'answered_marked' 
        ? 'answered_marked' 
        : 'answered' 
    }));
  };

  const handleNext = () => {
    if (statuses[currentQuestion.id] === 'unvisited' || statuses[currentQuestion.id] === 'unanswered') {
      if (!answers[currentQuestion.id]) {
        setStatuses(prev => ({ ...prev, [currentQuestion.id]: 'unanswered' }));
      }
    }
    
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextId = test.questions[currentQuestionIndex + 1].id;
      if (statuses[nextId] === 'unvisited') {
        setStatuses(prev => ({ ...prev, [nextId]: 'unanswered' }));
      }
    }
  };

  const handleMarkReview = () => {
    const isAnswered = !!answers[currentQuestion.id];
    setStatuses(prev => ({ 
      ...prev, 
      [currentQuestion.id]: isAnswered ? 'answered_marked' : 'marked' 
    }));
    handleNext();
  };
  
  const handleClearResponse = () => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion.id];
      return newAnswers;
    });
    setStatuses(prev => ({
      ...prev,
      [currentQuestion.id]: 'unanswered'
    }));
  };

  const handleJumpToQuestion = (index: number) => {
    // update current question status if leaving
    if (statuses[currentQuestion.id] === 'unvisited') {
       if (!answers[currentQuestion.id]) {
         setStatuses(prev => ({ ...prev, [currentQuestion.id]: 'unanswered' }));
       }
    }
    
    setCurrentQuestionIndex(index);
    const targetId = test.questions[index].id;
    if (statuses[targetId] === 'unvisited' || !statuses[targetId]) {
      setStatuses(prev => ({ ...prev, [targetId]: 'unanswered' }));
    }
  };

  const handleSectionClick = (sectionName: string) => {
    const firstQIndex = test.questions.findIndex(q => q.section === sectionName);
    if (firstQIndex !== -1) {
      handleJumpToQuestion(firstQIndex);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    let correct = 0;
    let incorrect = 0;
    
    test.questions.forEach(q => {
      if (answers[q.id] === q.correctOptionId) {
        correct++;
      } else if (answers[q.id]) {
        incorrect++;
      }
    });
    
    const attempt: TestAttempt = {
      id: uuidv4(),
      testId: test.id,
      startTime: Date.now() - ((test.timeLimit - timeLeft) * 1000),
      endTime: Date.now(),
      answers,
      statuses,
      timeSpent: {},
      completed: true,
      score: correct, 
      totalQuestions: test.questions.length,
      correctAnswers: correct,
      incorrectAnswers: incorrect
    };
    
    addAttempt(attempt);
    navigate(`/review/${attempt.id}`);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusShapeClasses = (status: QuestionStatus) => {
    switch(status) {
      case 'answered': return 'bg-[#25b55d] text-white rounded-t-full rounded-b-sm border border-[#25b55d]';
      case 'unanswered': return 'bg-[#e53935] text-white rounded-b-full rounded-t-sm border border-[#e53935]';
      case 'marked': return 'bg-[#7e57c2] text-white rounded-full border border-[#7e57c2]';
      case 'answered_marked': return 'bg-[#7e57c2] text-white rounded-full border border-[#7e57c2] relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-[#25b55d] after:rounded-full after:border after:border-white';
      default: return 'bg-white text-gray-700 border border-gray-400 rounded-sm'; // unvisited
    }
  };

  const counts = {
    answered: Object.values(statuses).filter(s => s === 'answered').length,
    unanswered: Object.values(statuses).filter(s => s === 'unanswered').length,
    marked: Object.values(statuses).filter(s => s === 'marked').length,
    answered_marked: Object.values(statuses).filter(s => s === 'answered_marked').length,
    unvisited: test.questions.length - Object.keys(statuses).filter(k => statuses[k] !== 'unvisited').length
  };

  const qText = currentQuestion?.text[language] || currentQuestion?.text['en'];
  
  const sections = Array.from(new Set(test.questions.map(q => q.section)));

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-surface)] font-sans text-[var(--color-on-surface)] overflow-hidden select-none">
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-[var(--color-surface)] flex flex-col items-center justify-center p-3 text-center">
           <Play className="w-16 h-16 text-[var(--color-primary)] mb-3 opacity-80" />
           <h2 className="text-base font-bold text-[var(--color-on-surface)] mb-3">Test Paused</h2>
           <p className="text-[var(--color-on-surface-variant)] max-w-md mb-4 text-base">Your timer is stopped. Resume when you are ready to continue your test.</p>
           <button 
             onClick={() => setIsPaused(false)}
             className="relative overflow-hidden px-10 py-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full font-bold text-base hover:bg-blue-700 transition-colors shadow-md"
           >
             Resume Test
             <Ripple color="bg-white/30" />
           </button>
        </div>
      )}
      
      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-3">
           <div className="bg-[var(--color-surface)] p-3 rounded-xl max-w-md w-full shadow-xl">
             <h3 className="text-base font-bold text-[var(--color-on-surface)] mb-2">
               {showConfirm === 'submit' ? 'Submit Test?' : 'Exit Test?'}
             </h3>
             <p className="text-[var(--color-on-surface-variant)] mb-4">
               {showConfirm === 'submit' 
                 ? 'Are you sure you want to submit? You cannot change your answers after submission.' 
                 : 'Are you sure you want to exit? Your progress will be lost and not recorded.'}
             </p>
             <div className="flex gap-3 justify-end">
               <button 
                 onClick={() => setShowConfirm(null)}
                 className="px-6 py-2 rounded-full font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => {
                   if (showConfirm === 'submit') {
                     setShowConfirm(null);
                     handleSubmit();
                   } else {
                     navigate('/tests');
                   }
                 }}
                 className={cn(
                   "relative overflow-hidden px-6 py-2 rounded-full font-medium text-white transition-colors shadow-sm",
                   showConfirm === 'submit' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                 )}
               >
                 {showConfirm === 'submit' ? 'Submit Now' : 'Exit Now'}
                 <Ripple color="bg-white/30" />
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between px-2 sm:px-4 h-16 border-b border-[var(--color-outline-variant)] shrink-0 bg-[var(--color-surface)] z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 font-bold text-base sm:text-base text-[var(--color-primary)] tracking-tight">
             <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[var(--color-primary)] rounded-sm"></div>
             {test.themeColor && <style>{`#mock-test-root { --color-primary: ${test.themeColor}; }`}</style>}
             <span className="hidden sm:inline text-[var(--color-on-surface)]">{test.examCategory || "Mockly"}</span>
          </div>
          <div className="h-6 w-px bg-[var(--color-outline-variant)] mx-1 sm:mx-2"></div>
          <h1 className="text-xs sm:text-sm font-semibold text-[var(--color-on-surface-variant)] line-clamp-1">{test.title}</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center text-sm gap-2">
            <span className="text-[var(--color-on-surface-variant)] hidden sm:inline">Time Left:</span>
            <div className="bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-mono font-bold px-3 sm:px-4 py-1.5 rounded-full text-sm sm:text-base border border-[var(--color-outline-variant)]">
              {formatTime(timeLeft)}
            </div>
          </div>
          <button 
             onClick={handleToggleFullscreen}
             className="relative overflow-hidden hidden sm:flex items-center gap-1.5 text-xs font-medium text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] px-4 py-2 rounded-full hover:bg-[var(--color-surface-container)] transition-colors"
          >
             <Maximize className="w-3.5 h-3.5" /> {isFullscreen ? "Exit Full Screen" : "Full Screen"}
             <Ripple color="bg-gray-900/10" />
          </button>
          <button 
             onClick={() => setIsPaused(!isPaused)}
             className="relative overflow-hidden hidden sm:flex items-center gap-1.5 text-xs font-medium text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] px-4 py-2 rounded-full hover:bg-[var(--color-surface-container)] transition-colors"
          >
             <Play className="w-3.5 h-3.5" /> {isPaused ? "Resume" : "Pause"}
             <Ripple color="bg-gray-900/10" />
          </button>
          <button 
             onClick={() => setShowPalette(!showPalette)}
             className="relative overflow-hidden lg:hidden p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] rounded-full transition-colors"
          >
             <Menu className="w-5 h-5" />
             <Ripple color="bg-gray-900/10" />
          </button>
          <button 
             onClick={() => {
               setShowConfirm('exit');
             }}
             className="relative overflow-hidden flex items-center gap-1.5 text-xs font-medium text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] px-4 py-2 rounded-full hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors ml-0 sm:ml-2"
          >
             <AlertCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Abort Test</span>
             <Ripple color="bg-red-600/10" />
          </button>
        </div>
      </header>

      {/* Sections Bar */}
      <div className="flex items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] shrink-0 px-2 h-[56px] overflow-x-auto z-10">
        <div className="flex items-center h-full min-w-max gap-2 px-2">
           {sections.map(sec => (
             <button 
               key={sec} 
               onClick={() => handleSectionClick(sec)}
               className={cn(
                 "relative overflow-hidden px-5 py-2 text-sm font-semibold rounded-full min-w-[100px] transition-colors",
                 sec === currentQuestion.section 
                   ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" 
                   : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
               )}
             >
               {sec}
               <Ripple color={sec === currentQuestion.section ? "bg-white/30" : "bg-gray-900/10"} />
             </button>
           ))}
        </div>
        <div className="flex items-center gap-3 px-4 text-sm shrink-0">
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-on-surface-variant)] font-medium">View in:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm rounded px-2 py-0.5 outline-none cursor-pointer"
              >
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex-1 overflow-y-auto p-3 md:p-3 flex flex-col border-r border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
               <span className="font-bold text-gray-700">Question No. {currentQuestionIndex + 1}</span>
               <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                  <div className="flex flex-col items-center">
                    <span>Marks</span>
                    <div className="flex gap-1 mt-0.5">
                       <span className="bg-green-100 text-green-700 px-1 rounded rounded-full">+1</span>
                       <span className="bg-red-100 text-red-700 px-1 rounded rounded-full">-0.25</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>Time</span>
                    <span className="mt-0.5">00:00</span>
                  </div>
                  <button className="flex flex-col items-center hover:text-blue-600 transition-colors">
                     <AlertTriangle className="w-4 h-4 mb-0.5" />
                     Report
                  </button>
               </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="text-sm text-gray-800 leading-normal whitespace-pre-wrap mb-3 border-b border-gray-100 pb-3">
                <span className="font-semibold underline underline-offset-4 decoration-gray-300 mb-2 block">Question:</span>
                <div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText || ''}</Markdown></div>
              </div>
              
              <div className="space-y-1.5">
                {currentQuestion?.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === option.id;
                  const optText = option.text[language] || option.text['en'];
                  
                  return (
                    <label 
                      key={option.id} 
                      className={cn(
                        "flex items-start p-2 rounded cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50/80 border border-blue-200" : "hover:bg-blue-50/50 border border-transparent"
                      )}
                    >
                      <div className="flex items-center h-6 mt-0 mr-3">
                         <input
                            type="radio"
                            name={`q-${currentQuestion.id}`}
                            checked={isSelected}
                            onChange={() => handleOptionSelect(option.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                         />
                      </div>
                      <span className="text-sm text-gray-800 pt-[1px]">
                        <div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{optText || ''}</Markdown></div>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <footer className="flex flex-wrap items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-200 border-r shrink-0 gap-2">
            <div className="flex gap-2">
              <button 
                onClick={handleMarkReview}
                className="relative overflow-hidden px-4 sm:px-6 py-2 bg-white border border-blue-600 text-blue-600 font-medium rounded-full hover:bg-blue-50 transition-colors text-xs sm:text-sm text-center"
              >
                Mark for Review <span className="hidden sm:inline">& Next</span>
                <Ripple color="bg-blue-600/20" />
              </button>
              <button 
                onClick={handleClearResponse}
                className="relative overflow-hidden px-4 sm:px-6 py-2 bg-white border border-gray-300 text-gray-600 font-medium rounded-full hover:bg-gray-100 transition-colors text-xs sm:text-sm text-center"
              >
                Clear <span className="hidden sm:inline">Response</span>
                <Ripple color="bg-gray-900/10" />
              </button>
            </div>
            <div className="flex gap-2">
              {currentQuestionIndex === test.questions.length - 1 ? (
                <button 
                  onClick={() => {
                    handleNext();
                    setShowConfirm('submit');
                  }}
                  className="relative overflow-hidden px-6 sm:px-8 py-2 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors text-xs sm:text-sm shadow-sm"
                >
                  Save & Submit
                  <Ripple color="bg-white/30" />
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="relative overflow-hidden px-6 sm:px-8 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors text-xs sm:text-sm shadow-sm"
                >
                  Save & Next
                  <Ripple color="bg-white/30" />
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* Right Sidebar - Offcanvas on mobile */}
        {showPalette && (
           <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowPalette(false)} />
        )}
        
        <aside className={cn(
          "fixed inset-y-0 right-0 z-50 w-[280px] sm:w-[300px] bg-[#eef5fa] flex flex-col shrink-0 shadow-2xl lg:shadow-none lg:static lg:flex transition-transform duration-300 ease-in-out",
          showPalette ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="p-3 bg-white flex items-center justify-between gap-3 border-b border-gray-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                U
              </div>
              <div className="flex flex-col overflow-hidden">
                 <span className="font-bold text-sm text-gray-800 truncate">Candidate Name</span>
              </div>
            </div>
            <button className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded" onClick={() => setShowPalette(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Status Legends */}
          <div className="p-3 bg-white border-b border-gray-200">
             <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs text-gray-700 font-medium">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[10px] bg-[#25b55d] rounded-t-full rounded-b-sm">{counts.answered}</div>
                   <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[10px] bg-[#e53935] rounded-b-full rounded-t-sm">{counts.unanswered}</div>
                   <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-gray-600 text-[10px] bg-white border border-gray-400 rounded-sm">{counts.unvisited}</div>
                   <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[10px] bg-[#7e57c2] rounded-full">{counts.marked}</div>
                   <span>Marked</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[10px] bg-[#7e57c2] rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-[#25b55d] after:rounded-full after:border after:border-white">{counts.answered_marked}</div>
                   <span>Answered & Marked for Review</span>
                </div>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#eef5fa] flex flex-col">
            {sections.map(sec => (
              <div key={sec} className="mb-3">
                <div className="bg-[#4db2c1] text-white text-xs font-semibold px-3 py-2 sticky top-0 z-10 shadow-sm">
                  <span>SECTION : {sec}</span>
                </div>
                <div className="p-3 grid grid-cols-6 gap-2">
                  {test.questions.map((q, idx) => {
                    if (q.section !== sec) return null;
                    const status = statuses[q.id] || 'unvisited';
                    const isActive = currentQuestionIndex === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => handleJumpToQuestion(idx)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center text-xs font-semibold transition-all hover:opacity-80 mx-auto",
                          getStatusShapeClasses(status),
                          isActive && "ring-2 ring-blue-600 ring-offset-1 scale-105"
                        )}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto p-2 border-t border-gray-300 bg-white">
            <div className="grid grid-cols-2 gap-2 mb-2">
               <button className="py-1.5 bg-white border border-gray-300 text-gray-700 font-medium text-xs rounded hover:bg-gray-50 transition-colors">
                  Question Paper
               </button>
               <button className="py-1.5 bg-white border border-gray-300 text-gray-700 font-medium text-xs rounded hover:bg-gray-50 transition-colors">
                  Instructions
               </button>
            </div>
            <button 
              onClick={() => {
                setShowConfirm('submit');
              }}
              className="w-full py-2 bg-[#1da0db] hover:bg-[#188cbd] text-white font-bold text-sm rounded transition-colors"
            >
              Submit Test
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
