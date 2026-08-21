import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { saveTestToFirestore, saveToFirestore, deleteTestFromFirestore, sanitizeTestId } from '../lib/firebaseSync';
import { Upload, FileJson, Download, CheckCircle2, AlertCircle, Trash2, Database, ShieldCheck, Sliders, Sparkles, AlarmClock, ArrowLeftRight, Share2, Globe, Lock, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Test, Question } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ExamPersonalityModal } from '../components/ExamPersonalityModal';
import { ShareTestModal } from '../components/ShareTestModal';
import { getTestDisplayDate } from '../lib/dateUtils';

export default function QuestionBank() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tests, importTests, deleteTest, clearTests, updateTest } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [testToDelete, setTestToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [testToEditPersonality, setTestToEditPersonality] = useState<Test | null>(null);
  const [testToShare, setTestToShare] = useState<Test | null>(null);
  const [pendingImportTests, setPendingImportTests] = useState<any[] | null>(null);

  
    const handleExportTest = (test: Test) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          processJSON(content);
        } else {
          setStatus({ type: 'error', message: 'Unsupported file format. Please use JSON.' });
        }
      } catch (err) {
        setStatus({ type: 'error', message: 'Error parsing file: ' + (err as Error).message });
      }
    };
    reader.readAsText(file);
  };

  const processJSON = (content: string) => {
    let parsed = JSON.parse(content);
    let newTests: any[] = [];

    // Case 1: ProductionMockTestBundle (schemaVersion 2.0.0 or containing questionBank + mockTests)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questionBank) && Array.isArray(parsed.mockTests)) {
      const bankMap = new Map<string, any>();
      parsed.questionBank.forEach((q: any) => {
        if (q && q.id) {
          bankMap.set(q.id, q);
        }
      });

      const answerKeys = parsed.answerKeys || {};

      newTests = parsed.mockTests.map((t: any) => {
        const testAnsKey = answerKeys[t.id] || {};
        const testQuestions: any[] = [];
        const testSections: any[] = [];

        if (Array.isArray(t.sections)) {
          t.sections.forEach((sec: any) => {
            const secName = typeof sec.name === 'object' ? (sec.name.en || Object.values(sec.name)[0] || 'Section') : String(sec.name || 'Section');
            testSections.push({
              name: secName,
              timeLimit: sec.timeLimit || 900
            });

            if (Array.isArray(sec.questionIds)) {
              sec.questionIds.forEach((qId: string) => {
                const qRaw = bankMap.get(qId);
                if (qRaw) {
                  const correctOpt = testAnsKey[qId] || qRaw.correctOptionId || qRaw.options?.[0]?.id || 'a';
                  const expText = qRaw.solution?.short || qRaw.solution?.detailed || qRaw.explanation;
                  testQuestions.push({
                    ...qRaw,
                    section: secName,
                    correctOptionId: correctOpt,
                    explanation: expText
                  });
                }
              });
            }
          });
        }

        const posMarks = t.scoring?.correct ?? parsed.scoring?.correct ?? (t.examCategory === 'SSC CGL' ? 2.0 : 1.0);
        const negMarks = Math.abs(t.scoring?.incorrect ?? parsed.scoring?.incorrect ?? (t.examCategory === 'SSC CGL' ? 0.5 : 0.25));

        return {
          id: t.id || uuidv4(),
          title: t.title || 'Untitled Test',
          description: t.description || '',
          timeLimit: t.timeLimit || 3600,
          themeColor: t.themeColor || '#8b5cf6',
          examCategory: t.examCategory || parsed.exam?.name || 'General',
          positiveMarks: posMarks,
          negativeMarks: negMarks,
          sections: testSections,
          questions: testQuestions,
          scoring: t.scoring || parsed.scoring,
          settings: t.settings || parsed.settings,
          exam: parsed.exam
        };
      });
    } else {
      // Case 2: Legacy array or single test object
      if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.tests)) {
          parsed = parsed.tests;
        } else if (parsed.title && Array.isArray(parsed.questions)) {
          parsed = [parsed];
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.title && Array.isArray(parsed[0]?.questions)) {
        newTests = parsed.map((test: any) => {
          const isNewFormat = test.testMode !== undefined || test.questions?.[0]?.i !== undefined || test.questions?.[0]?.sectionId !== undefined;
          
          let mappedQuestions = test.questions;
          let mappedSections = test.sections || [];
          let positiveMarks = test.positiveMarks !== undefined ? Number(test.positiveMarks) : (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
          let negativeMarks = test.negativeMarks !== undefined ? Number(test.negativeMarks) : (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
          let strictSectionalTiming = test.settings?.strictSectionalTiming === true;

          if (isNewFormat) {
             if (test.testMode) {
                positiveMarks = test.testMode.marksPerQuestion ?? positiveMarks;
                negativeMarks = test.testMode.negativeMarksPerWrongAnswer ?? negativeMarks;
             }
             if (test.Sectionaltimer === 'true' || test.Sectionaltimer === true) {
                strictSectionalTiming = true;
             }
             
             const sectionIdToName = new Map();
             mappedSections = mappedSections.map((sec: any) => {
                const name = sec.title || sec.name;
                if (sec.id !== undefined) sectionIdToName.set(sec.id, name);
                return {
                   ...sec,
                   name: name,
                   timeLimit: sec.timeLimit,
                   id: sec.id?.toString()
                };
             });

             mappedQuestions = mappedQuestions.map((q: any) => {
                const options = Array.isArray(q.options) ? q.options.map((opt: any) => ({
                   ...opt,
                   id: opt.i || opt.id,
                   text: opt.text
                })) : [];
                return {
                   ...q,
                   id: q.i || q.id || uuidv4(),
                   text: q.text,
                   correctOptionId: q.a || q.correctOptionId,
                   section: sectionIdToName.get(q.sectionId) || q.section,
                   options
                };
             });
          } else {
             mappedQuestions = test.questions.map((q: any) => ({
               ...q,
               id: q.id || uuidv4()
             }));
          }

          return {
            ...test,
            id: test.id || uuidv4(),
            positiveMarks,
            negativeMarks,
            sections: mappedSections,
            questions: mappedQuestions,
            settings: { ...test.settings, strictSectionalTiming }
          };
        });
      } else {
        throw new Error('Invalid JSON format. Expected a ProductionMockTestBundle or array of Test objects.');
      }
    }

    if (newTests.length > 0) {
      setPendingImportTests(newTests);
      setTestToEditPersonality(newTests[0]);
    } else {
      throw new Error('No valid test papers found in JSON.');
    }
  };

  const exportTemplateJSON = async () => {
    try {
      const res = await fetch("/ssc-cgl-18sep2025.json");
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "mock-test-bank-template.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Could not fetch template file.");
      }
    } catch (e) {
      // Fallback direct link
      const link = document.createElement("a");
      link.href = "/ssc-cgl-18sep2025.json";
      link.download = "mock-test-bank-template.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6"
    >
      <div className="pt-0 md:pt-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Question Bank</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your local test repository.</p>
      </div>

      <AnimatePresence>
        {status.type && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-2xl flex items-start gap-3 shadow-sm border ${status.type === 'success' ? 'bg-green-50 border-green-200/50 text-green-800' : 'bg-red-50 border-red-200/50 text-red-800'}`}
          >
            {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" /> : <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />}
            <div>
              <h4 className="font-bold">{status.type === 'success' ? 'Import Successful' : 'Import Failed'}</h4>
              <p className="text-sm mt-0.5 opacity-90">{status.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Import Data</h3>
          </div>
          
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            Upload custom question banks in JSON format. Multi-language (English/Hindi) is supported out of the box.
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".json" 
            className="hidden" 
          />
          
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-auto border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-blue-400 bg-blue-50/50 scale-[1.02]' 
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <Database className={`w-8 h-8 mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-300'}`} />
            <p className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">JSON files only</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <FileJson className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Format Guide</h3>
          </div>
          
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            Our JSON format supports rich mathematical expressions (LaTeX) and multiple languages natively.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 space-y-3 mb-6 mt-auto">
            <div className="flex gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <p><strong className="text-slate-800">Math/LaTeX:</strong> Wrap formulas with <code>$</code> for inline equations or <code>$$</code> for block equations.</p>
            </div>
            <div className="flex gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <p><strong className="text-slate-800">Languages:</strong> Map codes to strings: <code>{"{\"en\": \"...\", \"hi\": \"...\"}"}</code></p>
            </div>
            <div className="flex gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <p><strong className="text-slate-800">Markdown:</strong> Basic styling (bold, italics) is supported.</p>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportTemplateJSON}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="h-4 w-4" /> Download Example Template
          </motion.button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Available Tests in Bank ({tests.length})</h3>
          {tests.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Tests
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-50">
          <AnimatePresence>
            {tests.map((test) => {
              const pos = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
              const neg = test.negativeMarks ?? (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
              const isNoNeg = neg === 0;

              return (
                <motion.div 
                  key={test.id} 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 
                        onClick={() => navigate(`/test-details/${test.id}`)}
                        className="font-bold text-slate-800 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                        title="View Test Info"
                      >
                        {test.title}
                      </h4>
                      {test.examCategory && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {test.examCategory}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {getTestDisplayDate(test)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{test.questions.length} questions</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{test.sections.length} sections</span>
                      
                      {/* Marking Personality Pill */}
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isNoNeg 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {isNoNeg ? 'No Negative Penalty' : `Scheme: +${pos.toFixed(1)} / -${neg.toFixed(2)}`}
                      </span>
                      {test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching && (
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200" title="Strict Sectional Timing Enabled">
                          <AlarmClock className="w-3 h-3 text-orange-500" />
                          Strict Timing
                        </span>
                      )}
                      {test.settings?.allowSectionSwitching && (
                        <span className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200" title="Free Section Switching Allowed (Sectional Timer OFF)">
                          <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                          Switch Sections
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setTestToShare(test)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                      title="Share Mock Test"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setTestToEditPersonality(test)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5"
                      title="Edit Exam Personality & Marking Scheme"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Configure Scheme</span>
                    </button>

                    <button 
                      onClick={() => setTestToDelete({ id: test.id, title: test.title })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove Test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportTest(test);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Export Test to JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {tests.length === 0 && (
             <div className="px-6 py-12 text-center text-slate-400">
               <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
               <p className="text-sm font-medium">Bank is empty</p>
               <p className="text-xs mt-1">Import a JSON file to get started</p>
             </div>
          )}
        </div>
      </motion.div>

      {/* Delete Test Modal */}
      {createPortal(
        <AnimatePresence>
          {testToDelete && (
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
                  Are you sure you want to delete <strong className="text-slate-700">"{testToDelete.title}"</strong> from the Question Bank?
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setTestToDelete(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const idToDelete = testToDelete.id;
                      deleteTest(idToDelete);
                      setTestToDelete(null);
                      if (user?.uid) {
                        await deleteTestFromFirestore(idToDelete);
                        saveToFirestore(user.uid, null, true);
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

      {/* Clear All Tests Modal */}
      {createPortal(
        <AnimatePresence>
          {showClearAllModal && (
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
                <h3 className="text-xl font-bold text-slate-800">Clear Entire Question Bank?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  This will delete all <strong className="text-slate-700">{tests.length} tests</strong> and all associated attempt history from your account.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowClearAllModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const testsToDelete = [...tests];
                      clearTests();
                      setShowClearAllModal(false);
                      if (user?.uid) {
                        for (const t of testsToDelete) {
                          await deleteTestFromFirestore(t.id);
                        }
                        saveToFirestore(user.uid, null, true);
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm text-sm"
                  >
                    Yes, Clear Bank
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Exam Personality Modal */}
      {testToEditPersonality && (
        <ExamPersonalityModal
          isOpen={!!testToEditPersonality}
          onClose={() => {
            setTestToEditPersonality(null);
            if (pendingImportTests) setPendingImportTests(null);
          }}
          test={testToEditPersonality}
          onSave={async (updatedFields) => {
            if (pendingImportTests) {
              const finalizedTests: Test[] = pendingImportTests.map(t => {
                const cleanId = sanitizeTestId(t.id || uuidv4());
                return {
                  ...t,
                  id: cleanId,
                  ownerId: user?.uid || (t as any).ownerId,
                  ownerName: user?.displayName || 'Creator',
                  ownerEmail: user?.email || '',
                  visibility: t.visibility || 'public',
                  isPublic: t.isPublic !== undefined ? t.isPublic : true,
                  ...updatedFields,
                  settings: { ...t.settings, ...(updatedFields.settings || {}) }
                };
              });

              importTests(finalizedTests);
              
              if (user?.uid) {
                for (const t of finalizedTests) {
                  await saveTestToFirestore(user.uid, t);
                }
                saveToFirestore(user.uid, null, true);
              }

              setStatus({ type: 'success', message: `Successfully imported ${finalizedTests.length} test paper(s) & synced across all devices.` });
              setTimeout(() => setStatus({ type: null, message: '' }), 4000);
              setPendingImportTests(null);
            } else {
              const updatedTest: Test = {
                ...testToEditPersonality,
                id: sanitizeTestId(testToEditPersonality.id),
                ownerId: user?.uid || (testToEditPersonality as any).ownerId,
                ownerName: user?.displayName || testToEditPersonality.ownerName || 'Creator',
                ownerEmail: user?.email || testToEditPersonality.ownerEmail || '',
                ...updatedFields,
                settings: { ...testToEditPersonality.settings, ...(updatedFields.settings || {}) }
              };
              updateTest(updatedTest);
              if (user?.uid) {
                await saveTestToFirestore(user.uid, updatedTest);
                saveToFirestore(user.uid, null, true);
              }
            }
            setTestToEditPersonality(null);
          }}
        />
      )}

      {/* Google Drive-style Share Test Modal */}
      {testToShare && (
        <ShareTestModal
          test={testToShare}
          isOpen={!!testToShare}
          onClose={() => setTestToShare(null)}
        />
      )}
    </motion.div>
  );
}
