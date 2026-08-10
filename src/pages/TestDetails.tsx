import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlayCircle, FileText, ArrowLeft, Clock, ListTodo, BarChart } from 'lucide-react';

export default function TestDetails() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { tests, attempts } = useStore();
  
  
  const test = tests.find(t => t.id === testId);
  const testAttempts = attempts.filter(a => a.testId === testId && a.completed).sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  const latestAttempt = testAttempts[0];

  
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
      <button 
        onClick={() => navigate('/tests')}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tests
      </button>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{test.title}</h1>
        <p className="text-gray-600 mb-6">{test.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {test.examCategory && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider">
              {test.examCategory}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <ListTodo className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Questions</p>
              <p className="font-semibold text-gray-900">{test.questions.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Clock className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Time Limit</p>
              <p className="font-semibold text-gray-900">{Math.floor(test.timeLimit / 60)} Minutes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl sm:col-span-2 md:col-span-1">
            <FileText className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Sections</p>
              <p className="font-semibold text-gray-900">{test.sections?.length || 1}</p>
            </div>
          </div>
        </div>

        {test.sections && test.sections.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sections Details</h3>
            <div className="space-y-2">
              {test.sections.map((section, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                  <span className="font-medium text-gray-800">{section.name}</span>
                  <span className="text-sm text-gray-500">{Math.floor(section.timeLimit / 60)} mins</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
                <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(`/test/${test.id}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlayCircle className="w-5 h-5" /> Start Mock Test
          </button>
          
          <button
            onClick={() => navigate(`/test-answers/${test.id}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-blue-600 border-2 border-blue-100 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
          >
            <FileText className="w-5 h-5" /> Show Answers
          </button>
          
          {latestAttempt && (
            <button
              onClick={() => navigate(`/review/${latestAttempt.id}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 transition-colors"
            >
              <BarChart className="w-5 h-5" /> Score Analytics
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
