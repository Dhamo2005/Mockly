import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import { 
  ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, 
  CheckCircle2, Pencil, ChevronRight, LayoutList, Copy, ArrowUpDown
} from 'lucide-react';
import { Question, Option, MediaItem, Test, SectionDef } from '../types';
import { getLocalizedText } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const DEFAULT_QUESTION: Question = {
  id: '',
  section: 'General',
  text: { en: '' },
  options: [
    { id: 'A', text: { en: '' } },
    { id: 'B', text: { en: '' } },
    { id: 'C', text: { en: '' } },
    { id: 'D', text: { en: '' } }
  ],
  correctOptionId: 'A',
  explanation: { en: '' },
  metadata: {
    subject: '',
    topic: '',
    difficulty: 'medium',
    questionType: 'mcq'
  }
};

const LatexPreview = ({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content || '*Preview will appear here*'}
      </Markdown>
    </div>
  </div>
);

const ImageUploadButton = ({ onUpload, label = "Attach Image" }: { onUpload: (media: MediaItem) => void, label?: string }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const mediaItem: MediaItem = { type: 'image', url: base64 };
      onUpload(mediaItem);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline shrink-0 cursor-pointer"
      >
        <ImageIcon className="w-3.5 h-3.5" /> {label}
      </button>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
    </>
  );
};

const MediaGallery = ({ media, onRemove }: { media?: MediaItem[], onRemove: (index: number) => void }) => {
  if (!media || media.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {media.map((m, idx) => (
        <div key={idx} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 w-24 h-24 md:w-32 md:h-32">
          <img src={m.url} alt="Attached media" className="w-full h-full object-contain" />
          <button 
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg opacity-90 transition-opacity"
            title="Remove Image"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const QuestionEditor = ({ 
  question, 
  sections,
  onUpdate, 
  onClose 
}: { 
  question: Question, 
  sections: SectionDef[],
  onUpdate: (q: Question) => void, 
  onClose: () => void 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-10">
      <header className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Sections & Questions</span><span className="sm:hidden">Back</span>
        </button>
        <div className="text-sm font-bold text-slate-800">Edit Question Details</div>
        <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
          Done
        </button>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {/* Basic Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Section</label>
            <select 
              value={question.section || ''}
              onChange={e => onUpdate({ ...question, section: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none bg-white"
            >
              {sections.map(s => {
                const name = typeof s.name === 'string' ? s.name : s.name.en;
                return <option key={name} value={name}>{name}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Subject / Topic (Optional)</label>
            <input 
              type="text"
              value={question.metadata?.topic || ''}
              onChange={e => onUpdate({
                ...question,
                metadata: { ...question.metadata, subject: question.metadata?.subject || '', topic: e.target.value, questionType: 'mcq', difficulty: question.metadata?.difficulty || 'medium' }
              })}
              placeholder="e.g. Algebra, Grammar"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Difficulty</label>
            <select 
              value={question.metadata?.difficulty || 'medium'}
              onChange={e => onUpdate({ 
                ...question, 
                metadata: { ...question.metadata, subject: question.metadata?.subject || '', topic: question.metadata?.topic || '', questionType: 'mcq', difficulty: e.target.value as any } 
              })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Question Text */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-600">Question Text (LaTeX & Markdown Supported)</label>
            <ImageUploadButton 
              onUpload={(mediaItem) => onUpdate({ ...question, media: [...(question.media || []), mediaItem] })} 
            />
          </div>
          <textarea 
            value={question.text.en || ''}
            onChange={e => onUpdate({ ...question, text: { ...question.text, en: e.target.value } })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none min-h-[120px] font-mono"
            placeholder="Enter question text here... use $$ for display math and $ for inline math."
          />
          {question.text.en && <LatexPreview content={question.text.en} />}
          
          <MediaGallery 
            media={question.media} 
            onRemove={(idx) => {
              const newMedia = [...(question.media || [])];
              newMedia.splice(idx, 1);
              onUpdate({ ...question, media: newMedia });
            }} 
          />
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-bold text-slate-600">Options (Click circle to set correct option)</label>
          </div>
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <div key={opt.id} className={`p-3 md:p-4 rounded-xl border-2 transition-colors ${question.correctOptionId === opt.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => onUpdate({ ...question, correctOptionId: opt.id })}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        question.correctOptionId === opt.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                      title={`Set Option ${String.fromCharCode(65 + idx)} as correct`}
                    >
                      {question.correctOptionId === opt.id && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Option {String.fromCharCode(65 + idx)} {question.correctOptionId === opt.id && <span className="text-emerald-600 font-bold ml-1">(Correct Answer)</span>}
                    </span>
                  </div>
                  <ImageUploadButton 
                    onUpload={(mediaItem) => {
                      const newOptions = [...question.options];
                      newOptions[idx] = { ...opt, media: [...(opt.media || []), mediaItem] };
                      onUpdate({ ...question, options: newOptions });
                    }}
                    label="Attach Image to Option"
                  />
                </div>
                <div className="pl-9">
                  <textarea 
                    value={opt.text.en || ''}
                    onChange={e => {
                      const newOptions = [...question.options];
                      newOptions[idx] = { ...opt, text: { ...opt.text, en: e.target.value } };
                      onUpdate({ ...question, options: newOptions });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none bg-white font-mono min-h-[60px]"
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text (LaTeX supported)...`}
                  />
                  {opt.text.en && <LatexPreview content={opt.text.en} />}
                  <MediaGallery 
                    media={opt.media} 
                    onRemove={(mediaIdx) => {
                      const newOptions = [...question.options];
                      const newMedia = [...(opt.media || [])];
                      newMedia.splice(mediaIdx, 1);
                      newOptions[idx] = { ...opt, media: newMedia };
                      onUpdate({ ...question, options: newOptions });
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-600">Explanation / Solution (Optional)</label>
            <ImageUploadButton 
              onUpload={(mediaItem) => onUpdate({ ...question, explanationMedia: [...(question.explanationMedia || []), mediaItem] })} 
              label="Attach Image to Explanation"
            />
          </div>
          <textarea 
            value={question.explanation?.en || ''}
            onChange={e => onUpdate({ ...question, explanation: { ...question.explanation, en: e.target.value } })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none min-h-[100px] font-mono"
            placeholder="Explain why the correct option is correct (LaTeX & Markdown supported)..."
          />
          {question.explanation?.en && <LatexPreview content={question.explanation.en} />}
          <MediaGallery 
            media={question.explanationMedia} 
            onRemove={(idx) => {
              const newMedia = [...(question.explanationMedia || [])];
              newMedia.splice(idx, 1);
              onUpdate({ ...question, explanationMedia: newMedia });
            }} 
          />
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ 
  section, 
  questionsCount, 
  onRename, 
  onDelete 
}: { 
  section: SectionDef, 
  questionsCount: number, 
  onRename: (newName: string) => void, 
  onDelete: () => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const sectionName = typeof section.name === 'string' ? section.name : section.name.en;
  const [name, setName] = useState(sectionName);

  const handleSave = () => {
    if (name.trim() && name !== sectionName) {
      onRename(name.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-100/80 border-b border-slate-200 p-4 md:px-5 flex items-center justify-between">
      {isEditing ? (
        <div className="flex items-center gap-2 w-full max-w-md">
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="flex-1 px-3 py-1.5 text-sm font-bold text-slate-800 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            autoFocus
          />
          <button onClick={handleSave} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-base font-bold text-slate-800">{sectionName}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{questionsCount} Questions</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Rename Section">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Delete Section">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default function TestEditor() {
  const { testId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tests, updateTest, language } = useStore();
  const { saveTest: saveDriveTest, isConnected, autoSync } = useGoogleDrive();
  
  const originalTest = tests.find(t => t.id === testId);
  
  const [test, setTest] = useState<Test | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize test draft
  useEffect(() => {
    if (originalTest && !test) {
      const draft = JSON.parse(JSON.stringify(originalTest)) as Test;
      
      if (!draft.sections) draft.sections = [];
      
      const sectionNames = new Set(draft.sections.map(s => typeof s.name === 'string' ? s.name : s.name.en));
      
      draft.questions.forEach(q => {
        if (!q.section) q.section = 'General';
        if (!sectionNames.has(q.section)) {
          draft.sections.push({ name: q.section, timeLimit: 900 });
          sectionNames.add(q.section);
        }
      });
      
      if (draft.sections.length === 0) {
        draft.sections.push({ name: 'General', timeLimit: 3600 });
      }
      
      setTest(draft);

      // Check if URL specifies questionId to edit immediately
      const initialQId = searchParams.get('questionId');
      if (initialQId && draft.questions.some(q => q.id === initialQId)) {
        setEditingQuestionId(initialQId);
      }
    }
  }, [originalTest, searchParams]);

  if (!originalTest || !test) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">Loading editor...</p>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    updateTest(test);
    if (isConnected && autoSync) {
      await saveDriveTest(test);
    }
    setIsSaving(false);
    navigate(`/test-details/${test.id}`);
  };

  // Section CRUD
  const handleAddSection = () => {
    const newSectionName = `New Section ${test.sections.length + 1}`;
    setTest({
      ...test,
      sections: [...test.sections, { name: newSectionName, timeLimit: 900 }]
    });
  };

  const handleRenameSection = (oldName: string, newName: string) => {
    const updatedSections = test.sections.map(s => {
      const sName = typeof s.name === 'string' ? s.name : s.name.en;
      return sName === oldName ? { ...s, name: newName } : s;
    });
    const updatedQuestions = test.questions.map(q => 
      q.section === oldName ? { ...q, section: newName } : q
    );
    setTest({ ...test, sections: updatedSections, questions: updatedQuestions });
  };

  const handleDeleteSection = (sectionName: string) => {
    if (confirm(`Are you sure you want to delete "${sectionName}" and all its questions?`)) {
      const updatedSections = test.sections.filter(s => {
        const sName = typeof s.name === 'string' ? s.name : s.name.en;
        return sName !== sectionName;
      });
      const updatedQuestions = test.questions.filter(q => q.section !== sectionName);
      setTest({ ...test, sections: updatedSections, questions: updatedQuestions });
    }
  };

  // Question CRUD
  const handleAddQuestion = (sectionName: string) => {
    const newQ = { ...DEFAULT_QUESTION, id: crypto.randomUUID(), section: sectionName };
    setTest({ ...test, questions: [...test.questions, newQ] });
    setEditingQuestionId(newQ.id);
  };

  const handleDuplicateQuestion = (question: Question) => {
    const duplicated: Question = {
      ...JSON.parse(JSON.stringify(question)),
      id: crypto.randomUUID()
    };
    const targetIdx = test.questions.findIndex(q => q.id === question.id);
    const newQuestions = [...test.questions];
    newQuestions.splice(targetIdx + 1, 0, duplicated);
    setTest({ ...test, questions: newQuestions });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setTest({ ...test, questions: test.questions.filter(q => q.id !== qId) });
      if (editingQuestionId === qId) {
        setEditingQuestionId(null);
      }
    }
  };

  const handleUpdateQuestion = (updatedQ: Question) => {
    setTest({
      ...test,
      questions: test.questions.map(q => q.id === updatedQ.id ? updatedQ : q)
    });
  };

  // If we are editing a specific question, show the QuestionEditor view
  const editingQuestion = editingQuestionId ? test.questions.find(q => q.id === editingQuestionId) : null;
  if (editingQuestion) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto w-full font-sans p-4 md:p-8">
          <QuestionEditor 
            question={editingQuestion}
            sections={test.sections}
            onUpdate={handleUpdateQuestion}
            onClose={() => {
              setEditingQuestionId(null);
              searchParams.delete('questionId');
              setSearchParams(searchParams);
            }}
          />
        </div>
      </div>
    );
  }

  // Otherwise, show the Sections & Questions Structure View
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto w-full font-sans px-4 md:px-8 py-6 pb-28">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 md:py-6 mb-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => navigate(`/test-details/${test.id}`)}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
              title="Back to Test Details"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight truncate">Test Content Editor</h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium truncate mt-0.5">{test.title} • {test.questions.length} total questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => navigate(`/test-details/${test.id}`)}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </header>

        {/* Sections List */}
        <div className="space-y-6">
          {test.sections.map((section, sIdx) => {
            const sectionName = typeof section.name === 'string' ? section.name : section.name.en;
            const sectionQuestions = test.questions.filter(q => q.section === sectionName);

            return (
              <div key={sectionName || sIdx} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <SectionHeader 
                  section={section} 
                  questionsCount={sectionQuestions.length}
                  onRename={(newName) => handleRenameSection(sectionName, newName)}
                  onDelete={() => handleDeleteSection(sectionName)}
                />
                
                <div className="p-4 md:p-5 space-y-3">
                  {sectionQuestions.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm font-semibold text-slate-400">No questions in this section yet.</p>
                    </div>
                  ) : (
                    sectionQuestions.map((q, idx) => (
                      <div key={q.id} className="p-3.5 md:p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-blue-200 transition-colors flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                              Q{idx + 1}
                            </span>
                            {q.metadata?.difficulty && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {q.metadata.difficulty}
                              </span>
                            )}
                            {(q.media?.length || 0) > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                <ImageIcon className="w-3 h-3" /> Image
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-slate-700 line-clamp-2 md:line-clamp-3 prose prose-sm max-w-none">
                            <div className="markdown-body">
                              <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {getLocalizedText(q.text, language) || '*Empty Question*'}
                              </Markdown>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                          <button 
                            type="button"
                            onClick={() => setEditingQuestionId(q.id)}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDuplicateQuestion(q)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Duplicate Question"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <button 
                    type="button"
                    onClick={() => handleAddQuestion(sectionName)}
                    className="w-full mt-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Question to {sectionName}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          type="button"
          onClick={handleAddSection}
          className="w-full mt-6 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-xs cursor-pointer"
        >
          <LayoutList className="w-5 h-5 text-blue-600" /> 
          Add New Section
        </button>
      </div>
    </div>
  );
}
