import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  BrainCircuit, 
  BarChart2, 
  ListTodo, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Award, 
  Trophy, 
  FileText, 
  Target, 
  Clock, 
  Star, 
  RotateCcw, 
  Info, 
  ChevronDown, 
  Sparkles,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Calendar,
  HardDrive
} from 'lucide-react';
import { getTestDisplayDate } from '../lib/dateUtils';
import { cn, getLocalizedText } from '../lib/utils';
import { Language } from '../types';
import { MediaViewer } from '../components/MediaViewer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';



export default function ReviewInterface() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { attempts, tests, language, setLanguage, deleteAttempt } = useStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Find target attempt
  const currentAttempt = attempts.find(a => a.id === attemptId);
  const test = tests.find(t => t.id === currentAttempt?.testId);

  // All attempts for this test sorted chronologically
  const testAttempts = useMemo(() => {
    if (!test) return [];
    return attempts
      .filter(a => a.testId === test.id && a.completed)
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  }, [attempts, test]);

  // Selected attempt index (1-based)
  const currentAttemptIndex = useMemo(() => {
    const idx = testAttempts.findIndex(a => a.id === currentAttempt?.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [testAttempts, currentAttempt]);

  // Tab mode: 'analysis' (Default screenshot view) or 'solutions' (Question by Question)
  const viewMode = searchParams.get('mode') === 'solutions' ? 'solutions' : 'analysis';

  const setViewMode = (mode: 'analysis' | 'solutions') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (mode === 'solutions') {
        next.set('mode', 'solutions');
      } else {
        next.delete('mode');
      }
      return next;
    });
  };

  // Questions Review state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

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

  if (!currentAttempt || !test) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Test Attempt Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          The requested test attempt record might have been deleted or does not exist.
        </p>
        <button
          onClick={() => navigate('/tests')}
          className="mt-6 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          Go to Tests
        </button>
      </div>
    );
  }

  // Add derivedTimeLimit to handle missing overall derivedTimeLimit when section times are provided
  const derivedTimeLimit = useMemo(() => {
    if (test && test.timeLimit && test.timeLimit > 0) return test.timeLimit;
    if (test?.sections && test.sections.length > 0) {
      const sum = test.sections.reduce((acc: number, sec: any) => acc + (sec.timeLimit || 0), 0);
      if (sum > 0) return sum;
    }
    return 3600; // default 1 hour
  }, [test]);

  // Marking Scheme Calculations
  const positiveMarks = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
  const negativeMarks = test.negativeMarks ?? (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
  const maxPossibleMarks = (test.questions?.length || 0) * positiveMarks;

  const grossMarks = currentAttempt.correctAnswers * positiveMarks;
  const negativePenalty = currentAttempt.incorrectAnswers * negativeMarks;
  const netMarks = currentAttempt.score !== undefined 
    ? currentAttempt.score 
    : Number((grossMarks - negativePenalty).toFixed(2));

  const totalQuestions = test.questions?.length || 0;
  const attemptedCount = currentAttempt.correctAnswers + currentAttempt.incorrectAnswers;
  const accuracy = attemptedCount > 0 
    ? Math.round((currentAttempt.correctAnswers / attemptedCount) * 100) 
    : 0;

  // Format Duration (seconds to MM:SS or HH:MM:SS)
  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Section Breakdown & Sectional Cutoffs
  const sectionStats = useMemo(() => {
    const sectionsMap = new Map<string, {
      name: string;
      totalQuestions: number;
      correct: number;
      incorrect: number;
      unanswered: number;
      timeSpent: number;
      timeLimit: number;
    }>();

    // Map defined sections or auto-extract
    if (test.sections && test.sections.length > 0) {
      test.sections.forEach(sec => {
        const secName = typeof sec.name === 'object' ? (sec.name['en'] || 'Section') : String(sec.name);
        sectionsMap.set(secName, {
          name: secName,
          totalQuestions: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          timeSpent: 0,
          timeLimit: sec.timeLimit || Math.floor((derivedTimeLimit || 3600) / test.sections.length)
        });
      });
    }

    test.questions.forEach(q => {
      const sec = q.section || 'General Section';
      if (!sectionsMap.has(sec)) {
        sectionsMap.set(sec, {
          name: sec,
          totalQuestions: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          timeSpent: 0,
          timeLimit: Math.floor((derivedTimeLimit || 3600) / (sectionsMap.size + 1))
        });
      }

      const item = sectionsMap.get(sec)!;
      item.totalQuestions += 1;

      const userAns = currentAttempt.answers[q.id];
      const qTime = currentAttempt.timeSpent?.[q.id] || 0;
      item.timeSpent += qTime;

      if (!userAns) {
        item.unanswered += 1;
      } else if (userAns === q.correctOptionId) {
        item.correct += 1;
      } else {
        item.incorrect += 1;
      }
    });

    return Array.from(sectionsMap.values()).map(sec => {
      const secGross = sec.correct * positiveMarks;
      const secPenalty = sec.incorrect * negativeMarks;
      const secScore = Math.max(0, Number((secGross - secPenalty).toFixed(2)));
      const secMaxMarks = sec.totalQuestions * positiveMarks;
      const secAttempted = sec.correct + sec.incorrect;
      const secAccuracy = secAttempted > 0 ? Math.round((sec.correct / secAttempted) * 100) : 0;

              return {
        ...sec,
        score: secScore,
        maxMarks: secMaxMarks,
        attempted: secAttempted,
        accuracy: secAccuracy,

      };
    });
  }, [test, currentAttempt, positiveMarks, negativeMarks, ]);

  // Total time spent across all questions
  const totalTimeSpentSeconds = useMemo(() => {
    if (currentAttempt.durationMs) {
      return Math.floor(currentAttempt.durationMs / 1000);
    }
    if (currentAttempt.timeSpent && Object.keys(currentAttempt.timeSpent).length > 0) {
      return Object.values(currentAttempt.timeSpent).reduce((acc, t) => acc + ((t as number) || 0), 0);
    }
    if (currentAttempt.startTime && currentAttempt.endTime) {
      return Math.floor((currentAttempt.endTime - currentAttempt.startTime) / 1000);
    }
    return 0;
  }, [currentAttempt]);

  // Formatted date string for attempt banner
  const formattedAttemptDate = useMemo(() => {
    const timestamp = currentAttempt.endTime || currentAttempt.startTime || Date.now();
    const d = new Date(timestamp);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }, [currentAttempt]);

  // Rating handler
  // Google Search for Question solution
  const handleGoogleSearch = () => {
    const currentQ = test.questions[currentQuestionIndex];
    if (!currentQ) return;
    const qText = getLocalizedText(currentQ.text, language);
    const optionsText = currentQ.options.map((opt: any, index: number) => `option ${index + 1}: ${getLocalizedText(opt.text, language)}`).join(', ');
    const query = encodeURIComponent(`${qText} ${optionsText} explain the answer and step by step solution`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  // Filtered questions for Solutions mode
  const filteredQuestions = test.questions.filter(q => {
    const userAns = currentAttempt.answers[q.id];
    const isCorr = userAns === q.correctOptionId;
    if (filter === 'all') return true;
    if (filter === 'correct') return isCorr;
    if (filter === 'incorrect') return !isCorr && userAns;
    if (filter === 'unanswered') return !userAns;
    return true;
  });

  const currentFilteredIndex = filteredQuestions.findIndex(q => q.id === test.questions[currentQuestionIndex]?.id);

  const handlePrevious = () => {
    if (currentFilteredIndex > 0) {
      const prevQ = filteredQuestions[currentFilteredIndex - 1];
      const origIdx = test.questions.findIndex(tq => tq.id === prevQ.id);
      setCurrentQuestionIndex(origIdx);
    }
  };

  const handleNext = () => {
    if (currentFilteredIndex < filteredQuestions.length - 1) {
      const nextQ = filteredQuestions[currentFilteredIndex + 1];
      const origIdx = test.questions.findIndex(tq => tq.id === nextQ.id);
      setCurrentQuestionIndex(origIdx);
    }
  };

  const currentQuestion = test.questions[currentQuestionIndex];
  const userAnswer = currentAttempt.answers[currentQuestion?.id];
  const isCorrect = userAnswer === currentQuestion?.correctOptionId;
  const isUnanswered = !userAnswer;
  const qText = getLocalizedText(currentQuestion?.text, language);
  const expText = currentQuestion?.explanation?.[language] || currentQuestion?.explanation?.['en'];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16 selection:bg-cyan-500 selection:text-white" id="test-analysis-root">
      
      {/* 1. TOP HEADER / NAVBAR (Exact Testbook Style) */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Brand & Exam Title */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
            <div 
              onClick={() => navigate('/tests')}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              title="Go to all tests"
            >
              <div className="bg-blue-600 w-8 h-8 rounded-xl shadow-sm text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight hidden sm:inline">
                Mockly
              </span>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate" title={test.title}>
                {test.title}
              </h1>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Paper: {getTestDisplayDate(test)}
              </span>
            </div>
          </div>

          {/* Right: Actions Bar */}
          <div className="flex items-center gap-2.5 sm:gap-4 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
            
            {/* Reattempt Button */}
            <button
              onClick={() => navigate(`/test/${test.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-50/80 hover:bg-cyan-100/90 border border-cyan-300 text-cyan-700 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0"
            >
              <span>Reattempt This Test</span>
              <div className="w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </button>


            {/* Navigation links & Solutions Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/tests')}
                className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-cyan-700 transition-colors"
              >
                Go to Tests
              </button>
              
              <span className="text-xs text-slate-400 font-medium">or</span>

              {viewMode === 'analysis' ? (
                <button
                  onClick={() => setViewMode('solutions')}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-cyan-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Solutions</span>
                </button>
              ) : (
                <button
                  onClick={() => setViewMode('analysis')}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Analysis</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* 2. ATTEMPT TABS (Attempt 1, Attempt 2...) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-0">
          <div className="flex items-center gap-6 overflow-x-auto">
            {testAttempts.length > 0 ? (
              testAttempts.map((att, index) => {
                const attNum = index + 1;
                const isActive = att.id === currentAttempt.id;
                return (
                  <button
                    key={att.id}
                    onClick={() => {
                      if (att.id !== currentAttempt.id) {
                        navigate(`/review/${att.id}${viewMode === 'solutions' ? '?mode=solutions' : ''}`);
                      }
                    }}
                    className={cn(
                      "pb-3 text-sm font-bold transition-all relative whitespace-nowrap",
                      isActive
                        ? "text-cyan-600 border-b-2 border-cyan-500"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Attempt {attNum}
                  </button>
                );
              })
            ) : (
              <div className="pb-3 text-sm font-bold text-cyan-600 border-b-2 border-cyan-500">
                Attempt 1
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {availableLanguages.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>Lang:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-white border border-slate-300 rounded-md text-xs py-1 px-2 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {availableLanguages.map(l => (
                    <option key={l} value={l}>
                      {l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : l.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete this attempt record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. ATTEMPT NOTICE BANNER */}
        <div className="bg-[#f1f5f9] border border-slate-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Attempt {currentAttemptIndex} was made on {formattedAttemptDate}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentAttempt.durationMs !== undefined && (
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Duration: {Math.floor(currentAttempt.durationMs / 60000)}m {Math.floor((currentAttempt.durationMs % 60000) / 1000)}s
              </span>
            )}
            {currentAttempt.savedToDriveAt ? (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <HardDrive className="w-3 h-3 text-emerald-600" />
                <span>Google Drive Synced</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW MODE: TEST ANALYSIS (EXACT SCREENSHOT LAYOUT)        */}
        {/* ========================================================= */}
        {viewMode === 'analysis' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* 4. OVERALL PERFORMANCE SUMMARY */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Overall Performance Summary
              </h2>

              <div className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-center">
                  
                  {/* Metric 1: Score */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#7c4dff] text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {netMarks} <span className="text-xs sm:text-sm font-normal text-slate-400">/ {maxPossibleMarks}</span>
                      </p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Net Score
                      </p>
                    </div>
                  </div>

                  {/* Metric 2: Accuracy */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#00c853] text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {accuracy}%
                      </p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Accuracy ({currentAttempt.correctAnswers}/{attemptedCount || 0})
                      </p>
                    </div>
                  </div>

                  {/* Metric 3: Attempted */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#00bcd4] text-white flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {attemptedCount} <span className="text-xs sm:text-sm font-normal text-slate-400">/ {totalQuestions}</span>
                      </p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Questions Attempted
                      </p>
                    </div>
                  </div>

                  {/* Metric 4: Time Taken */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {formatTime(totalTimeSpentSeconds)}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Time Spent
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* 5. SECTIONAL SUMMARY TABLE */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Sectional Summary
                </h2>

              </div>

              {/* Clean Structured Sectional Table */}
              <div className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6 w-1/3">Section Name</th>
                        <th className="py-3.5 px-4 sm:px-6">Score</th>
                        <th className="py-3.5 px-4 sm:px-6">Attempted</th>
                        <th className="py-3.5 px-4 sm:px-6">Accuracy</th>
                        <th className="py-3.5 px-4 sm:px-6">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {sectionStats.map((sec, idx) => {
                        const secTimeFormatted = formatTime(sec.timeSpent);
                        const secLimitFormatted = `${Math.floor(sec.timeLimit / 60)} min`;
                        const timeRatio = Math.min(100, Math.round((sec.timeSpent / (sec.timeLimit || 1)) * 100));

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            {/* Section Name */}
                            <td className="py-4 px-4 sm:px-6 font-bold text-slate-800">
                              {sec.name}
                            </td>

                            {/* Score Column (Soft Purple Background) */}
                            <td className="py-4 px-4 sm:px-6 bg-[#f5f3ff]/60 border-l border-r border-purple-100/50">
                              <div className="font-black text-slate-900">
                                {sec.score} <span className="font-normal text-slate-400">/ {sec.maxMarks}</span>
                              </div>
                            </td>

                            {/* Attempted Column (Soft Cyan Background) */}
                            <td className="py-4 px-4 sm:px-6 bg-[#ecfeff]/60 border-r border-cyan-100/50 font-black text-slate-900">
                              {sec.attempted} <span className="font-normal text-slate-400">/ {sec.totalQuestions}</span>
                            </td>

                            {/* Accuracy Column (Soft Green Background) */}
                            <td className="py-4 px-4 sm:px-6 bg-[#f0fdf4]/60 border-r border-emerald-100/50 font-black text-slate-900">
                              {sec.accuracy}%
                            </td>

                            {/* Time Column */}
                            <td className="py-4 px-4 sm:px-6">
                              <div className="font-mono text-slate-700 font-semibold">
                                {secTimeFormatted} <span className="text-slate-400 font-normal">/ {secLimitFormatted}</span>
                              </div>
                              {/* Inline mini progress meter */}
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className="h-full bg-amber-400 rounded-full" 
                                  style={{ width: `${Math.max(5, timeRatio)}%` }} 
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total / Overall Row */}
                      <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200">
                        <td className="py-4 px-4 sm:px-6 bg-[#f5f3ff]/90 border-l border-r border-purple-200/70">
                          <div className="font-black text-slate-900">
                            {netMarks} <span className="font-normal text-slate-400">/ {maxPossibleMarks}</span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 bg-[#f0fdf4]/90 border-r border-emerald-200/70 font-black text-slate-900">
                          {accuracy}%
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-slate-900">
                          {formatTime(totalTimeSpentSeconds)} <span className="text-slate-400 font-normal">/ {Math.floor((derivedTimeLimit || 3600) / 60)} min</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 6. Score Breakdown & Detailed Stats Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Sectional Performance Bar Chart */}
              <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Sectional Accuracy & Answer Distribution</span>
                  <span className="text-xs font-normal text-slate-400 lowercase">correct vs incorrect vs skipped</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectionStats} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="correct" name="Correct" stackId="a" fill="#00c853" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="incorrect" name="Incorrect" stackId="a" fill="#e53935" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="unanswered" name="Skipped" stackId="a" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Col: Marking Scheme & Solutions Callout */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Marking Breakdown
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
                      <span className="font-medium">Correct Marks (+)</span>
                      <span className="font-black">+{grossMarks.toFixed(1)} ({currentAttempt.correctAnswers} × +{positiveMarks})</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-100">
                      <span className="font-medium">Negative Penalty (-)</span>
                      <span className="font-black">-{negativePenalty.toFixed(2)} ({currentAttempt.incorrectAnswers} × -{negativeMarks})</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-100">
                      <span className="font-bold">Net Final Score</span>
                      <span className="font-black text-sm">{netMarks} / {maxPossibleMarks}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-5 text-white shadow-md shadow-cyan-500/20 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-base mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Question Solutions
                    </h4>
                    <p className="text-xs text-cyan-50 leading-relaxed">
                      Review detailed question-by-question solutions, step-by-step math breakdowns, and correct answer explanations.
                    </p>
                  </div>
                  <button
                    onClick={() => setViewMode('solutions')}
                    className="mt-4 w-full py-2.5 bg-white hover:bg-cyan-50 text-cyan-800 font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>View All Solutions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </section>

          </div>
        ) : (
          /* ========================================================= */
          /* VIEW MODE: SOLUTIONS (QUESTION-BY-QUESTION REVIEW)        */
          /* ========================================================= */
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Top Bar for Solutions */}
            <div className="bg-white p-3 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('analysis')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Analysis
                </button>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs font-bold text-slate-700">
                  Question Solutions ({test.questions.length} Total)
                </span>
              </div>

              {/* Quick filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <button 
                  onClick={() => setFilter('all')}
                  className={cn(
                    "py-1 px-3 rounded-lg border text-xs font-bold transition-colors", 
                    filter === 'all' ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  All ({test.questions.length})
                </button>
                <button 
                  onClick={() => setFilter('correct')}
                  className={cn(
                    "py-1 px-3 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1", 
                    filter === 'correct' ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50"
                  )}
                >
                  <CheckCircle className="w-3 h-3" /> Correct ({currentAttempt.correctAnswers})
                </button>
                <button 
                  onClick={() => setFilter('incorrect')}
                  className={cn(
                    "py-1 px-3 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1", 
                    filter === 'incorrect' ? "bg-rose-600 text-white border-rose-600" : "bg-rose-50/60 text-rose-700 border-rose-200 hover:bg-rose-100/50"
                  )}
                >
                  <XCircle className="w-3 h-3" /> Incorrect ({currentAttempt.incorrectAnswers})
                </button>
                <button 
                  onClick={() => setFilter('unanswered')}
                  className={cn(
                    "py-1 px-3 rounded-lg border text-xs font-bold transition-colors", 
                    filter === 'unanswered' ? "bg-slate-600 text-white border-slate-600" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  )}
                >
                  Skipped ({test.questions.length - attemptedCount})
                </button>
              </div>
            </div>

            {/* Split layout: Question Palette & Solution viewer */}
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Left Question Palette */}
              <div className="lg:w-80 shrink-0 bg-white rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-[320px] lg:h-[620px]">
                <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Questions Palette
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00c853]" /> Correct</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e53935]" /> Wrong</span>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-3 space-y-4 custom-scrollbar">
                  {Array.from(new Set(filteredQuestions.map(q => q.section))).map(sec => (
                    <div key={sec}>
                      <div className="bg-slate-100/80 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md mb-2">
                        {sec}
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {filteredQuestions.map(q => {
                          if (q.section !== sec) return null;
                          const idx = test.questions.findIndex(tq => tq.id === q.id);
                          const uAns = currentAttempt.answers[q.id];
                          const isCorr = uAns === q.correctOptionId;
                          const isActive = currentQuestionIndex === idx;

                          let bgClass = "bg-white text-slate-700 border-slate-300";
                          if (uAns) {
                            bgClass = isCorr ? "bg-[#00c853] text-white border-[#00c853]" : "bg-[#e53935] text-white border-[#e53935]";
                          }

                          return (
                            <button
                              key={q.id}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border transition-all hover:scale-105",
                                bgClass,
                                isActive && "ring-2 ring-cyan-500 ring-offset-2 scale-110 shadow-sm"
                              )}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {filteredQuestions.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10">No questions match this filter.</p>
                  )}
                </div>
              </div>

              {/* Right Solution View */}
              {currentQuestion && (
                <div className="flex-1 bg-white rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-4 sm:p-5 space-y-4 min-w-0">
                  
                  {/* Question Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {currentQuestion.section}
                      </span>
                      <h4 className="text-base font-bold text-slate-800">
                        Question {currentQuestionIndex + 1}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUnanswered ? (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">Unanswered</span>
                      ) : isCorrect ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Correct (+{positiveMarks})
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incorrect (-{negativeMarks})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm text-slate-800 leading-relaxed markdown-body">
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {qText || ''}
                    </Markdown>
                    <MediaViewer media={currentQuestion.media} />
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    {currentQuestion.options.map((option, idx) => {
                      const isOptSelected = userAnswer === option.id;
                      const isOptCorrect = currentQuestion.correctOptionId === option.id;
                      const optText = getLocalizedText(option.text, language);
                      const label = String.fromCharCode(65 + idx);

                      let containerClass = "border-slate-200 bg-slate-50/50 text-slate-700";
                      let badgeClass = "bg-white border-slate-300 text-slate-500";

                      if (isOptCorrect) {
                        containerClass = "border-emerald-500 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500";
                        badgeClass = "bg-emerald-600 border-emerald-600 text-white font-bold";
                      } else if (isOptSelected && !isOptCorrect) {
                        containerClass = "border-rose-500 bg-rose-50/40 text-rose-950 ring-1 ring-rose-500";
                        badgeClass = "bg-rose-600 border-rose-600 text-white font-bold";
                      }

                      return (
                        <div
                          key={option.id}
                          className={cn("flex items-start p-3 rounded-xl border transition-all text-xs sm:text-sm", containerClass)}
                        >
                          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs mr-3 shrink-0 border mt-0.5", badgeClass)}>
                            {isOptCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : isOptSelected && !isOptCorrect ? <XCircle className="w-3.5 h-3.5" /> : label}
                          </div>
                          <div className="flex-1 leading-normal markdown-body">
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {optText || ''}
                            </Markdown>
                            <MediaViewer media={option.media} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {expText && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 mt-4 space-y-1.5">
                      <h5 className="font-bold text-indigo-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Explanation & Solution:
                      </h5>
                      <div className="text-xs sm:text-sm text-indigo-950 leading-relaxed markdown-body">
                        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {expText || ''}
                        </Markdown>
                        <MediaViewer media={currentQuestion.explanationMedia} />
                      </div>
                    </div>
                  )}

                  {/* Footer Action Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      onClick={handleGoogleSearch}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" /> Search Explanation on Google
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <button
                        onClick={handlePrevious}
                        disabled={currentFilteredIndex <= 0}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={currentFilteredIndex >= filteredQuestions.length - 1}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow-sm"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Delete Attempt Modal */}
      {createPortal(
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative z-10"
              >
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Delete Attempt Record?</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to delete this test attempt record? You will be navigated back to your tests overview.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteAttempt(currentAttempt.id);
                      setShowDeleteModal(false);
                      navigate('/tests');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm text-xs"
                  >
                    Delete Record
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
