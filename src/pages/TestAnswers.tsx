import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useHeader } from '../contexts/HeaderContext';
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Grid, X, Sparkles, BrainCircuit } from 'lucide-react';
import { cn, getLocalizedText } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'motion/react';

export default function TestAnswers() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { tests, language } = useStore();
  const { setHeaderContent } = useHeader();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const test = tests.find(t => t.id === testId);

  // Extract sections
  const sectionsList = useMemo(() => {
    if (!test) return ['General'];
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

    if (names.length === 0) names.push('General');
    return names;
  }, [test, language]);

  // Set Palette in Header (left of profile icon)
  useEffect(() => {
    if (!test) {
      setHeaderContent(null);
      return;
    }

    setHeaderContent(
      <div className="relative flex items-center">
        <button
          onClick={() => setIsPaletteOpen(prev => !prev)}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          title="Toggle Question Palette"
        >
          <Grid className="w-4 h-4" />
          <span className="hidden sm:inline">Palette</span>
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[11px] font-black">
            {currentQuestionIndex + 1}/{test.questions.length}
          </span>
        </button>

        {/* Floating Palette Dropdown */}
        <AnimatePresence>
          {isPaletteOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-2xs"
                onClick={() => setIsPaletteOpen(false)}
              />

              {/* Dropdown Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 8 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[75vh] z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
              >
                {/* Palette Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                      <Grid className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Questions Palette</h3>
                      <p className="text-[11px] text-slate-500">{test.questions.length} Total Questions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPaletteOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sections & Question Buttons Grid */}
                <div className="flex-1 overflow-y-auto max-h-[55vh] divide-y divide-slate-100">
                  {sectionsList.map((secName) => {
                    const secQuestions = test.questions.filter((q) => {
                      const qSecObj: any = q.section;
                      const qSec = qSecObj && typeof qSecObj === 'object'
                        ? (qSecObj[language] || qSecObj['en'] || 'General')
                        : String(qSecObj || 'General');
                      return sectionsList.length === 1 || qSec === secName;
                    });

                    if (secQuestions.length === 0) return null;

                    return (
                      <div key={secName} className="flex flex-col">
                        {/* Teal Section Bar */}
                        <div className="bg-[#2a9aa9] text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>SECTION : {secName}</span>
                          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                            {secQuestions.length} Qs
                          </span>
                        </div>

                        {/* Question Grid */}
                        <div className="p-3 bg-slate-50/50 grid grid-cols-5 gap-2">
                          {secQuestions.map((q) => {
                            const globalIdx = test.questions.findIndex((item) => item.id === q.id);
                            const isSelected = currentQuestionIndex === globalIdx;

                            return (
                              <button
                                key={q.id}
                                onClick={() => {
                                  setCurrentQuestionIndex(globalIdx);
                                  setIsPaletteOpen(false);
                                }}
                                className={cn(
                                  "h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all border shadow-2xs cursor-pointer",
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500 ring-offset-2 scale-105 z-10"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                )}
                                title={`Question ${globalIdx + 1} (${secName})`}
                              >
                                {globalIdx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );

    return () => setHeaderContent(null);
  }, [test, currentQuestionIndex, isPaletteOpen, language, sectionsList, setHeaderContent]);

  if (!test) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold text-slate-900">Test not found</h2>
        <button onClick={() => navigate('/tests')} className="mt-4 text-blue-600 hover:underline font-semibold">
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

  const handleGoogleSearch = () => {
    if (!currentQuestion) return;
    const qTextStr = currentQuestion.text?.[language] || currentQuestion.text?.['en'] || '';
    const optionsText = currentQuestion.options
      .map((opt: any, index: number) => {
        const optStr = typeof opt.text === 'object' ? (getLocalizedText(opt.text, language)) : opt.text;
        return `option ${index + 1}: ${optStr}`;
      })
      .join(', ');
    const query = encodeURIComponent(`${qTextStr} ${optionsText} explain the answer and explain why other options are wrong`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 relative pb-16">
      {/* Top Header Information Card */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate(`/test-details/${test.id}`)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Back to Test Details"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span 
                onClick={() => navigate(`/test-details/${test.id}`)}
                className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                title="View Test Info"
              >
                {test.title}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                Answer Key
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{test.questions.length} Questions total</p>
          </div>
        </div>

        {/* Google Search Button in Page Header */}
        <button
          onClick={handleGoogleSearch}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer shadow-xs"
          title="Search Google for detailed explanations"
        >
          <BrainCircuit className="w-4 h-4 text-purple-600" />
          <span className="hidden sm:inline">Search Google for Explanations</span>
        </button>
      </div>

      {/* Question Card Container */}
      <div className="space-y-4">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 space-y-6"
          >
            {/* Question Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center shadow-xs">
                  Q{currentQuestionIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                  {currentSectionName}
                </span>
              </div>

              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Correct Answer: Option {currentQuestion.correctOptionId.toUpperCase()}</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base text-slate-800 leading-relaxed font-medium">
              <div className="markdown-body">
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText}</Markdown>
              </div>
            </div>

            {/* Options Grid */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option) => {
                const isCorrect = option.id === currentQuestion.correctOptionId;
                const optText = option.text && typeof option.text === 'object'
                  ? (getLocalizedText(option.text, language) || '')
                  : String(option.text || '');

                return (
                  <div 
                    key={option.id} 
                    className={cn(
                      "flex items-center p-4 rounded-2xl border-2 transition-all",
                      isCorrect 
                        ? "bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500" 
                        : "bg-white border-slate-100 text-slate-700"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold mr-4 shrink-0 shadow-xs transition-colors",
                      isCorrect 
                        ? "bg-emerald-600 text-white" 
                        : "bg-slate-50 text-slate-400 border border-slate-200"
                    )}>
                      {isCorrect ? <CheckCircle className="w-5 h-5 text-white" /> : option.id.toUpperCase()}
                    </div>
                    <span className={cn(
                      "text-sm leading-relaxed markdown-body",
                      isCorrect ? "font-bold text-emerald-950" : "font-medium text-slate-700"
                    )}>
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{optText}</Markdown>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Explanation Box & Google Search */}
            <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Explanation & Solution</span>
                </div>

                <button
                  onClick={handleGoogleSearch}
                  className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100/70 hover:bg-purple-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-purple-200"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                  <span>Search Google</span>
                </button>
              </div>

              {explanation ? (
                <div className="text-slate-700 leading-relaxed text-sm markdown-body">
                  <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{explanation}</Markdown>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No detailed explanation recorded for this question.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Previous / Next Navigation Footer */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleGoogleSearch}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4 text-purple-600" />
              <span>Search Google for Explanations</span>
            </button>

            <div className="text-xs font-semibold text-slate-500">
              Question <span className="font-black text-slate-800">{currentQuestionIndex + 1}</span> of{' '}
              <span className="font-black text-slate-800">{test.questions.length}</span>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === test.questions.length - 1}
            className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
