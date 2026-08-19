import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  BrainCircuit, 
  List, 
  Sparkles,
  Search,
  ExternalLink,
  BookOpen,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { cn, getLocalizedText } from '../lib/utils';
import { Language } from '../types';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function TestAnswers() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { tests, language, setLanguage } = useStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'list'>('single');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const test = tests.find(t => t.id === testId);

  // Extract sections
  const sectionsList = useMemo(() => {
    if (!test) return [];
    const names: string[] = [];
    if (Array.isArray(test.sections) && test.sections.length > 0) {
      test.sections.forEach((sec: any) => {
        const name = typeof sec === 'string'
          ? sec
          : (sec && typeof sec?.name === 'object' ? (sec.name[language] || sec.name['en'] || 'Section') : String(sec?.name || 'Section'));
        if (name && !names.includes(name)) names.push(name);
      });
    }

    test.questions.forEach((q) => {
      const secObj: any = q.section;
      const secName = secObj && typeof secObj === 'object'
        ? (secObj[language] || secObj['en'] || 'General')
        : String(secObj || 'General');
      if (secName && !names.includes(secName)) {
        names.push(secName);
      }
    });

    return names;
  }, [test, language]);

  // Keyboard navigation for fast jumping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (viewMode !== 'single' || !test) return;

      if (e.key === 'ArrowRight' || e.key === 'j') {
        if (currentQuestionIndex < test.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, test, viewMode]);

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

  if (!test) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center py-12">
        <h2 className="text-lg font-bold text-slate-800">Test not found</h2>
        <button onClick={() => navigate('/tests')} className="mt-3 text-cyan-600 hover:underline text-xs font-bold">
          Back to Tests
        </button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex] || test.questions[0];
  const qText = currentQuestion?.text?.[language] || currentQuestion?.text?.['en'] || '';
  const explanation = currentQuestion?.explanation?.[language] || currentQuestion?.explanation?.['en'] || '';

  const currentSecObj: any = currentQuestion?.section;
  const currentSectionName = currentSecObj && typeof currentSecObj === 'object'
    ? (currentSecObj[language] || currentSecObj['en'] || 'General')
    : String(currentSecObj || 'General');

  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleGoogleSearch = (q: typeof currentQuestion) => {
    if (!q) return;
    const qTextStr = q.text?.[language] || q.text?.['en'] || '';
    const optionsText = q.options
      .map((opt: any, index: number) => {
        const optStr = typeof opt.text === 'object' ? (getLocalizedText(opt.text, language)) : opt.text;
        return `option ${index + 1}: ${optStr}`;
      })
      .join(', ');
    const query = encodeURIComponent(`${qTextStr} ${optionsText} explain answer step by step`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  // Filtered questions for list view or search
  const filteredQuestions = test.questions.filter((q, idx) => {
    const secObj: any = q.section;
    const secName = secObj && typeof secObj === 'object'
      ? (secObj[language] || secObj['en'] || 'General')
      : String(secObj || 'General');
    
    if (selectedSection !== 'all' && secName !== selectedSection) return false;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const txt = (q.text?.[language] || q.text?.['en'] || '').toLowerCase();
      const qNum = (idx + 1).toString();
      return txt.includes(query) || qNum === query;
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-2.5 font-sans text-slate-800 pb-10" id="test-answers-root">
      
      {/* 1. ULTRA-COMPACT TOP TOOLBAR */}
      <div className="bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Left: Back + Compact Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => navigate(`/test-details/${test.id}`)}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Back to Test Details"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="truncate">
            <h1 className="font-bold text-slate-800 text-xs sm:text-sm truncate flex items-center gap-1.5">
              <span className="truncate">{test.title}</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-bold shrink-0">
                Answer Key
              </span>
            </h1>
            <span className="text-[11px] text-slate-400 font-medium">
              {test.questions.length} Questions total
            </span>
          </div>
        </div>

        {/* Right: View Toggle, Filter & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Section Filter dropdown if multi-section */}
          {sectionsList.length > 1 && (
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold py-1 px-2 text-slate-700 focus:outline-none"
            >
              <option value="all">All Sections ({test.questions.length})</option>
              {sectionsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Language Switcher */}
          {availableLanguages.length > 1 && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold py-1 px-2 text-slate-700 focus:outline-none"
            >
              {availableLanguages.map(l => (
                <option key={l} value={l}>
                  {l === 'en' ? 'EN' : l === 'hi' ? 'HI' : l.toUpperCase()}
                </option>
              ))}
            </select>
          )}

          {/* Mode Switcher: Compact Single vs Full List */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('single')}
              className={cn(
                "px-2 py-0.5 rounded-md text-[11px] font-bold transition-all",
                viewMode === 'single' ? "bg-white text-cyan-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Focus View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-2 py-0.5 rounded-md text-[11px] font-bold transition-all",
                viewMode === 'list' ? "bg-white text-cyan-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              List All (1-Page)
            </button>
          </div>

          {/* Google Search Button */}
          <button
            onClick={() => handleGoogleSearch(currentQuestion)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
            title="Search explanation on Google"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Search Solution</span>
          </button>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. MODE A: HIGH-DENSITY SPLIT FOCUS VIEW (ZERO SCROLL)    */}
      {/* ========================================================= */}
      {viewMode === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
          
          {/* Left: Always-Visible Compact Question Navigator (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Question Navigator
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {currentQuestionIndex + 1} / {test.questions.length} (Keys: ← →)
              </span>
            </div>

            {/* Compact Grid by Sections */}
            <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1 custom-scrollbar">
              {(sectionsList.length > 0 ? sectionsList : ['General']).map(sec => {
                const secQs = test.questions
                  .map((q, idx) => ({ ...q, globalIdx: idx }))
                  .filter(q => {
                    const secObj: any = q.section;
                    const sName = secObj && typeof secObj === 'object' 
                      ? (secObj[language] || secObj['en'] || 'General') 
                      : String(secObj || 'General');
                    return sectionsList.length <= 1 || sName === sec;
                  });

                if (secQs.length === 0) return null;

                return (
                  <div key={sec} className="space-y-1">
                    {sectionsList.length > 1 && (
                      <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate">
                        {sec} ({secQs.length})
                      </div>
                    )}
                    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-1">
                      {secQs.map(q => {
                        const isSelected = currentQuestionIndex === q.globalIdx;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(q.globalIdx)}
                            className={cn(
                              "h-7 rounded text-[11px] font-bold transition-all border flex flex-col items-center justify-center relative",
                              isSelected 
                                ? "bg-cyan-600 text-white border-cyan-600 ring-2 ring-cyan-500/50 shadow-2xs scale-105 z-10" 
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            )}
                            title={`Question ${q.globalIdx + 1}: Correct is (${q.correctOptionId?.toUpperCase()})`}
                          >
                            <span>{q.globalIdx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Ultra-Compact Question & Answer Box (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-4 space-y-3">
            
            {/* Question Header */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-600 text-white rounded font-black text-xs">
                  Q{currentQuestionIndex + 1}
                </span>
                <span className="font-bold text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                  {currentSectionName}
                </span>
              </div>

              {/* Correct Answer Badge */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Correct: Option {currentQuestion.correctOptionId?.toUpperCase()}</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed markdown-body">
              <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {qText}
              </Markdown>
            </div>

            {/* Options List - Ultra-Compact (Slim, space-efficient rows) */}
            <div className="space-y-1.5 pt-1">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = option.id?.toLowerCase() === currentQuestion.correctOptionId?.toLowerCase();
                const optText = option.text && typeof option.text === 'object'
                  ? (getLocalizedText(option.text, language) || '')
                  : String(option.text || '');
                const label = String.fromCharCode(65 + idx);

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center px-3 py-1.5 rounded-lg border text-xs transition-all",
                      isCorrect 
                        ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500/40" 
                        : "bg-slate-50/50 border-slate-200 text-slate-700"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold mr-2.5 shrink-0 border",
                      isCorrect 
                        ? "bg-emerald-600 text-white border-emerald-600" 
                        : "bg-white text-slate-500 border-slate-300"
                    )}>
                      {isCorrect ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : label}
                    </div>
                    <div className="flex-1 leading-snug markdown-body truncate sm:whitespace-normal">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {optText}
                      </Markdown>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation & Solution - Tight Box */}
            <div className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1 text-cyan-800">
                  <Sparkles className="w-3 h-3 text-cyan-600" /> Explanation / Solution:
                </span>
                <button
                  onClick={() => handleGoogleSearch(currentQuestion)}
                  className="text-purple-700 hover:text-purple-900 text-[10px] font-bold flex items-center gap-1 underline"
                >
                  <BrainCircuit className="w-3 h-3" /> Search Google
                </button>
              </div>
              <div className="text-slate-800 leading-normal text-[11px] sm:text-xs markdown-body">
                {explanation ? (
                  <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {explanation}
                  </Markdown>
                ) : (
                  <span className="text-slate-400 italic">Option {currentQuestion.correctOptionId?.toUpperCase()} is the correct answer.</span>
                )}
              </div>
            </div>

            {/* Fast Navigation Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                Question <strong className="text-slate-800">{currentQuestionIndex + 1}</strong> of <strong className="text-slate-800">{test.questions.length}</strong>
              </span>

              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === test.questions.length - 1}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow-2xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* ========================================================= */
        /* 3. MODE B: FULL LIST (ALL QUESTIONS IN ONE COMPACT PLACE) */
        /* ========================================================= */
        <div className="space-y-2.5">
          <div className="bg-cyan-50/70 border border-cyan-200 px-3 py-1.5 rounded-lg text-xs text-cyan-900 font-medium flex items-center justify-between">
            <span>Showing all <strong>{filteredQuestions.length}</strong> questions with answers and solutions</span>
            <button
              onClick={() => setViewMode('single')}
              className="text-[11px] font-bold text-cyan-800 underline hover:text-cyan-950"
            >
              Switch to Single Question View
            </button>
          </div>

          <div className="space-y-2">
            {filteredQuestions.map((q, index) => {
              const globalIdx = test.questions.findIndex(item => item.id === q.id);
              const qTextStr = q.text?.[language] || q.text?.['en'] || '';
              const expStr = q.explanation?.[language] || q.explanation?.['en'] || '';
              const secObj: any = q.section;
              const secName = secObj && typeof secObj === 'object' ? (secObj[language] || secObj['en'] || 'General') : String(secObj || 'General');

              return (
                <div 
                  key={q.id}
                  className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 text-xs"
                >
                  {/* Row Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-800 text-white font-bold rounded text-[10px]">
                        Q{globalIdx + 1}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{secName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Answer: Option {q.correctOptionId?.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleGoogleSearch(q)}
                        className="text-purple-600 hover:text-purple-800 p-0.5 text-[10px]"
                        title="Search on Google"
                      >
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="font-semibold text-slate-800 leading-snug markdown-body">
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {qTextStr}
                    </Markdown>
                  </div>

                  {/* Options 2x2 or 4x1 Compact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = opt.id?.toLowerCase() === q.correctOptionId?.toLowerCase();
                      const optText = opt.text && typeof opt.text === 'object'
                        ? (getLocalizedText(opt.text, language) || '')
                        : String(opt.text || '');
                      const label = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-center px-2 py-1 rounded border text-[11px]",
                            isCorrect 
                              ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold" 
                              : "bg-slate-50/50 border-slate-200 text-slate-600"
                          )}
                        >
                          <span className={cn(
                            "w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center mr-1.5 shrink-0",
                            isCorrect ? "bg-emerald-600 text-white" : "bg-white text-slate-500 border border-slate-300"
                          )}>
                            {label}
                          </span>
                          <span className="truncate leading-tight markdown-body">
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {optText}
                            </Markdown>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Short Explanation if available */}
                  {expStr && (
                    <div className="bg-slate-50 border-l-2 border-cyan-500 p-1.5 text-[11px] text-slate-600 rounded-r markdown-body">
                      <strong>Solution: </strong>
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {expStr}
                      </Markdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
