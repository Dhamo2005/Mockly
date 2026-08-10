import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function TestAnswers() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { tests, language } = useStore();
  
  const test = tests.find(t => t.id === testId);
  
  if (!test) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold text-gray-900">Test not found</h2>
        <button onClick={() => navigate('/tests')} className="mt-4 text-blue-600 hover:underline">
          Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => navigate(`/test-details/${test.id}`)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Test Details
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{test.title} - Answer Key</h1>
        <p className="text-sm text-gray-600 mb-4">{test.questions.length} Questions</p>
      </div>

      <div className="space-y-4">
        {test.questions.map((q, index) => {
          const qText = q.text[language] || q.text['en'];
          const explanation = q.explanation?.[language] || q.explanation?.['en'];

          return (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Question {index + 1}
                </span>
              </div>
              
              <div className="p-4">
                <div className="text-sm text-gray-800 mb-4 whitespace-pre-wrap leading-normal">
                  <div className="markdown-body">
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText || ''}</Markdown>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {q.options.map((option) => {
                    const isCorrect = option.id === q.correctOptionId;
                    const optText = option.text[language] || option.text['en'];
                    
                    return (
                      <div 
                        key={option.id} 
                        className={cn(
                          "flex items-center p-2 rounded-lg border-2",
                          isCorrect 
                            ? "bg-green-50 border-green-200" 
                            : "bg-white border-gray-100"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-xs font-bold mr-3 shrink-0",
                          isCorrect ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {isCorrect && <CheckCircle className="w-4 h-4" />}
                        </div>
                        <span className="text-sm leading-normal markdown-body">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{optText || ''}</Markdown>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {explanation && (
                  <div className="bg-indigo-50/50 rounded-lg p-3 shadow-sm border border-indigo-100">
                    <div className="mb-1.5 flex items-center gap-2 text-sm">
                      <span className="font-bold text-indigo-900">Explanation</span>
                    </div>
                    <div className="text-indigo-800 leading-normal text-sm markdown-body">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{explanation}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
