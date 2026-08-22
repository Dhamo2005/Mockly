import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QuestionStatus, TestAttempt, Language, TestActionEvent, QuestionTimestampMeta } from '../types';
import { Ripple } from '../components/Ripple';
import { 
  BookOpen, Clock, AlertTriangle, AlertCircle, Play, Pause, 
  RotateCcw, RefreshCw, LogOut, CheckCircle2, Maximize, Menu,
  X, Cloud, CloudOff, Plus, Minus, Search, ChevronRight, ChevronLeft, Check, Flag, Circle,
  ArrowLeft, Calendar, ShieldCheck, Lock, Globe, User, HardDrive
} from 'lucide-react';
import { cn, getLocalizedText } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import { saveToFirestore, deleteActiveSessionFromFirestore, fetchTestByIdFromFirestore } from '../lib/firebaseSync';

export default function MockTestInterface() {
  const { user } = useAuth();
  const { testId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceFresh = searchParams.get('fresh') === 'true' || searchParams.get('restart') === 'true';

  const { 
    isConnected: isDriveConnected, 
    isConnecting: isDriveConnecting, 
    liveSyncStatus, 
    liveSyncLastSaved,
    connect: connectDrive, 
    syncLiveSession, 
    loadLiveSession, 
    deleteLiveSession, 
    saveCompletedAttempt 
  } = useGoogleDrive();

  const { 
    tests, 
    isInitialized,
    language, 
    setLanguage, 
    addAttempt, 
    activeTestSessions, 
    updateActiveTestSession, 
    clearActiveTestSession,
    importTests,
    syncStatus 
  } = useStore();
  
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const test = tests.find(t => t.id === testId);

  // If opening directly via share link and test is not in store, fetch from Firestore
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
  const allowSectionSwitching = test?.settings?.allowSectionSwitching === true || test?.settings?.allowForceSkipSection === true;
  const isStrictSectional = test?.settings?.strictSectionalTiming === true && !allowSectionSwitching;
  const canSwitchSections = !isStrictSectional || allowSectionSwitching;

  // Scheduled Test Detection
  const isScheduledTest = test?.settings?.isScheduled === true && !!test?.settings?.scheduledStartTime;
  const scheduledStartTime = test?.settings?.scheduledStartTime || 0;
  const scheduledEndTime = test?.settings?.scheduledEndTime || (scheduledStartTime + (test?.timeLimit || 3600) * 1000);

  // Live real-time clock for scheduled countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const isBeforeScheduledStart = isScheduledTest && currentTime < scheduledStartTime;

  const isLoadedRef = useRef(false);

  // Timestamp references for resilient timely prediction and cross-device persistence
  const sessionStartTimeRef = useRef<number>(0);
  const sessionEndTimeRef = useRef<number>(0);
  const sectionStartTimesRef = useRef<Record<number, number>>({});
  const sectionEndTimesRef = useRef<Record<number, number>>({});
  const sectionDurationsRef = useRef<Record<number, number>>({});
  const handleSubmitRef = useRef<(() => void) | undefined>(undefined);
  const handleJumpToQuestionRef = useRef<((index: number, forceSectionCheck?: string) => void) | undefined>(undefined);

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
  const [showConfirm, setShowConfirm] = useState<'submit' | 'exit' | 'restart' | null>(null);

  // Mutable reference tracker for resilient background persistence and timer math
  const timeLeftRef = useRef(timeLeft);
  const sectionTimeLeftRef = useRef(sectionTimeLeft);
  const answersRef = useRef(answers);
  const statusesRef = useRef(statuses);
  const timeSpentRef = useRef(timeSpent);
  const isPausedRef = useRef(isPaused);
  const isSubmittedRef = useRef(isSubmitted);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const currentSectionIndexRef = useRef(currentSectionIndex);
  const reportedQuestionsRef = useRef<Record<string, { reason: string; comment?: string }>>({});
  const lastTickTimestampRef = useRef<number>(Date.now());
  const actionLogsRef = useRef<TestActionEvent[]>([]);
  const questionTimestampsRef = useRef<Record<string, QuestionTimestampMeta>>({});

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { sectionTimeLeftRef.current = sectionTimeLeft; }, [sectionTimeLeft]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { statusesRef.current = statuses; }, [statuses]);
  useEffect(() => { timeSpentRef.current = timeSpent; }, [timeSpent]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isSubmittedRef.current = isSubmitted; }, [isSubmitted]);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  useEffect(() => { currentSectionIndexRef.current = currentSectionIndex; }, [currentSectionIndex]);

  // High-precision authoritative timestamp action recorder
  const recordAction = useCallback((
    type: TestActionEvent['type'],
    details?: Partial<TestActionEvent>
  ) => {
    const now = Date.now();
    const isoTimestamp = new Date(now).toISOString();
    const q = details?.questionId 
      ? test?.questions.find(x => x.id === details.questionId) 
      : test?.questions[currentQuestionIndexRef.current];
    const qId = q?.id;

    const actionItem: TestActionEvent = {
      id: uuidv4(),
      type,
      questionId: qId,
      questionIndex: details?.questionIndex ?? currentQuestionIndexRef.current,
      sectionIndex: details?.sectionIndex ?? currentSectionIndexRef.current,
      sectionName: details?.sectionName ?? q?.section,
      optionId: details?.optionId,
      previousOptionId: details?.previousOptionId,
      status: details?.status,
      timestamp: now,
      isoTimestamp,
      timeSpentOnQuestionSeconds: qId ? (timeSpentRef.current[qId] || 0) : undefined,
      timeLeftAtActionSeconds: timeLeftRef.current,
    };

    actionLogsRef.current = [...(actionLogsRef.current || []), actionItem];

    if (qId) {
      const existingMeta = questionTimestampsRef.current[qId] || {
        firstVisitedAt: now,
        lastVisitedAt: now,
        totalTimeSpentSeconds: 0,
        actionCount: 0,
      };

      const updatedMeta: QuestionTimestampMeta = {
        ...existingMeta,
        lastVisitedAt: now,
        totalTimeSpentSeconds: timeSpentRef.current[qId] || 0,
        actionCount: (existingMeta.actionCount || 0) + 1,
        firstVisitedAt: existingMeta.firstVisitedAt || now,
      };

      if (type === 'answer_select') {
        updatedMeta.lastAnsweredAt = now;
      } else if (type === 'mark_review' || type === 'mark_and_next') {
        updatedMeta.markedAt = now;
      } else if (type === 'unmark_review' || type === 'answer_clear') {
        updatedMeta.unmarkedAt = now;
      }

      questionTimestampsRef.current = {
        ...questionTimestampsRef.current,
        [qId]: updatedMeta,
      };
    }

    return actionItem;
  }, [test]);

  // Modals and Reports
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedQuestions, setReportedQuestions] = useState<Record<string, { reason: string; comment?: string }>>({});
  const [reportReason, setReportReason] = useState('Incorrect Answer / Option');
  const [reportComment, setReportComment] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => { reportedQuestionsRef.current = reportedQuestions; }, [reportedQuestions]);

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

  const sections = useMemo(() => {
    if (!test) return [];
    return Array.from(new Set(test.questions.map(q => q.section)));
  }, [test]);

  // Helper to persist current active test session cleanly
  const syncSession = (overrides?: any) => {
    if (!testId || !test || isSubmitted) return;
    const now = Date.now();
    const sessionData = {
      testId,
      currentQuestionIndex: currentQuestionIndexRef.current,
      currentSectionIndex: currentSectionIndexRef.current,
      timeLeft: timeLeftRef.current,
      sectionTimeLeft: sectionTimeLeftRef.current,
      sectionDurations: sectionDurationsRef.current,
      sectionStartTimes: sectionStartTimesRef.current,
      sectionEndTimes: sectionEndTimesRef.current,
      answers: answersRef.current,
      statuses: statusesRef.current,
      timeSpent: timeSpentRef.current,
      isPaused: isPausedRef.current,
      reportedQuestions: reportedQuestionsRef.current,
      actionLogs: actionLogsRef.current,
      questionTimestamps: questionTimestampsRef.current,
      startTime: sessionStartTimeRef.current,
      endTime: sessionEndTimeRef.current,
      scheduledStartTime: test.settings?.scheduledStartTime,
      scheduledEndTime: test.settings?.scheduledEndTime,
      lastUpdated: now,
      syncTimestamp: now,
      cloudSyncSource: isDriveConnected ? 'google_drive' : 'local_fallback',
      ...overrides
    };
    updateActiveTestSession(testId, sessionData);
    try {
      localStorage.setItem('mockly_active_session_' + testId, JSON.stringify(sessionData));
    } catch (e) {}

    // Priority 1: Google Drive Sync - auto-save every action in real time
    if (isDriveConnected) {
      syncLiveSession(testId, test.title, sessionData);
    } else if (user) {
      saveToFirestore(user.uid, useStore.getState());
    }
  };

  // Restore session on mount or refresh using exact timestamps & Drive cloud reconciliation
  useEffect(() => {
    if (!testId || !test || isLoadedRef.current || isBeforeScheduledStart) return;

    let isCancelled = false;

    async function initializeSession() {
      // 1. Check Google Drive for latest saved session if connected
      let cloudDriveSession: any = null;
      if (isDriveConnected && !forceFresh) {
        try {
          cloudDriveSession = await loadLiveSession(testId, test.title);
        } catch (e) {
          console.warn('Drive live session check skipped/failed:', e);
        }
      }

      if (isCancelled) return;

      // 2. Check existing session from store or fallback
      let rawSession = activeTestSessions[testId];
      if (cloudDriveSession && cloudDriveSession.lastUpdated) {
        if (!rawSession || ((cloudDriveSession.lastUpdated || 0) >= (rawSession.lastUpdated || 0))) {
          rawSession = cloudDriveSession;
        }
      }

      if (!rawSession) {
        try {
          const localSaved = localStorage.getItem('mockly_active_session_' + testId);
          if (localSaved) {
            rawSession = JSON.parse(localSaved);
          }
        } catch (e) {}
      }

      // If no active session found AND store is still initializing, wait for DB hydration
      if (!rawSession && !isInitialized && !forceFresh && !isDriveConnected) {
        return;
      }

      const activeSession = forceFresh ? undefined : rawSession;
      if (forceFresh) {
        clearActiveTestSession(testId);
        try {
          localStorage.removeItem('mockly_active_session_' + testId);
        } catch (e) {}
      }

      const extractedSections = Array.from(new Set(test.questions.map(q => q.section)));
      const sectionDurations: Record<number, number> = {};
      extractedSections.forEach((secName, idx) => {
        const secDef = Array.isArray(test.sections) ? test.sections.find((s: any) => (typeof s === 'object' ? s.name === secName : s === secName)) : undefined;
        sectionDurations[idx] = (secDef && typeof secDef === 'object' && secDef.timeLimit) 
          ? secDef.timeLimit 
          : Math.floor(test.timeLimit / Math.max(1, extractedSections.length));
      });
      sectionDurationsRef.current = sectionDurations;

      const now = Date.now();

      let sTime = now;
      let eTime = now + (test.timeLimit * 1000);
      let calculatedTimeLeft = test.timeLimit;

      if (isScheduledTest) {
        sTime = scheduledStartTime;
        eTime = scheduledEndTime;
        calculatedTimeLeft = Math.max(0, Math.ceil((eTime - now) / 1000));
      } else if (activeSession) {
        const elapsedSinceLastUpdate = activeSession.isPaused 
          ? 0 
          : Math.max(0, Math.floor((now - (activeSession.lastUpdated || now)) / 1000));

        if (activeSession.isPaused) {
          calculatedTimeLeft = activeSession.timeLeft ?? test.timeLimit;
          eTime = now + (calculatedTimeLeft * 1000);
          sTime = activeSession.startTime || (now - ((test.timeLimit - calculatedTimeLeft) * 1000));
        } else if (activeSession.endTime && activeSession.endTime > now) {
          calculatedTimeLeft = Math.max(0, Math.ceil((activeSession.endTime - now) / 1000));
          eTime = activeSession.endTime;
          sTime = activeSession.startTime || (eTime - (test.timeLimit * 1000));
        } else if (activeSession.timeLeft !== undefined) {
          calculatedTimeLeft = Math.max(0, activeSession.timeLeft - elapsedSinceLastUpdate);
          eTime = now + (calculatedTimeLeft * 1000);
          sTime = activeSession.startTime || (now - ((test.timeLimit - calculatedTimeLeft) * 1000));
        }
      }

      sessionStartTimeRef.current = sTime;
      sessionEndTimeRef.current = eTime;

      // Calculate section start and end windows based on timestamps
      const sTimes: Record<number, number> = {};
      const eTimes: Record<number, number> = {};
      let cumulativeSec = 0;
      extractedSections.forEach((_, idx) => {
        const dur = sectionDurations[idx] || 900;
        sTimes[idx] = sTime + (cumulativeSec * 1000);
        eTimes[idx] = sTime + ((cumulativeSec + dur) * 1000);
        cumulativeSec += dur;
      });
      sectionStartTimesRef.current = sTimes;
      sectionEndTimesRef.current = eTimes;

      // If test scheduled end time has already elapsed, auto-submit
      if (isScheduledTest && now >= eTime) {
        setTimeLeft(0);
        timeLeftRef.current = 0;
        if (activeSession) {
          setAnswers(activeSession.answers || {});
          setStatuses(activeSession.statuses || {});
          setTimeSpent(activeSession.timeSpent || {});
        }
        isLoadedRef.current = true;
        setTimeout(() => {
          handleSubmitRef.current?.();
        }, 100);
        return;
      }
      
      setTimeLeft(calculatedTimeLeft);
      timeLeftRef.current = calculatedTimeLeft;

      // Section calculations based on current timestamp
      let calculatedSectionIndex = 0;
      const initialSectionTimes: Record<number, number> = {};

      if (isScheduledTest) {
        extractedSections.forEach((_, idx) => {
          initialSectionTimes[idx] = Math.max(0, Math.ceil((eTimes[idx] - now) / 1000));
          if (now >= sTimes[idx] && now < eTimes[idx]) {
            calculatedSectionIndex = idx;
          }
        });
      } else if (activeSession?.sectionTimeLeft && Object.keys(activeSession.sectionTimeLeft).length > 0) {
        const elapsedSinceLastUpdate = activeSession.isPaused 
          ? 0 
          : Math.max(0, Math.floor((now - (activeSession.lastUpdated || now)) / 1000));

        extractedSections.forEach((_, idx) => {
          const prevSecTime = activeSession.sectionTimeLeft?.[idx] ?? sectionDurations[idx] ?? 900;
          if (idx === (activeSession.currentSectionIndex ?? 0) && !activeSession.isPaused && isStrictSectional) {
            initialSectionTimes[idx] = Math.max(0, prevSecTime - elapsedSinceLastUpdate);
          } else {
            initialSectionTimes[idx] = prevSecTime;
          }
        });
        calculatedSectionIndex = activeSession.currentSectionIndex || 0;
      } else {
        extractedSections.forEach((_, idx) => {
          initialSectionTimes[idx] = sectionDurations[idx] || 900;
        });
      }
      setSectionTimeLeft(initialSectionTimes);
      sectionTimeLeftRef.current = initialSectionTimes;

      lastTickTimestampRef.current = Date.now();

      if (activeSession) {
        const targetSecIdx = (isStrictSectional && !canSwitchSections && isScheduledTest) 
          ? calculatedSectionIndex 
          : (activeSession.currentSectionIndex ?? 0);
        setCurrentSectionIndex(targetSecIdx);
        currentSectionIndexRef.current = targetSecIdx;
        
        const qIndex = activeSession.currentQuestionIndex || 0;
        if (isStrictSectional && !canSwitchSections && isScheduledTest && test.questions[qIndex]?.section !== extractedSections[targetSecIdx]) {
          const firstQIdx = test.questions.findIndex(q => q.section === extractedSections[targetSecIdx]);
          const targetQ = firstQIdx !== -1 ? firstQIdx : 0;
          setCurrentQuestionIndex(targetQ);
          currentQuestionIndexRef.current = targetQ;
        } else {
          setCurrentQuestionIndex(qIndex);
          currentQuestionIndexRef.current = qIndex;
        }

        setAnswers(activeSession.answers || {});
        answersRef.current = activeSession.answers || {};

        setStatuses(activeSession.statuses || {});
        statusesRef.current = activeSession.statuses || {};

        setTimeSpent(activeSession.timeSpent || {});
        timeSpentRef.current = activeSession.timeSpent || {};

        setIsPaused(activeSession.isPaused || false);
        isPausedRef.current = activeSession.isPaused || false;

        setReportedQuestions(activeSession.reportedQuestions || {});
        reportedQuestionsRef.current = activeSession.reportedQuestions || {};

        if (activeSession.actionLogs) {
          actionLogsRef.current = activeSession.actionLogs;
        }
        if (activeSession.questionTimestamps) {
          questionTimestampsRef.current = activeSession.questionTimestamps;
        }
      } else {
        const initialStatuses: Record<string, QuestionStatus> = {};
        test.questions.forEach((q, idx) => {
          initialStatuses[q.id] = idx === 0 ? 'unanswered' : 'unvisited';
        });
        setStatuses(initialStatuses);
        statusesRef.current = initialStatuses;
        setAnswers({});
        answersRef.current = {};
        setTimeSpent({});
        timeSpentRef.current = {};
        setCurrentSectionIndex(calculatedSectionIndex);
        currentSectionIndexRef.current = calculatedSectionIndex;
        setCurrentQuestionIndex(0);
        currentQuestionIndexRef.current = 0;
        setIsPaused(false);
        isPausedRef.current = false;
        actionLogsRef.current = [];
        questionTimestampsRef.current = {};

        // Save initial active session with timestamps
        const initialSessionData = {
          testId,
          currentQuestionIndex: 0,
          currentSectionIndex: calculatedSectionIndex,
          sectionTimeLeft: initialSectionTimes,
          sectionDurations,
          sectionStartTimes: sTimes,
          sectionEndTimes: eTimes,
          answers: {},
          statuses: initialStatuses,
          timeLeft: calculatedTimeLeft,
          timeSpent: {},
          isPaused: false,
          reportedQuestions: {},
          actionLogs: [],
          questionTimestamps: {},
          startTime: sTime,
          endTime: eTime,
          scheduledStartTime: test.settings?.scheduledStartTime,
          scheduledEndTime: test.settings?.scheduledEndTime,
          lastUpdated: now,
          syncTimestamp: now,
          cloudSyncSource: (isDriveConnected ? 'google_drive' : 'local_fallback') as 'google_drive' | 'local_fallback'
        };
        updateActiveTestSession(testId, initialSessionData);
        try {
          localStorage.setItem('mockly_active_session_' + testId, JSON.stringify(initialSessionData));
        } catch (e) {}

        if (isDriveConnected) {
          syncLiveSession(testId, test.title, initialSessionData);
        } else if (user) {
          saveToFirestore(user.uid, useStore.getState());
        }
      }

      recordAction('test_start', {
        questionIndex: activeSession?.currentQuestionIndex || 0,
        sectionIndex: calculatedSectionIndex,
      });

      isLoadedRef.current = true;
    }

    initializeSession();

    return () => {
      isCancelled = true;
    };
  }, [testId, test, isInitialized, forceFresh, isBeforeScheduledStart, isScheduledTest, scheduledStartTime, scheduledEndTime, isStrictSectional, canSwitchSections, isDriveConnected, loadLiveSession, recordAction]);

  // Timestamp & Second-by-Second Timer Engine with Delta Precision
  const processTimerTick = useCallback(() => {
    if (isSubmittedRef.current || isPausedRef.current || !isLoadedRef.current || isBeforeScheduledStart) return;

    const now = Date.now();
    const lastTick = lastTickTimestampRef.current || now;
    const elapsedMs = now - lastTick;
    if (elapsedMs < 200) return; // avoid sub-tick jitter

    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    if (elapsedSeconds <= 0) return;

    // Advance by whole seconds consumed, keeping fractional remainder
    lastTickTimestampRef.current = lastTick + (elapsedSeconds * 1000);

    if (isScheduledTest) {
      const endTime = sessionEndTimeRef.current || scheduledEndTime;
      if (now >= endTime) {
        setTimeLeft(0);
        timeLeftRef.current = 0;
        handleSubmitRef.current?.();
        return;
      }

      const remTotal = Math.max(0, Math.ceil((endTime - now) / 1000));
      setTimeLeft(remTotal);
      timeLeftRef.current = remTotal;

      if (isStrictSectional) {
        const sTimes = sectionStartTimesRef.current;
        const eTimes = sectionEndTimesRef.current;

        for (let i = 0; i < sections.length; i++) {
          if (now >= sTimes[i] && now < eTimes[i]) {
            if (currentSectionIndexRef.current !== i && (!canSwitchSections || currentSectionIndexRef.current < i)) {
              setCurrentSectionIndex(i);
              currentSectionIndexRef.current = i;
              const firstQIndex = test?.questions.findIndex(q => q.section === sections[i]) ?? -1;
              if (firstQIndex !== -1) {
                handleJumpToQuestionRef.current?.(firstQIndex, sections[i]);
              }
              setToastMessage(`Section completed. Automatically switched to ${sections[i]}`);
              setTimeout(() => setToastMessage(null), 3500);
            }
            const remSec = Math.max(0, Math.ceil((eTimes[i] - now) / 1000));
            setSectionTimeLeft(prev => {
              const updated = { ...prev, [i]: remSec };
              sectionTimeLeftRef.current = updated;
              return updated;
            });
            break;
          }
        }
      }
    } else {
      // Standard Test: Second-by-second countdown with delta resilience
      const curTotalLeft = timeLeftRef.current;
      const nextTotalLeft = Math.max(0, curTotalLeft - elapsedSeconds);
      setTimeLeft(nextTotalLeft);
      timeLeftRef.current = nextTotalLeft;

      // Track time spent on current question accurately
      const curQ = test?.questions[currentQuestionIndexRef.current];
      if (curQ) {
        setTimeSpent(prev => {
          const updated = {
            ...prev,
            [curQ.id]: (prev[curQ.id] || 0) + elapsedSeconds
          };
          timeSpentRef.current = updated;
          return updated;
        });
      }

      if (nextTotalLeft <= 0) {
        handleSubmitRef.current?.();
        return;
      }

      if (isStrictSectional) {
        const curSec = currentSectionIndexRef.current;
        const curSecRemaining = sectionTimeLeftRef.current[curSec] !== undefined
          ? sectionTimeLeftRef.current[curSec]
          : (sectionDurationsRef.current[curSec] || 900);

        const nextSecRemaining = Math.max(0, curSecRemaining - elapsedSeconds);
        const updatedSecTimes = { ...sectionTimeLeftRef.current, [curSec]: nextSecRemaining };
        sectionTimeLeftRef.current = updatedSecTimes;
        setSectionTimeLeft(updatedSecTimes);

        if (nextSecRemaining === 0) {
          if (curSec < sections.length - 1) {
            const nextIdx = curSec + 1;
            setCurrentSectionIndex(nextIdx);
            currentSectionIndexRef.current = nextIdx;
            const firstQIndex = test?.questions.findIndex(q => q.section === sections[nextIdx]) ?? -1;
            if (firstQIndex !== -1) {
              handleJumpToQuestionRef.current?.(firstQIndex, sections[nextIdx]);
            }
            setToastMessage(`Section time up. Automatically moved to ${sections[nextIdx]}`);
            setTimeout(() => setToastMessage(null), 3500);
          } else {
            handleSubmitRef.current?.();
            return;
          }
        }
      }
    }
  }, [test, isBeforeScheduledStart, isScheduledTest, scheduledEndTime, isStrictSectional, sections, canSwitchSections]);

  // Main high-frequency timer loop (every 500ms)
  useEffect(() => {
    if (!test || isSubmitted || isPaused || isBeforeScheduledStart) return;

    lastTickTimestampRef.current = Date.now();

    const timer = setInterval(() => {
      processTimerTick();
    }, 500);

    return () => clearInterval(timer);
  }, [test, isSubmitted, isPaused, isBeforeScheduledStart, processTimerTick]);

  // Mobile / Tab background, minimize, screen lock, and restore lifecycle listeners
  useEffect(() => {
    if (!testId || !test || isSubmitted || isBeforeScheduledStart) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App is minimized or tab backgrounded
        processTimerTick();
        lastTickTimestampRef.current = Date.now();
        syncSession();
      } else if (document.visibilityState === 'visible') {
        // User came back from minimized app
        processTimerTick();
        lastTickTimestampRef.current = Date.now();
        syncSession();
      }
    };

    const handlePageHide = () => {
      processTimerTick();
      lastTickTimestampRef.current = Date.now();
      syncSession();
    };

    const handlePageShow = () => {
      processTimerTick();
      lastTickTimestampRef.current = Date.now();
      syncSession();
    };

    const handleWindowFocus = () => {
      processTimerTick();
      lastTickTimestampRef.current = Date.now();
      syncSession();
    };

    const handleWindowBlur = () => {
      processTimerTick();
      lastTickTimestampRef.current = Date.now();
      syncSession();
    };

    const handleBeforeUnload = () => {
      if (!isLoadedRef.current || isSubmitted || !testId) return;
      processTimerTick();
      syncSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isLoadedRef.current && !isSubmitted) {
        processTimerTick();
        syncSession();
      }
    };
  }, [testId, test, isSubmitted, isBeforeScheduledStart, processTimerTick]);

  // Periodic active session background persistence
  useEffect(() => {
    if (!testId || !test || isSubmitted || isBeforeScheduledStart) return;

    const periodicTimer = setInterval(() => {
      if (isLoadedRef.current && !isSubmitted) {
        syncSession();
      }
    }, 4000);

    return () => clearInterval(periodicTimer);
  }, [testId, test, isSubmitted, isBeforeScheduledStart]);

  // Restart Mock Test Fresh
  const handleRestartTest = () => {
    if (!test || !testId) return;

    clearActiveTestSession(testId);

    const extractedSections = Array.from(new Set(test.questions.map(q => q.section)));
    const freshSectionTimes: Record<number, number> = {};
    extractedSections.forEach((secName, idx) => {
      const secDef = Array.isArray(test.sections) ? test.sections.find((s: any) => (typeof s === 'object' ? s.name === secName : s === secName)) : undefined;
      freshSectionTimes[idx] = (secDef && typeof secDef === 'object' && secDef.timeLimit) 
        ? secDef.timeLimit 
        : Math.floor(test.timeLimit / Math.max(1, extractedSections.length));
    });

    const initialStatuses: Record<string, QuestionStatus> = {};
    test.questions.forEach((q, idx) => {
      initialStatuses[q.id] = idx === 0 ? 'unanswered' : 'unvisited';
    });

    lastTickTimestampRef.current = Date.now();
    setTimeLeft(test.timeLimit);
    timeLeftRef.current = test.timeLimit;
    setSectionTimeLeft(freshSectionTimes);
    sectionTimeLeftRef.current = freshSectionTimes;
    setAnswers({});
    answersRef.current = {};
    setStatuses(initialStatuses);
    statusesRef.current = initialStatuses;
    setTimeSpent({});
    timeSpentRef.current = {};
    setCurrentQuestionIndex(0);
    currentQuestionIndexRef.current = 0;
    setCurrentSectionIndex(0);
    currentSectionIndexRef.current = 0;
    setIsPaused(false);
    isPausedRef.current = false;
    setShowConfirm(null);

    if (isDriveConnected && testId) {
      deleteLiveSession(testId, test.title);
    } else if (user) {
      saveToFirestore(user.uid, useStore.getState());
    }
    setToastMessage("Test restarted fresh with full time.");
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const currentQuestion = test?.questions[currentQuestionIndex];

  const [activeSidebarSection, setActiveSidebarSection] = useState<string>('');
  
  useEffect(() => {
    if (currentQuestion) {
      setActiveSidebarSection(currentQuestion.section);
    }
  }, [currentQuestionIndex, currentQuestion]);



  // Real-time synchronization whenever candidate selects an option
  const handleOptionSelect = (optionId: string) => {
    const prevOptionId = answers[currentQuestion.id];
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    const currentStatus = statuses[currentQuestion.id];
    const newStatus: QuestionStatus = (currentStatus === 'marked' || currentStatus === 'answered_marked') 
      ? 'answered_marked' 
      : 'answered';
    const newStatuses: Record<string, QuestionStatus> = { ...statuses, [currentQuestion.id]: newStatus };

    // Synchronously update refs so any immediate tick or window event uses the fresh state
    answersRef.current = newAnswers;
    statusesRef.current = newStatuses;

    setAnswers(newAnswers);
    setStatuses(newStatuses);

    recordAction('answer_select', {
      questionId: currentQuestion.id,
      questionIndex: currentQuestionIndex,
      sectionIndex: currentSectionIndex,
      optionId,
      previousOptionId: prevOptionId,
      status: newStatus,
    });

    syncSession();
  };

  const handleNext = () => {
    if (statuses[currentQuestion.id] === 'unvisited' || statuses[currentQuestion.id] === 'unanswered') {
      if (!answers[currentQuestion.id]) {
        const nextStatuses = { ...statuses, [currentQuestion.id]: 'unanswered' as QuestionStatus };
        statusesRef.current = nextStatuses;
        setStatuses(nextStatuses);
      }
    }
    
    if (currentQuestionIndex < (test?.questions?.length || 0) - 1) {
      const nextQ = test.questions[currentQuestionIndex + 1];
      if (nextQ.section !== currentQuestion.section && isStrictSectional && !canSwitchSections) {
        setToastMessage("You must wait for the section time to complete.");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      const nextSecIdx = sections.indexOf(nextQ.section);
      if (nextSecIdx !== -1 && nextSecIdx !== currentSectionIndex) {
        setCurrentSectionIndex(nextSecIdx);
        currentSectionIndexRef.current = nextSecIdx;
      }
      
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      currentQuestionIndexRef.current = nextIdx;

      const nextId = test.questions[nextIdx].id;
      if (statuses[nextId] === 'unvisited' || !statuses[nextId]) {
        const updatedStatuses = { ...(statusesRef.current || statuses), [nextId]: 'unanswered' as QuestionStatus };
        statusesRef.current = updatedStatuses;
        setStatuses(updatedStatuses);
      }

      recordAction('save_and_next', {
        questionId: currentQuestion.id,
        questionIndex: currentQuestionIndex,
        sectionIndex: currentSectionIndex,
      });

      syncSession({
        currentQuestionIndex: nextIdx,
        currentSectionIndex: nextSecIdx !== -1 ? nextSecIdx : currentSectionIndex,
      });
    }
  };

  const handleMarkReview = () => {
    const isAnswered = !!answers[currentQuestion.id];
    const newStatuses = { 
      ...statuses, 
      [currentQuestion.id]: isAnswered ? ('answered_marked' as QuestionStatus) : ('marked' as QuestionStatus) 
    };
    statusesRef.current = newStatuses;
    setStatuses(newStatuses);

    recordAction('mark_review', {
      questionId: currentQuestion.id,
      questionIndex: currentQuestionIndex,
      sectionIndex: currentSectionIndex,
      status: newStatuses[currentQuestion.id],
    });

    syncSession();
    handleNext();
  };
  
  const handleClearResponse = () => {
    const prevOptionId = answers[currentQuestion.id];
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    const newStatuses = {
      ...statuses,
      [currentQuestion.id]: 'unanswered' as QuestionStatus
    };

    answersRef.current = newAnswers;
    statusesRef.current = newStatuses;

    setAnswers(newAnswers);
    setStatuses(newStatuses);

    recordAction('answer_clear', {
      questionId: currentQuestion.id,
      questionIndex: currentQuestionIndex,
      sectionIndex: currentSectionIndex,
      previousOptionId: prevOptionId,
      status: 'unanswered',
    });

    syncSession();
  };

  const handleJumpToQuestion = (index: number, forceSectionCheck?: string) => {
    const targetQ = test.questions[index];
    if (!targetQ) return;
    const targetSec = targetQ.section;
    const targetSecIdx = sections.indexOf(targetSec);

    if (isStrictSectional && !canSwitchSections && targetSec !== (forceSectionCheck || sections[currentSectionIndex])) {
      setToastMessage("You cannot jump to a different section in strict mode.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    // update current question status if leaving
    if (statuses[currentQuestion.id] === 'unvisited') {
       if (!answers[currentQuestion.id]) {
         const nextStatuses = { ...statuses, [currentQuestion.id]: 'unanswered' as QuestionStatus };
         statusesRef.current = nextStatuses;
         setStatuses(nextStatuses);
       }
    }

    if (targetSecIdx !== -1 && targetSecIdx !== currentSectionIndex) {
      setCurrentSectionIndex(targetSecIdx);
      currentSectionIndexRef.current = targetSecIdx;
    }
    
    setCurrentQuestionIndex(index);
    currentQuestionIndexRef.current = index;
    
    const targetId = test.questions[index].id;
    if (statuses[targetId] === 'unvisited' || !statuses[targetId]) {
      const updatedStatuses = { ...(statusesRef.current || statuses), [targetId]: 'unanswered' as QuestionStatus };
      statusesRef.current = updatedStatuses;
      setStatuses(updatedStatuses);
    }

    recordAction('jump_question', {
      questionId: targetQ.id,
      questionIndex: index,
      sectionIndex: targetSecIdx !== -1 ? targetSecIdx : currentSectionIndex,
      sectionName: targetSec,
    });

    syncSession({
      currentQuestionIndex: index,
      currentSectionIndex: targetSecIdx !== -1 ? targetSecIdx : currentSectionIndex,
    });
  };
  handleJumpToQuestionRef.current = handleJumpToQuestion;

  const handleSectionClick = (sectionName: string) => {
    const firstQIndex = test.questions.findIndex(q => q.section === sectionName);
    if (firstQIndex !== -1) {
      recordAction('switch_section', {
        sectionName,
        sectionIndex: sections.indexOf(sectionName),
      });
      handleJumpToQuestion(firstQIndex, sectionName);
    }
  };

  const positiveMarks = test?.positiveMarks ?? (test?.examCategory === 'SSC CGL' ? 2.0 : 1.0);
  const negativeMarks = test?.negativeMarks ?? (test?.examCategory === 'SSC CGL' ? 0.5 : 0.25);

  const handleSubmit = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    let correct = 0;
    let incorrect = 0;
    
    const finalAnswers = answersRef.current || answers;
    const finalStatuses = statusesRef.current || statuses;
    const finalTimeSpent = timeSpentRef.current || timeSpent;

    test.questions.forEach(q => {
      if (finalAnswers[q.id] === q.correctOptionId) {
        correct++;
      } else if (finalAnswers[q.id]) {
        incorrect++;
      }
    });

    const grossScore = correct * positiveMarks;
    const penalty = incorrect * negativeMarks;
    const netScore = Number((grossScore - penalty).toFixed(2));
    
    const startTime = sessionStartTimeRef.current || (Date.now() - ((test.timeLimit - timeLeft) * 1000));
    const endTime = Math.min(Date.now(), sessionEndTimeRef.current || Date.now());

    recordAction('test_submit', {
      questionIndex: currentQuestionIndexRef.current,
      sectionIndex: currentSectionIndexRef.current,
    });

    const attempt: TestAttempt = {
      id: uuidv4(),
      testId: test.id,
      startTime,
      endTime,
      durationMs: Math.max(0, endTime - startTime),
      answers: finalAnswers,
      statuses: finalStatuses,
      timeSpent: finalTimeSpent,
      actionLogs: actionLogsRef.current,
      questionTimestamps: questionTimestampsRef.current,
      completed: true,
      score: netScore, 
      totalQuestions: test.questions.length,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      savedToDriveAt: isDriveConnected ? Date.now() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    addAttempt(attempt);
    if (testId) {
      clearActiveTestSession(testId);
      try {
        localStorage.removeItem('mockly_active_session_' + testId);
      } catch (e) {}
    }

    // Priority 1: Save completed attempt directly to Google Drive & delete live session file
    if (isDriveConnected) {
      saveCompletedAttempt(attempt, test.title);
      deleteLiveSession(testId, test.title);
    } else if (user && testId) {
      deleteActiveSessionFromFirestore(user.uid, testId);
      saveToFirestore(user.uid, null, true);
    }
    navigate(`/review/${attempt.id}`);
  };
  handleSubmitRef.current = handleSubmit;

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
    unvisited: (test?.questions?.length || 0) - Object.keys(statuses).filter(k => statuses[k] !== 'unvisited').length
  };


  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      handleJumpToQuestion(currentQuestionIndex - 1);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (isPaused || showConfirm || showReportModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1-4 or A-D for options
      if (!currentQuestion) return;
      const opts = currentQuestion.options;
      
      let selectedIdx = -1;
      if (e.key >= '1' && e.key <= '4') {
        selectedIdx = parseInt(e.key) - 1;
      } else if (e.key.toLowerCase() === 'a') selectedIdx = 0;
      else if (e.key.toLowerCase() === 'b') selectedIdx = 1;
      else if (e.key.toLowerCase() === 'c') selectedIdx = 2;
      else if (e.key.toLowerCase() === 'd') selectedIdx = 3;

      if (selectedIdx >= 0 && selectedIdx < opts.length) {
        handleOptionSelect(opts[selectedIdx].id);
        return;
      }

      if (e.key === 'Enter') {
        if (currentQuestionIndex === (test?.questions?.length || 0) - 1) {
           setShowConfirm('submit');
        } else {
           handleNext();
        }
      } else if (e.key === 'ArrowRight') {
        if (currentQuestionIndex < (test?.questions?.length || 0) - 1) handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key.toLowerCase() === 'm') {
        handleMarkReview();
      } else if (e.key.toLowerCase() === 'c') {
        handleClearResponse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, showConfirm, showReportModal, currentQuestion, currentQuestionIndex, test?.questions?.length, handleNext, handlePrev, handleMarkReview, handleClearResponse, handleOptionSelect]);

  const qText = getLocalizedText(currentQuestion?.text, language);


  if (!test) {
    if (!isInitialized || isFetchingRemote) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading test session from Firebase...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Test Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">The test link may be invalid or was deleted by the creator.</p>
          <button onClick={() => navigate('/tests')} className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs">
            Back to All Tests
          </button>
        </div>
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Exam Access Restricted</h2>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{test.title}</p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            This test has been marked as <strong>Private / Restricted</strong>. Only the creator has permission to take this exam.
          </p>
          <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Owner: {test.ownerName || 'Verified User'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ask the creator to change the test sharing setting to <strong>'Anyone with the link'</strong>.
            </p>
          </div>
          <button 
            onClick={() => navigate('/tests')}
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Scheduled Test Waiting Room Screen if opened before scheduled start time
  if (isBeforeScheduledStart) {
    const msLeft = Math.max(0, scheduledStartTime - currentTime);
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
    const minsLeft = Math.floor((msLeft / (1000 * 60)) % 60);
    const secsLeft = Math.floor((msLeft / 1000) % 60);

    const formattedStartDate = new Date(scheduledStartTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const formattedEndDate = new Date(scheduledEndTime).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900">
        {/* Waiting Room Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/test-details/${test.id}`)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Details</span>
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Scheduled Exam Waiting Room</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-slate-300">
              Current Time: {new Date(currentTime).toLocaleTimeString()}
            </span>
          </div>
        </header>

        {/* Waiting Room Main Body */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 flex flex-col justify-center items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wide mb-6">
            <Calendar className="w-3.5 h-3.5" />
            Exam Opens Automatically On Schedule
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight max-w-2xl">
            {test.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-lg">
            {test.examCategory || 'Scheduled Mock Test'} • {test.questions.length} Questions • {Math.floor(test.timeLimit / 60)} Minutes
          </p>

          {/* Countdown Blocks */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 my-8 sm:my-10 w-full max-w-md">
            {daysLeft > 0 && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-mono font-black text-amber-400">
                  {daysLeft.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Days</span>
              </div>
            )}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col items-center">
              <span className="text-2xl sm:text-4xl font-mono font-black text-amber-400">
                {hoursLeft.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Hours</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col items-center">
              <span className="text-2xl sm:text-4xl font-mono font-black text-amber-400">
                {minsLeft.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Minutes</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col items-center">
              <span className="text-2xl sm:text-4xl font-mono font-black text-amber-400">
                {secsLeft.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Seconds</span>
            </div>
          </div>

          {/* Schedule Window Details Banner */}
          <div className="w-full max-w-lg bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-5 text-left space-y-3 mb-6">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
              <span className="text-xs text-slate-400 font-medium">Scheduled Test Window</span>
              <span className="text-xs font-bold text-amber-400">{formattedStartDate} - {formattedEndDate}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
              <span className="text-xs text-slate-400 font-medium">Marking Scheme</span>
              <span className="text-xs font-bold text-slate-200">
                +{test.positiveMarks || 1.0} / -{(test.negativeMarks ?? 0.25).toFixed(2)} Marks
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Timing Mode</span>
              <span className="text-xs font-bold text-slate-200">
                {isStrictSectional ? 'Strict Sectional Timers' : 'Flexible Sectional Navigation'}
              </span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="w-full max-w-lg bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-left text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Important Instructions:</span>
            </div>
            <p className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>Please keep this screen open. The test paper will automatically unlock and start precisely when the countdown reaches 00:00:00.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>Answers and progress are securely synchronized in real-time to Google Drive.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>The test will automatically auto-submit at <strong>{formattedEndDate}</strong>.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-white font-sans text-slate-800 overflow-hidden select-none" id="mock-test-root">
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
           <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col items-center text-center">
             <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
               <Clock className="w-7 h-7" />
             </div>
             <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Test Paused</h2>
             <p className="text-slate-500 text-sm mb-6 max-w-sm">
               Timer is frozen at <strong className="font-mono text-slate-800">{formatTime(timeLeft)}</strong>. Responses are saved.
             </p>
             <div className="w-full flex flex-col gap-2.5">
               <button 
                 onClick={() => { 
                   setIsPaused(false); 
                   recordAction('resume');
                   syncSession({ isPaused: false }); 
                 }}
                 className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
               >
                 <Play className="w-4 h-4 fill-white" /> Resume Test
               </button>
               <button 
                 onClick={() => { setIsPaused(false); setShowConfirm('submit'); }}
                 className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
               >
                 <CheckCircle2 className="w-4 h-4" /> End Test & View Results
               </button>
               <button 
                 onClick={() => { syncSession({ isPaused: true }); navigate(`/test-details/${test.id}`); }}
                 className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
               >
                 <LogOut className="w-4 h-4" /> Save & Exit (Resume Later)
               </button>
               <button 
                 onClick={() => setShowConfirm('restart')}
                 className="w-full py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
               >
                 <RotateCcw className="w-3.5 h-3.5" /> Restart Test
               </button>
             </div>
           </div>
        </div>
      )}
      
      {showConfirm === 'restart' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2 text-red-600">
              <RotateCcw className="w-5 h-5" /> Restart Test?
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              This will clear all your answers and restart the timer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={() => { setShowConfirm(null); handleRestartTest(); }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors">Restart</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm === 'exit' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-amber-500" /> Leave or End Test?
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              Choose how you want to finish: you can submit to see your score right now, or save your progress to resume later.
            </p>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => {
                  setShowConfirm(null);
                  handleSubmit();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> End Test & View Results Now
              </button>
              <button 
                onClick={() => {
                  setShowConfirm(null);
                  syncSession({ isPaused: true });
                  navigate(`/test-details/${test.id}`);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Save Progress & Resume Later
              </button>
              <button 
                onClick={() => setShowConfirm(null)} 
                className="w-full py-2 text-slate-500 hover:bg-slate-50 font-medium rounded-xl text-sm transition-colors"
              >
                Cancel (Keep Taking Test)
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm === 'submit' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">Submit / End Test?</h3>
            <p className="text-xs text-slate-500 text-center mb-5">
              You can end your test now and view your comprehensive scorecard, accuracy, and solution explanations.
            </p>
            
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-emerald-600">{counts.answered + counts.answered_marked}</div>
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Answered</div>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-rose-600">{counts.unanswered}</div>
                <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Unanswered</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-purple-600">{counts.marked}</div>
                <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Marked</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-slate-600">{counts.unvisited}</div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Not Visited</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(null)} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Resume Test
              </button>
              <button 
                onClick={() => { setShowConfirm(null); handleSubmit(); }} 
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Submit & View Results
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Report Issue
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <select id="report-reason" className="w-full text-sm border-slate-300 rounded-lg p-2 bg-slate-50 focus:ring-blue-500 focus:border-blue-500">
                  <option value="wrong_answer">Wrong Answer Key</option>
                  <option value="translation">Translation Issue</option>
                  <option value="incomplete">Incomplete Question</option>
                  <option value="formatting">Formatting/Image Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Details (Optional)</label>
                <textarea id="report-comment" className="w-full text-sm border-slate-300 rounded-lg p-2 bg-slate-50 h-20 focus:ring-blue-500 focus:border-blue-500" placeholder="Briefly describe the issue..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  const reason = (document.getElementById('report-reason') as HTMLSelectElement).value;
                  const comment = (document.getElementById('report-comment') as HTMLTextAreaElement).value;
                  reportedQuestionsRef.current[currentQuestion.id] = { reason, comment };
                  setShowReportModal(false);
                }} 
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors"
              >Report</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="h-12 border-b border-slate-200 bg-white px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 w-1/3">
          <span className="font-bold text-sm text-slate-800 truncate hidden sm:inline">{test.examCategory || "SSC CGL"}</span>
          <div className="hidden sm:block w-px h-4 bg-slate-300" />
          <span className="text-sm font-semibold text-slate-600 truncate max-w-[120px] sm:max-w-[200px]" title={test.title}>{test.title}</span>
        </div>
        
        <div className="hidden md:flex items-center justify-center gap-3 text-sm font-medium text-slate-600 w-1/3">
          <span className="truncate">{sections[currentSectionIndex]}</span>
          <div className="w-px h-4 bg-slate-300" />
          <span className="whitespace-nowrap">Q {currentQuestionIndex + 1} / {test.questions.length}</span>
        </div>
        
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3 shrink-0">
          {/* Google Drive Live Attendance Sync Badge */}
          {isDriveConnected ? (
            <div 
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 whitespace-nowrap shadow-2xs"
              title="Every choice and action is seamlessly synced to Google Drive"
            >
              {liveSyncStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                  <span className="text-indigo-700">Syncing to Drive...</span>
                </>
              ) : liveSyncStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span className="text-amber-700">Drive Saved Locally</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Drive Live Sync</span>
                </>
              )}
            </div>
          ) : (
            <button 
              onClick={connectDrive} 
              disabled={isDriveConnecting}
              className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors shadow-2xs" 
              title="Connect Google Drive to auto-save every action and choice directly to your Google Drive"
            >
              <HardDrive className="w-3 h-3 text-indigo-600" />
              <span className="hidden sm:inline">{isDriveConnecting ? 'Connecting...' : 'Connect Drive Sync'}</span>
            </button>
          )}

          <div className={cn("font-mono font-bold text-sm sm:text-base px-2 py-0.5 rounded whitespace-nowrap", timeLeft < 60 ? "bg-red-100 text-red-700" : timeLeft < 300 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700")}>
            {formatTime(isStrictSectional ? (sectionTimeLeft[currentSectionIndex] || 0) : timeLeft)}
          </div>

          {/* End Test Button in Top Header */}
          <button 
            onClick={() => setShowConfirm('submit')} 
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-xs"
            title="End test now and see results"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">End Test</span>
          </button>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button title="Full Screen" onClick={handleToggleFullscreen} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden sm:block"><Maximize size={16}/></button>
            <button 
              title={isPaused ? "Resume" : "Pause"} 
              onClick={() => { 
                const n = !isPaused; 
                setIsPaused(n); 
                recordAction(n ? 'pause' : 'resume');
                syncSession({ isPaused: n }); 
              }} 
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden sm:block"
            >
              {isPaused ? <Play size={16}/> : <Pause size={16}/>}
            </button>
            <button title="Exit or End Test" onClick={() => setShowConfirm('exit')} className="p-1.5 hover:bg-red-50 text-red-600 rounded hidden sm:block"><LogOut size={16}/></button>
            <button onClick={() => setShowPalette(!showPalette)} className="lg:hidden p-1.5 hover:bg-slate-100 text-slate-600 rounded"><Menu size={18}/></button>
          </div>
        </div>
      </header>

      {/* Sections Bar */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 shrink-0 h-10 px-1 overflow-x-auto z-10 scrollbar-hide">
        <div className="flex items-center h-full min-w-max px-1">
           {sections.map((sec, idx) => {
             const isCurrent = idx === currentSectionIndex;
             const isLocked = isStrictSectional && !canSwitchSections && !isCurrent;
             
             const sectionQuestions = test.questions.filter(q => q.section === sec);
             const answeredInSection = sectionQuestions.filter(q => statuses[q.id] === 'answered' || statuses[q.id] === 'answered_marked').length;

             return (
               <button 
                 key={sec} 
                 disabled={isLocked}
                 onClick={() => {
                   if (isLocked) return;
                   setCurrentSectionIndex(idx);
                   const firstQIndex = test.questions.findIndex(q => q.section === sec);
                   if (firstQIndex !== -1) handleJumpToQuestion(firstQIndex, sec);
                 }}
                 className={cn(
                   "px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors h-full flex items-center border-b-2",
                   isLocked ? "cursor-not-allowed opacity-40 text-slate-400 border-transparent" : "cursor-pointer",
                   isCurrent 
                     ? "border-blue-600 text-blue-700 bg-blue-50/50" 
                     : !isLocked ? "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900" : ""
                 )}
               >
                 {sec} <span className="ml-1.5 opacity-70 font-semibold">{answeredInSection}/{sectionQuestions.length}</span>
               </button>
             );
           })}
        </div>
        <div className="flex items-center gap-2 px-3 text-xs shrink-0">
          {availableLanguages.length > 1 && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none text-slate-700 font-semibold text-xs cursor-pointer outline-none hover:text-blue-600"
            >
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang === 'en' ? 'ENG' : lang === 'hi' ? 'HIN' : lang.toUpperCase()}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Question & Answer Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col mx-auto w-full max-w-5xl">
            
            {/* Question Meta */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4 shrink-0">
               <span className="font-bold text-base sm:text-lg text-slate-800">Question {currentQuestionIndex + 1}</span>
               <div className="flex items-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    <span className="text-green-600">+{positiveMarks}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-red-500">-{negativeMarks}</span>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className={cn(
                      "flex items-center gap-1 transition-colors px-2 py-1 rounded",
                      reportedQuestions[currentQuestion?.id] ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                    title={reportedQuestions[currentQuestion?.id] ? "Reported" : "Report"}
                  >
                     <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>
            
            {/* Question Text */}
            <div className="text-base sm:text-[17px] text-slate-800 mb-6 leading-relaxed flex-1 select-text">
              <div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText || ''}</Markdown></div>
            </div>
            
            {/* Options */}
            <div className="space-y-2 mt-auto shrink-0 pb-4">
              {currentQuestion?.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const optText = getLocalizedText(option.text, language);
                const char = String.fromCharCode(65 + idx);
                
                return (
                  <label 
                    key={option.id} 
                    className={cn(
                      "flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all",
                      isSelected ? "bg-blue-50/50 border-blue-600 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center h-6 mt-0.5 mr-3">
                       <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() => handleOptionSelect(option.id)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                       />
                    </div>
                    <span className="text-sm sm:text-base text-slate-800 flex-1 pt-[1px] select-text">
                      <div className="markdown-body"><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{optText || ''}</Markdown></div>
                    </span>
                    <span className="hidden sm:flex text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 ml-2 mt-0.5 bg-white">
                      {char}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <footer className="h-14 sm:h-16 flex items-center justify-between px-2 sm:px-4 bg-white border-t border-slate-200 shrink-0 gap-2">
            <div className="flex gap-2">
              <button 
                onClick={handleMarkReview}
                className="px-3 sm:px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center gap-1"
                title="Shortcut: M"
              >
                <Flag className="w-3.5 h-3.5 hidden sm:block" /> Mark <span className="hidden sm:inline">& Next</span>
              </button>
              <button 
                onClick={handleClearResponse}
                className="px-3 sm:px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                title="Shortcut: C"
              >
                Clear
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* End Test Button accessible on all questions */}
              <button 
                onClick={() => setShowConfirm('submit')}
                className="px-3 sm:px-4 py-2 border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition-colors text-xs sm:text-sm flex items-center gap-1"
                title="End test now and view results"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden xs:inline">End Test</span>
              </button>

              <button 
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-3 sm:px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
              </button>
              
              {currentQuestionIndex === test.questions.length - 1 ? (
                <button 
                  onClick={() => { handleNext(); setShowConfirm('submit'); }}
                  className="px-5 sm:px-8 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors text-xs sm:text-sm flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="px-5 sm:px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center gap-1 shadow-sm"
                  title="Shortcut: Enter"
                >
                  Save & Next <ChevronRight className="w-4 h-4 hidden sm:block" />
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* Right Sidebar - Offcanvas on mobile */}
        {showPalette && (
           <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowPalette(false)} />
        )}
        
        <aside className={cn(
          "fixed inset-y-0 right-0 z-50 w-[280px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 lg:static lg:flex transition-transform duration-300 ease-in-out",
          showPalette ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Candidate Box */}
          <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'C'}&background=f1f5f9&color=334155`} alt="User" className="w-9 h-9 rounded border border-slate-200" />
              <div className="font-bold text-sm text-slate-800 truncate w-36">{user?.displayName || 'Candidate'}</div>
            </div>
            <button className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded" onClick={() => setShowPalette(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Status Legends (Compact) */}
          <div className="p-2 border-b border-slate-200 bg-white grid grid-cols-4 gap-1 text-center">
            <div className="flex flex-col items-center p-1" title="Answered">
              <div className="w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold bg-[#25b55d] rounded-t-full rounded-b-sm mb-1">{counts.answered}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Ans</span>
            </div>
            <div className="flex flex-col items-center p-1" title="Not Answered">
              <div className="w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold bg-[#e53935] rounded-b-full rounded-t-sm mb-1">{counts.unanswered}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Not</span>
            </div>
            <div className="flex flex-col items-center p-1" title="Marked">
              <div className="w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold bg-[#7e57c2] rounded-full mb-1">{counts.marked}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Mark</span>
            </div>
            <div className="flex flex-col items-center p-1" title="Not Visited">
              <div className="w-5 h-5 flex items-center justify-center text-slate-600 text-[10px] font-bold bg-white border border-slate-300 rounded-sm mb-1">{counts.unvisited}</div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">New</span>
            </div>
            <div className="col-span-4 flex justify-center mt-1">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  <div className="w-3 h-3 bg-[#7e57c2] rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-1.5 after:h-1.5 after:bg-[#25b55d] after:rounded-full after:border after:border-white"></div>
                  Ans & Marked: {counts.answered_marked}
               </div>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {sections.map(sec => {
              const secQuestions = test.questions.map((q, idx) => ({ q, idx })).filter(item => item.q.section === sec);
              if (secQuestions.length === 0) return null;
              
              return (
                <div key={sec} className="mb-4">
                  <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{sec}</h3>
                  <div className="grid grid-cols-5 gap-1.5">
                    {secQuestions.map(({q, idx}) => {
                      const status = statuses[q.id] || 'unvisited';
                      const isActive = currentQuestionIndex === idx;
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            if (q.section !== sections[currentSectionIndex] && isStrictSectional && !canSwitchSections) return;
                            handleJumpToQuestion(idx);
                          }}
                          disabled={q.section !== sections[currentSectionIndex] && isStrictSectional && !canSwitchSections}
                          className={cn(
                            "w-9 h-9 flex items-center justify-center text-[11px] font-bold transition-all mx-auto",
                            getStatusShapeClasses(status),
                            isActive && "ring-2 ring-blue-600 ring-offset-2 scale-105 z-10",
                            q.section !== sections[currentSectionIndex] && isStrictSectional && !canSwitchSections && "opacity-40 grayscale cursor-not-allowed"
                          )}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Submit Action inside Palette */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <button
              onClick={() => setShowConfirm('submit')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-white" /> Submit / End Test
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
