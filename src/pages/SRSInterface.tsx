import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { BrainCircuit, Check, X, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function SRSInterface() {
  const { srsItems, tests, processSRSReview, language } = useStore();
  
  // Find items due for review
  const now = Date.now();
  const dueItems = Object.values(srsItems).filter(item => item.nextReviewDate <= now);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (dueItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-2">You're all caught up!</h2>
        <p className="text-gray-600">No questions are due for review right now. Great job staying on top of your spaced repetition.</p>
      </div>
    );
  }

  const currentItem = dueItems[currentIndex];
  
  // Find the question from all tests
  let currentQuestion = null;
  for (const test of tests) {
    const q = test.questions.find(q => q.id === currentItem.questionId);
    if (q) {
      currentQuestion = q;
      break;
    }
  }

  if (!currentQuestion) {
    // If question was deleted but still in SRS
    return <div>Error loading question.</div>;
  }

  const handleReview = (quality: number) => {
    processSRSReview(currentQuestion.id, quality);
    setShowAnswer(false);
    // Note: React state update might not immediately reflect in `dueItems` due to derived state, 
    // but the next render will filter it out. If it was the last item, we'll see the "all caught up" screen.
  };

  const qText = currentQuestion.text[language] || currentQuestion.text['en'];
  const expText = currentQuestion.explanation?.[language] || currentQuestion.explanation?.['en'];
  const correctOption = currentQuestion.options.find(o => o.id === currentQuestion.correctOptionId);
  const correctText = correctOption?.text[language] || correctOption?.text['en'];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-blue-600" /> Daily Review
        </h2>
        <span className="bg-orange-100 text-orange-700 font-bold px-4 py-1.5 rounded-full text-sm">
          {dueItems.length} Due
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 min-h-[400px] flex flex-col">
        <div className="flex-1">
          <div className="mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{currentQuestion.section}</span>
            <div className="text-base text-gray-800 mt-2 font-medium leading-relaxed whitespace-pre-wrap"><div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText || ''}</Markdown></div></div>
          </div>

          {showAnswer ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                <p className="text-sm font-semibold text-green-800 mb-1">Correct Answer:</p>
                <div className="text-green-900 text-base font-medium"><div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{correctText || ''}</Markdown></div></div>
              </div>
              
              {expText && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                   <p className="text-sm font-semibold text-blue-800 mb-1">Explanation:</p>
                   <div className="text-blue-900 whitespace-pre-wrap"><div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{expText || ''}</Markdown></div></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12">
              <button 
                onClick={() => setShowAnswer(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <RotateCcw className="h-4 w-4" /> Show Answer
              </button>
            </div>
          )}
        </div>

        {showAnswer && (
          <div className="border-t border-gray-100 pt-6 mt-auto">
            <p className="text-center text-sm font-medium text-gray-500 mb-3">How well did you remember this?</p>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => handleReview(0)} className="py-3 px-2 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors">
                Blackout (0)
                <span className="block text-xs font-normal opacity-80 mt-0.5">Forgot completely</span>
              </button>
              <button onClick={() => handleReview(3)} className="py-3 px-2 rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors">
                Hard (3)
                <span className="block text-xs font-normal opacity-80 mt-0.5">Remembered with effort</span>
              </button>
              <button onClick={() => handleReview(4)} className="py-3 px-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
                Good (4)
                <span className="block text-xs font-normal opacity-80 mt-0.5">Remembered easily</span>
              </button>
              <button onClick={() => handleReview(5)} className="py-3 px-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 font-bold hover:bg-green-100 transition-colors">
                Perfect (5)
                <span className="block text-xs font-normal opacity-80 mt-0.5">Perfect response</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
