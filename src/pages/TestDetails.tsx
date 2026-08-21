import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  PlayCircle, ArrowLeft, Clock, FileText, BarChart, ChevronRight, 
  Trash2, Sliders, ShieldCheck, Sparkles, Download, AlarmClock, 
  RotateCcw, Calendar, AlertCircle, ArrowLeftRight, Share2, Globe, Lock, ShieldAlert, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ripple } from '../components/Ripple';
import { ExamPersonalityModal } from '../components/ExamPersonalityModal';
import { ShareTestModal } from '../components/ShareTestModal';
import { useAuth } from '../contexts/AuthContext';
import { saveToFirestore, deleteTestFromFirestore, fetchTestByIdFromFirestore } from '../lib/firebaseSync';
import { getTestDisplayDate, getAttemptDate } from '../lib/dateUtils';

export default function TestDetails() {
  const { user } = useAuth();
  const { testId } = useParams();
  const navigate = useNavigate();
  const { tests, attempts, deleteTest, deleteAttempt, updateTest, activeTestSessions, clearActiveTestSession, importTests } = useStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  
  // Real-time clock for scheduled countdowns
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const test = tests.find(t => t.id === testId);

  // If opened directly from a shared link and not yet in store, fetch from Firestore
  useEffect(() => {
    if (!test && testId && !isFetchingRemote) {
      setIsFetchingRemote(true);
      fetchTestByIdFromFirestore(testId).then((fetchedTest) => {
        if (fetchedTest) {
          importTests([fetchedTest]);
        }
        setIsFetchingRemote(false);
      }).catch(() => {
        setIsFetchingRemote(false);
      });
    }
  }, [test, testId, isFetchingRemote, importTests]);

  
  
    const handleExportTest = () => {
    if (!test) return;
    const exportData = [{
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimit: test.timeLimit,
      themeColor: test.themeColor || "#8b5cf6",
      Sectionaltimer: (test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching) ? "true" : "false",
      examCategory: test.examCategory,
      settings: test.settings,
      scoring: test.scoring,
      exam: test.exam,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      sections: test.sections?.map((sec, index) => ({
        title: sec.name,
        timeLimit: sec.timeLimit,
        id: sec.id || (index + 1)
      })) || [],
      questions: test.questions?.map((q, qIndex) => {
        const secIndex = test.sections?.findIndex(s => s.name === q.section) ?? -1;
        const secId = secIndex >= 0 ? (test.sections[secIndex].id || (secIndex + 1)) : 1;
        return {
          text: q.text,
          options: q.options?.map(opt => ({
            text: opt.text,
            i: opt.id
          })) || [],
          questionNumber: qIndex + 1,
          i: q.id,
          a: q.correctOptionId,
          sectionId: secId
        };
      }) || [],
      testMode: {
        isReducedTest: true,
        questionsPerSection: test.sections && test.sections.length > 0 ? Math.floor(test.questions.length / test.sections.length) : test.questions?.length || 0,
        totalQuestions: test.questions?.length || 0,
        maximumMarks: (test.questions?.length || 0) * (test.positiveMarks || 2),
        marksPerQuestion: test.positiveMarks || 2,
        negativeMarksPerWrongAnswer: test.negativeMarks || 0.5
      }
    }];

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${test.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const testAttempts = attempts.filter(a => a.testId === testId && a.completed).sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  const latestAttempt = testAttempts[0];

  const sectionsList = useMemo(() => {
    if (test?.sections && test.sections.length > 0) return test.sections;
    
    // Auto-generate sections based on question subjects if not explicitly defined
    const sectionsMap = new Map<string, number>();
    test?.questions?.forEach(q => {
      const sec = q.section || 'General Section';
      sectionsMap.set(sec, (sectionsMap.get(sec) || 0) + 1);
    });
    
    return Array.from(sectionsMap.entries()).map(([name, count]) => ({
      name,
      count,
      // Just mock time limit proportionally if not provided
      timeLimit: Math.floor((count / (test?.questions?.length || 1)) * (test?.timeLimit || 3600))
    }));
  }, [test]);

  if (!test) {
    if (isFetchingRemote) {
      return (
        <div className="w-full max-w-md mx-auto text-center py-20 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Loading Shared Mock Test...</h2>
          <p className="text-xs text-slate-500 mt-1">Retrieving test paper securely from Firebase.</p>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md mx-auto text-center py-16 px-4">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Test Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The requested test link may be invalid, deleted, or you may not have permission to view it.
        </p>
        <button onClick={() => navigate('/tests')} className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs">
          Back to All Tests
        </button>
      </div>
    );
  }

  // Access Control Check (If user has local copy or created it, they have full access)
  const hasLocalCopy = tests.some(t => t.id === testId);
  const isOwner = hasLocalCopy || !test.ownerId || (user && test.ownerId === user.uid);
  const isPrivate = test.visibility === 'private' || test.isPublic === false;
  const isAccessDenied = isPrivate && !isOwner;

  if (isAccessDenied) {
    return (
      <div className="w-full max-w-lg mx-auto text-center py-16 px-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-5 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Restricted</h2>
          <p className="text-sm font-semibold text-slate-700 mt-2">{test.title}</p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-sm">
            This test has been marked as <strong>Private (Restricted)</strong> by its creator. Only the owner has permission to open and take this mock exam.
          </p>

          <div className="mt-6 w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <User className="w-4 h-4 text-blue-600" />
              <span>Creator Info</span>
            </div>
            <p className="text-[11px] text-slate-500 pl-6">
              Owner: {test.ownerName || 'Verified User'}{test.ownerEmail ? ` (${test.ownerEmail})` : ''}
            </p>
            <p className="text-[11px] text-slate-500 pl-6">
              To request access, please contact the test creator and ask them to change general access to <strong>'Anyone with the link'</strong>.
            </p>
          </div>

          <div className="flex gap-3 mt-6 w-full">
            <button
              onClick={() => navigate('/tests')}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Browse Other Tests
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.05 } }
  };

  const positiveMarks = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
  const negativeMarks = test.negativeMarks ?? (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
  const totalMaxMarks = (test.questions?.length || 0) * positiveMarks;

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const isPublic = test.visibility === 'public' || (test.visibility !== 'private' && test.isPublic !== false);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans">
      
      <div className="px-4 py-6 md:py-10 md:px-8">
        <button 
          onClick={() => navigate('/tests')}
          className="flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tests
        </button>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col lg:flex-row gap-6 md:gap-8"
        >
          
          {/* Left Column (Hero & Sections) */}
          <div className="w-full lg:w-2/3 xl:w-[68%] flex flex-col gap-4">
            
            {/* Hero Card */}
            <motion.div variants={itemVariants} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex-1 min-w-0 w-full">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight mb-1 text-balance">{test.title}</h1>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{test.description || "Tier-I Similar Paper"}</p>
                </div>
                
                <div className="flex items-center justify-start sm:justify-end gap-1.5 shrink-0 w-full sm:w-auto border-t sm:border-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/80 cursor-pointer shadow-2xs"
                    title="Share Test Link (Public / Private Options)"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => setShowPersonalityModal(true)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    title="Configure Scheme & Settings"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleExportTest}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    title="Export Test to JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Delete Test Paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col flex-1 sm:flex-none">
                  <span className="text-xl md:text-2xl font-bold text-slate-800 leading-none">{test.questions?.length || 0}</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Questions</span>
                </div>
                <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                <div className="flex flex-col flex-1 sm:flex-none border-l border-slate-100 pl-4 sm:border-0 sm:pl-0">
                  <span className="text-xl md:text-2xl font-bold text-slate-800 leading-none">{Math.floor(test.timeLimit / 60)} <span className="text-[15px]">m</span></span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Duration</span>
                </div>
                <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                <div className="flex flex-col flex-1 sm:flex-none border-l border-slate-100 pl-4 sm:border-0 sm:pl-0">
                  <span className="text-xl md:text-2xl font-bold text-slate-800 leading-none">{sectionsList.length}</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Sections</span>
                </div>
                <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                <div className="flex flex-col flex-1 sm:flex-none border-l border-slate-100 pl-4 sm:border-0 sm:pl-0">
                  <span className="text-sm md:text-base font-bold text-slate-800 leading-tight flex items-center gap-1 mt-0.5">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    {getTestDisplayDate(test)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Paper Date</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md border border-slate-200">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {getTestDisplayDate(test)}
                </span>

                {/* Visibility Badge */}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                    isPublic
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="Click to manage sharing permissions"
                >
                  {isPublic ? <Globe className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-amber-600" />}
                  <span>{isPublic ? 'Public Link' : 'Private / Restricted'}</span>
                </button>

                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded border border-slate-200">Medium</span>
                {test.examCategory && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider rounded border border-blue-200">{test.examCategory}</span>
                )}
                {test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-bold uppercase tracking-wider rounded" title="Strict Sectional Timing Enabled">
                    <AlarmClock className="w-3 h-3 text-orange-500" />
                    Strict
                  </span>
                )}
                {test.settings?.allowSectionSwitching && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold uppercase tracking-wider rounded" title="Section Switching Allowed (Sectional Timer OFF)">
                    <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                    Switchable
                  </span>
                )}
              </div>
            </motion.div>

            {/* Sections List */}
            <motion.div variants={itemVariants} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-wider uppercase">Sections Breakdown</h3>
              
              <div className="flex flex-col divide-y divide-slate-100">
                {sectionsList.map((section, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-slate-400 w-5 shrink-0">
                        {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      <h4 className="text-sm font-bold text-slate-700">{section.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                      <span>{((section as any).count) || Math.floor((test.questions?.length || 0) / sectionsList.length)} Qs</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{Math.floor(section.timeLimit / 60)} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Right Column (Info, CTA, Attempt) */}
          <div className="w-full lg:w-1/3 xl:w-[32%] flex flex-col gap-4">
            
            {/* Start Action */}
            <motion.div variants={itemVariants} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
              {(() => {
                const isScheduled = test.settings?.isScheduled === true && !!test.settings?.scheduledStartTime;
                const scheduledStart = test.settings?.scheduledStartTime || 0;
                const scheduledEnd = test.settings?.scheduledEndTime || (scheduledStart + (test.timeLimit || 3600) * 1000);
                const isBefore = isScheduled && currentTime < scheduledStart;
                const isEnded = isScheduled && currentTime >= scheduledEnd;

                if (isBefore) {
                  const msLeft = Math.max(0, scheduledStart - currentTime);
                  const hours = Math.floor(msLeft / (1000 * 60 * 60));
                  const mins = Math.floor((msLeft / (1000 * 60)) % 60);
                  const secs = Math.floor((msLeft / 1000) % 60);
                  const timeFormatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                  return (
                    <div className="flex flex-col gap-3">
                      <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Scheduled Mock Test</span>
                        </div>
                        <div className="text-xl font-mono font-black text-amber-700">
                          {timeFormatted}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600/70 mt-1">
                          Opens at {new Date(scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/test/${test.id}`)}
                        className="w-full h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors shadow-sm font-semibold text-sm"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Enter Waiting Room</span>
                      </button>
                    </div>
                  );
                }

                if (isEnded) {
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600 font-bold text-xs uppercase tracking-wider mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>Scheduled Window Ended</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          Closed on {new Date(scheduledEnd).toLocaleDateString()} at {new Date(scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                        </p>
                      </div>

                      {latestAttempt ? (
                        <button
                          onClick={() => navigate(`/result/${latestAttempt.id}`)}
                          className="w-full h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm font-semibold text-sm"
                        >
                          <BarChart className="w-4 h-4" />
                          <span>View Your Result</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/test-answers/${test.id}`)}
                          className="w-full h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-semibold text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Answer Key</span>
                        </button>
                      )}
                    </div>
                  );
                }

                if (activeTestSessions && activeTestSessions[test.id]) {
                  const session = activeTestSessions[test.id];
                  const sessionMinsLeft = Math.floor((session.timeLeft ?? test.timeLimit) / 60);
                  const sessionSecsLeft = (session.timeLeft ?? test.timeLimit) % 60;
                  const answeredCount = Object.keys(session.answers || {}).length;

                  return (
                    <>
                      <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                        <div className="font-bold flex items-center justify-between mb-1">
                          <span>In-Progress Attempt Saved</span>
                          <span className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px] text-amber-700">
                            {sessionMinsLeft}:{sessionSecsLeft.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-amber-700/80">
                          {answeredCount} of {test.questions.length} questions attempted.
                        </p>
                      </div>

                      <button
                        onClick={() => navigate(`/test/${test.id}`)}
                        className="w-full h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors shadow-sm font-semibold text-sm"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Resume In-Progress Test</span>
                      </button>

                      <button
                        onClick={() => {
                          clearActiveTestSession(test.id);
                          if (user) saveToFirestore(user.uid, useStore.getState());
                          navigate(`/test/${test.id}?fresh=true`);
                        }}
                        className="w-full h-9 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 font-semibold text-xs border border-slate-200"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Start Fresh ({Math.floor(test.timeLimit / 60)} Mins)</span>
                      </button>
                    </>
                  );
                }

                return (
                  <button
                    onClick={() => navigate(`/test/${test.id}`)}
                    className="w-full h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span className="text-sm font-bold tracking-wide">
                      {isScheduled ? 'Enter Live Mock Test' : 'Start Mock Test'}
                    </span>
                  </button>
                );
              })()}

              <button
                onClick={() => navigate(`/test-answers/${test.id}`)}
                className="mt-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 w-full h-8"
              >
                View Answer Key <ChevronRight className="w-3 h-3" />
              </button>
            </motion.div>

            {/* Test Information */}
            <motion.div variants={itemVariants} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Test Scheme</h3>
                <button
                  onClick={() => setShowPersonalityModal(true)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  title="Edit Marking Scheme"
                >
                  <Sliders className="w-3.5 h-3.5" /> Configure
                </button>
              </div>

              {/* Exam Personality Badge */}
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg mb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Exam Profile</span>
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">
                    {test.examCategory || 'General Exam'}
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  negativeMarks === 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {negativeMarks === 0 ? 'No Negative' : `+${positiveMarks.toFixed(1)} / -${negativeMarks.toFixed(2)}`}
                </span>
              </div>
              
              <div className="flex flex-col text-xs divide-y divide-slate-100">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 font-medium">Correct answer</span>
                  <span className="font-bold text-emerald-600">+{positiveMarks.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 font-medium">Wrong answer</span>
                  <span className={`font-bold ${negativeMarks === 0 ? 'text-slate-400' : 'text-red-600'}`}>
                    {negativeMarks === 0 ? '0' : `−${negativeMarks.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 font-medium">Unattempted</span>
                  <span className="font-bold text-slate-400">0</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mt-2 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total Questions</span>
                  <span className="font-bold text-slate-800">{test.questions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total Marks</span>
                  <span className="font-bold text-slate-800">{totalMaxMarks}</span>
                </div>
              </div>
            </motion.div>

            {/* Previous Attempt */}
            <motion.div variants={itemVariants} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Your Last Attempt</h3>
                  {latestAttempt && getAttemptDate(latestAttempt) && (
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {getAttemptDate(latestAttempt)}
                    </p>
                  )}
                </div>
                {latestAttempt && (
                  <button
                    onClick={() => setAttemptToDelete(latestAttempt.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="Delete Attempt Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
              
              {latestAttempt ? (
                <div className="flex flex-col">
                  <div className="grid grid-cols-2 gap-y-3 mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Net Score</p>
                      <p className="text-xl font-bold text-slate-800">{latestAttempt.score} <span className="text-xs font-semibold text-slate-400">/ {totalMaxMarks}</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Accuracy</p>
                      <p className="text-xl font-bold text-slate-800">
                        {latestAttempt.correctAnswers + latestAttempt.incorrectAnswers > 0 
                          ? Math.round((latestAttempt.correctAnswers / (latestAttempt.correctAnswers + latestAttempt.incorrectAnswers)) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Time</p>
                      <p className="text-sm font-bold text-slate-800">{Math.floor((latestAttempt.endTime! - latestAttempt.startTime) / 60000)}m</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Attempted</p>
                      <p className="text-sm font-bold text-slate-800">
                        {latestAttempt.correctAnswers + latestAttempt.incorrectAnswers} <span className="text-xs font-normal text-slate-400">/ {test.questions?.length || 0}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/review/${latestAttempt.id}`)}
                    className="w-full h-8 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    View Analysis
                  </button>

                  {/* Past Attempts History */}
                  {testAttempts.length > 1 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All Attempts ({testAttempts.length})</p>
                      <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                        {testAttempts.slice(1).map((att, idx) => (
                          <div key={att.id} className="py-1.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-slate-700">Attempt #{testAttempts.length - 1 - idx}</span>
                              <span className="text-[11px] text-slate-400 block">{getAttemptDate(att)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">{att.score} pts</span>
                              <button 
                                onClick={() => navigate(`/review/${att.id}`)}
                                className="text-[11px] font-bold text-blue-600 hover:underline"
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <BarChart className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">No previous attempts</p>
                </div>
              )}
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* Delete Test Modal */}
      {createPortal(
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative z-10"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Delete Test Paper?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-700">"{test?.title}"</strong>? All associated attempt records will also be removed.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (test) {
                        const idToDelete = test.id;
                        deleteTest(idToDelete);
                        setShowDeleteModal(false);
                        if (user?.uid) {
                          await deleteTestFromFirestore(idToDelete);
                          saveToFirestore(user.uid, null, true);
                        }
                        navigate('/tests');
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm text-sm"
                  >
                    Delete Test
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Attempt Modal */}
      {createPortal(
        <AnimatePresence>
          {attemptToDelete && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative z-10"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Delete Attempt Record?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to delete this test result? This record cannot be recovered.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setAttemptToDelete(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (attemptToDelete) {
                        deleteAttempt(attemptToDelete);
                        setAttemptToDelete(null);
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm text-sm"
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

      {/* Exam Personality & Scheme Editor Modal */}
      {test && (
        <ExamPersonalityModal
          isOpen={showPersonalityModal}
          onClose={() => setShowPersonalityModal(false)}
          test={test}
          onSave={(updatedFields) => {
            updateTest({
              ...test,
              ...updatedFields
            });
          }}
        />
      )}

      {/* Google Drive-style Share Test Modal */}
      {test && (
        <ShareTestModal
          test={test}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

