import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlayCircle, CheckCircle2, Clock, BarChart, Trash2 } from 'lucide-react';
import { Ripple } from '../components/Ripple';
export default function Dashboard() {
  const { tests, attempts, srsItems, deleteAttempt } = useStore();
  const navigate = useNavigate();

  const completedAttempts = attempts.filter(a => a.completed);
  const totalScore = completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const averageScore = completedAttempts.length > 0 ? (totalScore / completedAttempts.length).toFixed(1) : 0;
  
  const dueReviews = Object.values(srsItems).filter(item => item.nextReviewDate <= Date.now()).length;

  const chartData = completedAttempts.slice(-10).map((a, i) => ({
    name: `Test ${i + 1}`,
    score: a.score || 0,
    maxScore: a.totalQuestions
  }));

  
  if (tests.length === 0 && attempts.length === 0) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-3">
        <div className="w-24 h-24 bg-[var(--color-surface)] rounded-full flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-[var(--color-primary)] opacity-50" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">No Data Found</h2>
          <p className="text-[var(--color-on-surface-variant)] mt-2 max-w-md mx-auto">
            Your Google Drive storage is empty. Please head over to the Question Bank to import tests and start your preparation.
          </p>
        </div>
        <button
          onClick={() => navigate('/bank')}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-md"
        >
          Go to Question Bank
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      <div>
        <h2 className="text-base font-bold text-gray-900">Welcome Back!</h2>
        <p className="text-gray-600 mt-1">Here is your progress and today's tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[var(--color-surface)] p-3 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-full">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Tests Completed</p>
            <p className="text-base font-bold text-[var(--color-on-surface)]">{completedAttempts.length}</p>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] p-3 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full">
            <BarChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Avg. Score</p>
            <p className="text-base font-bold text-[var(--color-on-surface)]">{averageScore}</p>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] p-3 rounded-xl shadow-sm flex items-center gap-3 cursor-pointer hover:bg-[var(--color-surface-container)] transition-colors" onClick={() => navigate('/srs')}>
          <div className="p-3 bg-orange-100 text-orange-700 rounded-full">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Due Reviews (SRS)</p>
            <p className="text-base font-bold text-[var(--color-on-surface)]">{dueReviews}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
          <div className="bg-[var(--color-surface)] p-3 rounded-xl shadow-sm">
            <h3 className="text-base font-semibold text-[var(--color-on-surface)] mb-3">Recent Attempts</h3>
            <div className="space-y-3">
              {attempts.slice().reverse().slice(0, 5).map(attempt => {
                const test = tests.find(t => t.id === attempt.testId);
                if (!test) return null;
                return (
                  <div key={attempt.id} className="border-b border-[var(--color-outline-variant)] last:border-0 pb-4 last:pb-0">
                    <h4 className="font-medium text-[var(--color-on-surface)] line-clamp-1 cursor-pointer hover:text-[var(--color-primary)] hover:underline" onClick={() => navigate(`/test-details/${test.id}`)}>{test.title}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-bold text-[var(--color-primary)]">
                        Score: {attempt.score} / {attempt.totalQuestions}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => deleteAttempt(attempt.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove attempt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/review/${attempt.id}`)}
                          className="relative overflow-hidden text-xs bg-[var(--color-surface-container)] text-[var(--color-on-surface)] px-4 py-2 rounded-full hover:bg-[var(--color-outline-variant)] font-medium transition-colors"
                        >
                          View Analytics
                          <Ripple color="bg-gray-900/10" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {attempts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent attempts.</p>
              )}
            </div>
          </div>
              </div>
    </div>
  );
}
