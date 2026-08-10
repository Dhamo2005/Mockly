import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CheckCircle, XCircle, ArrowLeft, BrainCircuit, BarChart2, ListTodo, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Language } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function ReviewInterface() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { attempts, tests, language, setLanguage, srsItems, processSRSReview } = useStore();
  
  const attempt = attempts.find(a => a.id === attemptId);
  const test = tests.find(t => t.id === attempt?.testId);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [activeTab, setActiveTab] = useState<'questions' | 'analytics'>('analytics');
  
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

  const handleGoogleSearch = () => {
    if (!currentQuestion) return;
    const qText = currentQuestion.text[language] || currentQuestion.text['en'];
    const optionsText = currentQuestion.options.map((opt: any, index: number) => `option ${index + 1}: ${opt.text[language] || opt.text['en']}`).join(', ');
    const query = encodeURIComponent(`${qText} ${optionsText} explain the answer and explain why other options are wrong`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const sectionStats = useMemo(() => {
    if (!test || !attempt) return [];
    
    const statsMap: Record<string, { name: string; total: number; correct: number; incorrect: number; unanswered: number }> = {};
    
    test.questions.forEach(q => {
      if (!statsMap[q.section]) {
        statsMap[q.section] = { name: q.section, total: 0, correct: 0, incorrect: 0, unanswered: 0 };
      }
      statsMap[q.section].total++;
      
      const ans = attempt.answers[q.id];
      if (!ans) {
        statsMap[q.section].unanswered++;
      } else if (ans === q.correctOptionId) {
        statsMap[q.section].correct++;
      } else {
        statsMap[q.section].incorrect++;
      }
    });
    
    return Object.values(statsMap);
  }, [test, attempt]);

  const weakestSection = useMemo(() => {
    if (sectionStats.length === 0) return null;
    return sectionStats.reduce((weakest, current) => {
      const currentAcc = current.correct / current.total;
      const weakestAcc = weakest.correct / weakest.total;
      return currentAcc < weakestAcc ? current : weakest;
    }, sectionStats[0]);
  }, [sectionStats]);

  if (!attempt || !test) return <div>Attempt not found</div>;

  const currentQuestion = test.questions[currentQuestionIndex];
  const userAnswer = attempt.answers[currentQuestion?.id];
  const isCorrect = userAnswer === currentQuestion?.correctOptionId;
  const isUnanswered = !userAnswer;
  
  const filteredQuestions = test.questions.filter(q => {
    const userAns = attempt.answers[q.id];
    const correct = userAns === q.correctOptionId;
    if (filter === 'all') return true;
    if (filter === 'correct') return correct;
    if (filter === 'incorrect') return !correct && userAns;
    if (filter === 'unanswered') return !userAns;
    return true;
  });
  const currentFilteredIndex = filteredQuestions.findIndex(q => q.id === currentQuestion?.id);
  
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


  const addToSRS = (qId: string) => {
    if (!srsItems[qId]) {
      processSRSReview(qId, 2);
    } else {
      alert('Already in Spaced Repetition queue.');
    }
  };

  const qText = currentQuestion?.text[language] || currentQuestion?.text['en'];
  const expText = currentQuestion?.explanation?.[language] || currentQuestion?.explanation?.['en'];

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Dashboard
        </button>
        
        {availableLanguages.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="border border-gray-300 rounded text-sm py-1 px-2"
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

      <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Test Result: {test.title}</h2>
          <p className="text-gray-500 mt-1">Completed on {new Date(attempt.endTime || 0).toLocaleString()}</p>
        </div>
        
        <div className="flex gap-3 p-1 bg-gray-100 rounded-lg self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'analytics' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'questions' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Questions
            </div>
          </button>
        </div>
        <div className="flex gap-3 text-center">
          <div>
            <p className="text-sm text-gray-500 font-medium">Score</p>
            <p className="text-base font-bold text-blue-600">{attempt.score} / {attempt.totalQuestions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Accuracy</p>
            <p className="text-base font-bold text-green-600">
              {attempt.totalQuestions > 0 ? Math.round((attempt.correctAnswers / (attempt.correctAnswers + attempt.incorrectAnswers || 1)) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
      
      {activeTab === 'analytics' ? (
        <div className="space-y-2 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3 bg-[var(--color-surface)] p-3 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Section Performance</h3>
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
        <div className="flex flex-col lg:flex-row gap-3 animate-in fade-in">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-2 shrink-0">
            <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Filters</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button 
                  onClick={() => setFilter('all')}
                  className={cn("py-2 px-3 rounded border font-medium", filter === 'all' ? "bg-gray-800 text-white border-gray-800" : "bg-gray-50 text-gray-700 border-gray-200")}
                >
                  All ({test.questions.length})
                </button>
                <button 
                  onClick={() => setFilter('correct')}
                  className={cn("py-2 px-3 rounded border font-medium flex justify-center items-center gap-1", filter === 'correct' ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-700 border-emerald-200")}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> ({attempt.correctAnswers})
                </button>
                <button 
                  onClick={() => setFilter('incorrect')}
                  className={cn("py-2 px-3 rounded border font-medium flex justify-center items-center gap-1", filter === 'incorrect' ? "bg-rose-600 text-white border-rose-600" : "bg-rose-50 text-rose-700 border-rose-200")}
                >
                  <XCircle className="w-3.5 h-3.5" /> ({attempt.incorrectAnswers})
                </button>
                <button 
                  onClick={() => setFilter('unanswered')}
                  className={cn("py-2 px-3 rounded border font-medium flex justify-center items-center gap-1", filter === 'unanswered' ? "bg-slate-600 text-white border-slate-600" : "bg-slate-100 text-slate-600 border-slate-300")}
                >
                  Skip ({test.questions.length - attempt.correctAnswers - attempt.incorrectAnswers})
                </button>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[300px] lg:h-[500px]">
               <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/50">
                 <h3 className="font-semibold text-gray-800">Questions</h3>
                 <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-gray-600">
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 bg-[#25b55d] rounded-t-full rounded-b-sm border border-[#25b55d]"></div>
                       <span>Correct</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 bg-[#e53935] rounded-b-full rounded-t-sm border border-[#e53935]"></div>
                       <span>Incorrect</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 bg-white border border-gray-400 rounded-sm"></div>
                       <span>Skipped</span>
                    </div>
                 </div>
               </div>
               <div className="overflow-y-auto flex-1 bg-slate-50/50 flex flex-col custom-scrollbar">
                 {Array.from(new Set(filteredQuestions.map(q => q.section))).map(sec => (
                   <div key={sec} className="mb-2">
                     <div className="bg-slate-200/60 text-slate-700 text-xs font-bold px-3 py-1.5 sticky top-0 z-10 backdrop-blur-sm">
                       <span>{sec}</span>
                     </div>
                     <div className="p-3 grid grid-cols-5 gap-2">
                       {filteredQuestions.map(q => {
                         if (q.section !== sec) return null;
                         const idx = test.questions.findIndex(tq => tq.id === q.id);
                         const uAns = attempt.answers[q.id];
                         const isCorr = uAns === q.correctOptionId;
                         const isActive = currentQuestionIndex === idx;
                         
                         return (
                           <button
                             key={q.id}
                             onClick={() => setCurrentQuestionIndex(idx)}
                             className={cn(
                               "w-9 h-9 flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 mx-auto",
                               !uAns ? "bg-white text-gray-700 border border-gray-400 rounded-sm" : isCorr ? "bg-[#25b55d] text-white rounded-t-full rounded-b-sm border border-[#25b55d]" : "bg-[#e53935] text-white rounded-b-full rounded-t-sm border border-[#e53935]",
                               isActive && "ring-2 ring-indigo-500 ring-offset-2 scale-105"
                             )}
                           >
                             {idx + 1}
                           </button>
                         )
                       })}
                     </div>
                   </div>
                 ))}
                 {filteredQuestions.length === 0 && (
                   <p className="text-sm text-slate-500 text-center py-8">No questions match filter.</p>
                 )}
               </div>
            </div>
          </div>

          {/* Main Review Area */}
          {currentQuestion && (
            <div className="flex-1 space-y-2 min-w-0">
              <div className="bg-[var(--color-surface)] rounded-xl border border-gray-200 shadow-sm p-3 md:p-3">
                <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block">{currentQuestion.section}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 text-base">Question {currentQuestionIndex + 1}</span>
                      {isUnanswered ? (
                         <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider">Unanswered</span>
                      ) : isCorrect ? (
                         <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Correct</span>
                      ) : (
                         <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Incorrect</span>
                      )}
                    </div>
                  </div>
                  
                  {(!isCorrect && !isUnanswered) && (
                    <button 
                      onClick={() => addToSRS(currentQuestion.id)}
                      className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-semibold border border-indigo-100 shadow-sm"
                    >
                      <BrainCircuit className="h-4 w-4" /> Add to SRS
                    </button>
                  )}
                </div>

                <div className="text-sm text-slate-800 mb-3 whitespace-pre-wrap leading-normal markdown-body">
                  <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText || ''}</Markdown>
                </div>

                <div className="space-y-2">
                  {currentQuestion.options.map((option, idx) => {
                    const isOptSelected = userAnswer === option.id;
                    const isOptCorrect = currentQuestion.correctOptionId === option.id;
                    const optText = option.text[language] || option.text['en'];
                    const label = String.fromCharCode(65 + idx);
                    
                    let optStyle = "border-slate-100 bg-slate-50/50";
                    let labelStyle = "bg-[var(--color-surface)] border border-slate-200 text-slate-400";
                    
                    if (isOptCorrect) {
                      optStyle = "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500";
                      labelStyle = "bg-emerald-500 border-transparent text-white shadow-md";
                    } else if (isOptSelected && !isOptCorrect) {
                      optStyle = "border-rose-500 bg-rose-50/30 ring-1 ring-rose-500";
                      labelStyle = "bg-rose-500 border-transparent text-white shadow-md";
                    }

                    return (
                      <div 
                        key={option.id} 
                        className={cn("flex items-center p-2 rounded-lg border-2", optStyle)}
                      >
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center text-xs font-bold mr-3 shrink-0 transition-colors", labelStyle)}>
                           {isOptCorrect ? <CheckCircle className="h-4 w-4 text-white" /> : isOptSelected && !isOptCorrect ? <XCircle className="h-4 w-4 text-white" /> : label}
                        </div>
                        <div className={cn("text-sm leading-snug markdown-body", isOptCorrect ? "text-emerald-900 font-medium" : isOptSelected ? "text-rose-900" : "text-slate-700")}>
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{optText || ''}</Markdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {expText && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-indigo-900 mb-1.5 flex items-center gap-2 text-sm">
                    Explanation
                  </h4>
                  <div className="text-indigo-800 leading-normal text-sm whitespace-pre-wrap markdown-body">
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{expText || ''}</Markdown>
                  </div>
                </div>
              )}
              
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={handleGoogleSearch}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Search Google for Explanations
                </button>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                   <button
                     onClick={handlePrevious}
                     disabled={currentFilteredIndex <= 0}
                     className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <ChevronLeft className="w-4 h-4" />
                     Previous
                   </button>
                   <button
                     onClick={handleNext}
                     disabled={currentFilteredIndex >= filteredQuestions.length - 1}
                     className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Next
                     <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

