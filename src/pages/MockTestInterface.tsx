import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QuestionStatus, TestAttempt, Language } from '../types';
import { Ripple } from '../components/Ripple';
import { AlertTriangle, Clock, Play, Maximize, AlertCircle, Menu, X, CheckCircle2, BookOpen } from 'lucide-react';
import { cn, getLocalizedText } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getAccessToken, useAuth } from '../contexts/AuthContext';
import { saveSQLiteToDrive } from '../lib/sqliteDriveSync';

export default function MockTestInterface() {
  const { user } = useAuth();
  const { testId } = useParams();
  const navigate = useNavigate();
  const { tests, language, setLanguage, addAttempt, activeTestSessions, updateActiveTestSession, clearActiveTestSession } = useStore();
  
  const test = tests.find(t => t.id === testId);
  const isStrictSectional = test?.settings?.strictSectionalTiming === true;
  const isLoadedRef = useRef(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionTimeLeft, setSectionTimeLeft] = useState<Record<number, number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(test?.timeLimit || 0);
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'submit' | 'exit' | null>(null);

  // Modals and Reports
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedQuestions, setReportedQuestions] = useState<Record<string, { reason: string; comment?: string }>>({});
  const [reportReason, setReportReason] = useState('Incorrect Answer / Option');
  const [reportComment, setReportComment] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const availableLanguages = useMemo(() => {
    if (!test) return ['en'];
    const langs = new Set<string>();
    test.questions.forEach(q => {
      if (q.text && typeof q.text === 'object') {
        Object.keys(q.text).forEach(lang => langs.add(lang));
      } else {
        langs.add('en');
      }
    });
    return Array.from(langs);
  }, [test]);

  // Restore session from SQLite / activeTestSessions on mount or refresh
  useEffect(() => {
    if (!testId || !test || isLoadedRef.current) return;

    const extractedSections = Array.from(new Set(test.questions.map(q => q.section)));
    const activeSession = activeTestSessions[testId];
    if (activeSession) {
      setCurrentQuestionIndex(activeSession.currentQuestionIndex || 0);
      setCurrentSectionIndex(activeSession.currentSectionIndex || 0);
      
      if (activeSession.sectionTimeLeft && Object.keys(activeSession.sectionTimeLeft).length > 0) {
        setSectionTimeLeft(activeSession.sectionTimeLeft);
      } else {
        const initialSectionTimes: Record<number, number> = {};
        extractedSections.forEach((secName, idx) => {
          const secDef = Array.isArray(test.sections) ? test.sections.find((s: any) => (typeof s === 'object' ? s.name === secName : s === secName)) : undefined;
          initialSectionTimes[idx] = (secDef && typeof secDef === 'object' && secDef.timeLimit) ? secDef.timeLimit : 900;
        });
        setSectionTimeLeft(initialSectionTimes);
      }

      setAnswers(activeSession.answers || {});
      setStatuses(activeSession.statuses || {});
      setTimeLeft(activeSession.timeLeft !== undefined ? activeSession.timeLeft : test.timeLimit);
      setTimeSpent(activeSession.timeSpent || {});
      setIsPaused(activeSession.isPaused || false);
      setReportedQuestions(activeSession.reportedQuestions || {});
    } else {
      const initialStatuses: Record<string, QuestionStatus> = {};
      test.questions.forEach((q, idx) => {
        initialStatuses[q.id] = idx === 0 ? 'unanswered' : 'unvisited';
      });
      setStatuses(initialStatuses);
      setTimeLeft(test.timeLimit);
      
      setCurrentSectionIndex(0);
      const initialSectionTimes: Record<number, number> = {};
      extractedSections.forEach((secName, idx) => {
        const secDef = Array.isArray(test.sections) ? test.sections.find((s: any) => (typeof s === 'object' ? s.name === secName : s === secName)) : undefined;
        initialSectionTimes[idx] = (secDef && typeof secDef === 'object' && secDef.timeLimit) ? secDef.timeLimit : 900;
      });
      setSectionTimeLeft(initialSectionTimes);
    }

    isLoadedRef.current = true;
  }, [testId, test, activeTestSessions]);

  // Sync active test state to store & SQLite DB on every progress change
  useEffect(() => {
    if (!testId || !isLoadedRef.current || isSubmitted) return;

    updateActiveTestSession(testId, {
      currentQuestionIndex,
      currentSectionIndex,
      sectionTimeLeft,
      answers,
      statuses,
      timeLeft,
      timeSpent,
      isPaused,
      reportedQuestions
    });
  }, [testId, currentQuestionIndex, currentSectionIndex, sectionTimeLeft, answers, statuses, timeLeft, timeSpent, isPaused, reportedQuestions, isSubmitted]);


  useEffect(() => {
    if (!test || isSubmitted || isPaused) return;
    const isStrictSectional = test?.settings?.strictSectionalTiming === true;
    
    const timer = setInterval(() => {
      
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1);
        if (!isStrictSectional && next === 0) {
          clearInterval(timer);
          handleSubmit();
        }
        return next;
      });
      
      if (isStrictSectional) {
        setSectionTimeLeft(prev => {
          const currentLeft = prev[currentSectionIndex] || 0;
          return { ...prev, [currentSectionIndex]: Math.max(0, currentLeft - 1) };
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [test, isSubmitted, isPaused, currentSectionIndex]);

  const sections = useMemo(() => {
    if (!test) return [];
    return Array.from(new Set(test.questions.map(q => q.section)));
  }, [test]);

  useEffect(() => {
    if (isSubmitted || isPaused || !test || !test.settings?.strictSectionalTiming) return;
    const currentLeft = sectionTimeLeft[currentSectionIndex];
    if (currentLeft === 0) {
      if (currentSectionIndex < sections.length - 1) {
        const nextIndex = currentSectionIndex + 1;
        setCurrentSectionIndex(nextIndex);
        const firstQIndex = test.questions.findIndex(q => q.section === sections[nextIndex]);
        if (firstQIndex !== -1) {
          handleJumpToQuestion(firstQIndex, sections[nextIndex]);
        }
      } else {
        handleSubmit();
      }
    }
  }, [sectionTimeLeft, currentSectionIndex, isSubmitted, isPaused, test, sections]);

  // Sync currentSectionIndex with currentQuestionIndex for non-strict mode
  useEffect(() => {
    if (!test || !test.questions[currentQuestionIndex]) return;
    const currentSectionName = test.questions[currentQuestionIndex].section;
    const actualSectionIndex = sections.indexOf(currentSectionName);
    if (actualSectionIndex !== -1 && actualSectionIndex !== currentSectionIndex) {
      setCurrentSectionIndex(actualSectionIndex);
    }
  }, [currentQuestionIndex, test, sections, currentSectionIndex]);

  // Active per-question timer tracking
  useEffect(() => {
    if (!test || !test.questions[currentQuestionIndex] || isSubmitted || isPaused) return;
    
    const currentQId = test.questions[currentQuestionIndex].id;
    const qTimer = setInterval(() => {
      setTimeSpent(prev => ({
        ...prev,
        [currentQId]: (prev[currentQId] || 0) + 1
      }));
    }, 1000);
    
    return () => clearInterval(qTimer);
  }, [test, currentQuestionIndex, isSubmitted, isPaused]);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion) return;

    setReportedQuestions(prev => ({
      ...prev,
      [currentQuestion.id]: { reason: reportReason, comment: reportComment }
    }));

    setShowReportModal(false);
    setReportComment('');
    setToastMessage(`Question #${currentQuestionIndex + 1} reported. Thank you for your feedback!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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
      const nextQ = test.questions[currentQuestionIndex + 1];
      if (nextQ.section !== currentQuestion.section && test.settings?.strictSectionalTiming) {
        // Prevent navigating to the next section via "Save & Next"
        setToastMessage("You must wait for the section time to complete.");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      
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

  const handleJumpToQuestion = (index: number, forceSectionCheck?: string) => {
    const targetQ = test.questions[index];
    if (targetQ.section !== (forceSectionCheck || sections[currentSectionIndex]) && test.settings?.strictSectionalTiming) {
      setToastMessage("You cannot jump to a different section.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
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
      handleJumpToQuestion(firstQIndex, sectionName);
    }
  };

  const positiveMarks = test?.positiveMarks ?? (test?.examCategory === 'SSC CGL' ? 2.0 : 1.0);
  const negativeMarks = test?.negativeMarks ?? (test?.examCategory === 'SSC CGL' ? 0.5 : 0.25);

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

    const grossScore = correct * positiveMarks;
    const penalty = incorrect * negativeMarks;
    const netScore = Number((grossScore - penalty).toFixed(2));
    
    const attempt: TestAttempt = {
      id: uuidv4(),
      testId: test.id,
      startTime: Date.now() - ((test.timeLimit - timeLeft) * 1000),
      endTime: Date.now(),
      answers,
      statuses,
      timeSpent,
      completed: true,
      score: netScore, 
      totalQuestions: test.questions.length,
      correctAnswers: correct,
      incorrectAnswers: incorrect
    };
    
    addAttempt(attempt);
    if (testId) clearActiveTestSession(testId);
    const token = getAccessToken();
    saveSQLiteToDrive(token, useStore.getState(), true);
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

  const qText = getLocalizedText(currentQuestion?.text, language);

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
                     setShowConfirm(null);
                     handleSubmit(); // Changed to submit when aborted
                   }
                 }}
                 className={cn(
                   "relative overflow-hidden px-6 py-2 rounded-full font-medium text-white transition-colors shadow-sm",
                   showConfirm === 'submit' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                 )}
               >
                 {showConfirm === 'submit' ? 'Submit Now' : 'End Test'}
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
             <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
             {test.themeColor && <style>{`#mock-test-root { --color-primary: ${test.themeColor}; }`}</style>}
             <span className="hidden sm:inline text-[var(--color-on-surface)]">{test.examCategory || "Mockly"}</span>
          </div>
          <div className="h-6 w-px bg-[var(--color-outline-variant)] mx-1 sm:mx-2"></div>
          <h1 
            onClick={() => navigate(`/test-details/${test.id}`)}
            className="text-xs sm:text-sm font-semibold text-[var(--color-on-surface-variant)] line-clamp-1 cursor-pointer hover:text-[var(--color-primary)] hover:underline transition-colors"
            title="View Test Info"
          >
            {test.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center text-sm gap-2">
            <span className="text-[var(--color-on-surface-variant)] hidden sm:inline">Time Left:</span>
            <div className="bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-mono font-bold px-3 sm:px-4 py-1.5 rounded-full text-sm sm:text-base border border-[var(--color-outline-variant)]">
              {isStrictSectional ? formatTime(sectionTimeLeft[currentSectionIndex] || 0) : formatTime(timeLeft)}
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
           {sections.map((sec, idx) => (
             <button 
               key={sec} 
               onClick={() => {
                 if (isStrictSectional) return;
                 const firstQIndex = test.questions.findIndex(q => q.section === sec);
                 if (firstQIndex !== -1) handleJumpToQuestion(firstQIndex, sec);
               }}
               className={cn(
                 "relative overflow-hidden px-5 py-2 text-sm font-semibold rounded-full min-w-[100px] transition-colors", isStrictSectional ? "cursor-default" : "",
                 idx === currentSectionIndex 
                   ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" 
                   : isStrictSectional ? "text-[var(--color-on-surface-variant)] opacity-50 bg-transparent" : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
               )}
             >
               {sec}
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
                    <span className="mt-0.5 font-mono font-bold text-gray-800">
                      {formatTime(timeSpent[currentQuestion?.id] || 0)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className={cn(
                      "flex flex-col items-center transition-colors text-xs font-semibold",
                      reportedQuestions[currentQuestion?.id] ? "text-amber-600 font-bold" : "hover:text-blue-600 text-gray-600"
                    )}
                    title={reportedQuestions[currentQuestion?.id] ? "Reported" : "Report Question Issue"}
                  >
                     <AlertTriangle className="w-4 h-4 mb-0.5" />
                     {reportedQuestions[currentQuestion?.id] ? "Reported" : "Report"}
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
                  const optText = getLocalizedText(option.text, language);
                  
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
                      handleNext();
                    } else {
                      handleNext();
                    }
                  }}
                  className="w-full relative overflow-hidden px-6 sm:px-10 py-2.5 sm:py-2 bg-[#25b55d] text-white font-bold sm:font-medium rounded-xl sm:rounded-full hover:bg-[#1e9a4f] transition-colors text-xs sm:text-sm shadow-sm"
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
              <img 
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Candidate'}&background=random`} 
                alt={`${user?.displayName || 'Candidate'}'s profile`} 
                className="w-10 h-10 rounded-full border border-slate-200 shadow-sm shrink-0"
              />
              <div className="flex flex-col overflow-hidden">
                 <span className="font-bold text-sm text-gray-800 truncate">{user?.displayName || 'Candidate Name'}</span>
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
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[11px] bg-[#25b55d] rounded-t-full rounded-b-sm">{counts.answered}</div>
                   <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[11px] bg-[#e53935] rounded-b-full rounded-t-sm">{counts.unanswered}</div>
                   <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-gray-600 text-[11px] bg-white border border-gray-400 rounded-sm">{counts.unvisited}</div>
                   <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[11px] bg-[#7e57c2] rounded-full">{counts.marked}</div>
                   <span>Marked</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                   <div className="w-6 h-6 flex items-center justify-center text-white text-[11px] bg-[#7e57c2] rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-[#25b55d] after:rounded-full after:border after:border-white">{counts.answered_marked}</div>
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
                        disabled={q.section !== sections[currentSectionIndex] && isStrictSectional}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center text-xs font-semibold transition-all hover:opacity-80 mx-auto",
                          getStatusShapeClasses(status),
                          isActive && "ring-2 ring-blue-600 ring-offset-1 scale-105",
                          q.section !== sections[currentSectionIndex] && isStrictSectional && "opacity-50 grayscale cursor-not-allowed"
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
               <button 
                 onClick={() => setShowQuestionPaper(true)}
                 className="py-1.5 bg-white border border-gray-300 text-gray-700 font-medium text-xs rounded hover:bg-gray-50 transition-colors"
               >
                  Question Paper
               </button>
               <button 
                 onClick={() => setShowInstructions(true)}
                 className="py-1.5 bg-white border border-gray-300 text-gray-700 font-medium text-xs rounded hover:bg-gray-50 transition-colors"
               >
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Report Question #{currentQuestionIndex + 1}</span>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Issue Category
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="Incorrect Answer / Option">Incorrect Answer / Option Key</option>
                  <option value="Formatting / LaTeX Error">Formatting / Math LaTeX Error</option>
                  <option value="Question Text Incomplete">Question Text Unclear or Incomplete</option>
                  <option value="Translation Mistake">Translation / Language Mistake</option>
                  <option value="Other Issue">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Details / Comment (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  placeholder="Describe the issue with this question..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Paper Modal */}
      {showQuestionPaper && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-base md:text-lg">Full Question Paper: {test.title}</h3>
              <button 
                onClick={() => setShowQuestionPaper(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {test.questions.map((q, idx) => {
                const text = getLocalizedText(q.text, language);
                return (
                  <div key={q.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 text-sm">Q{idx + 1}. ({q.section})</span>
                      <button 
                        onClick={() => {
                          setShowQuestionPaper(false);
                          handleJumpToQuestion(idx);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Jump to Question
                      </button>
                    </div>
                    <div className="text-sm text-gray-800 markdown-body">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{text}</Markdown>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                      {q.options.map((opt, oIdx) => {
                        const optTxt = getLocalizedText(opt.text, language);
                        return (
                          <div key={opt.id} className="text-xs text-gray-700 p-2 bg-white rounded border border-gray-200 flex items-start gap-2">
                            <span className="font-bold text-gray-500">({String.fromCharCode(65 + oIdx)})</span>
                            <div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{optTxt}</Markdown></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-base">Test Instructions & Rules</h3>
              <button 
                onClick={() => setShowInstructions(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs md:text-sm text-gray-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Marking Scheme:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong className="text-emerald-600">+{positiveMarks.toFixed(1)} marks</strong> for each correct response.</li>
                  <li><strong className="text-rose-600">-{negativeMarks.toFixed(2)} mark</strong> penalty for each wrong response.</li>
                  <li><strong>0 marks</strong> for unattempted questions.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1">Status Color Legend:</h4>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#25b55d] text-white rounded-t-full rounded-b-sm flex items-center justify-center text-[11px]">1</span>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#e53935] text-white rounded-b-full rounded-t-sm flex items-center justify-center text-[11px]">2</span>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white border border-gray-400 text-gray-700 rounded-sm flex items-center justify-center text-[11px]">3</span>
                    <span>Not Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#7e57c2] text-white rounded-full flex items-center justify-center text-[11px]">4</span>
                    <span>Marked for Review</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1">Navigation & Submission:</h4>
                <p>Use <strong>Save & Next</strong> to save your answer and move to the next question. You can submit the test anytime using the <strong>Submit Test</strong> button in the right sidebar.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setShowInstructions(false)}
                className="px-5 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
