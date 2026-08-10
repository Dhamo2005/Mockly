import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Upload, FileJson, Download, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Test, Question } from '../types';

export default function QuestionBank() {
  const { tests, importTests, deleteTest } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    const data = JSON.parse(content);
    // Basic validation
    if (Array.isArray(data) && data[0]?.title && Array.isArray(data[0]?.questions)) {
      const newTests = data.map(test => ({
        ...test,
        id: test.id || uuidv4(),
        questions: test.questions.map((q: any) => ({
          ...q,
          id: q.id || uuidv4()
        }))
      }));
      importTests(newTests);
      setStatus({ type: 'success', message: `Successfully imported ${newTests.length} tests.` });
    } else {
      throw new Error('Invalid JSON format. Expected an array of Test objects.');
    }
  };

  const exportTemplateJSON = () => {
    const link = document.createElement("a");
    link.href = "/ssc-cgl-18sep2025.json";
    link.download = "ssc-cgl-18sep2025.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div>
        <h2 className="text-base font-bold text-gray-900">Question Bank Management</h2>
        <p className="text-gray-600 mt-1">Import new tests or manage existing ones.</p>
      </div>

      {status.type && (
        <div className={`p-3 rounded-lg flex items-start gap-3 border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
          <div>
            <h4 className="font-semibold">{status.type === 'success' ? 'Success' : 'Error'}</h4>
            <p className="text-sm mt-1">{status.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Import Tests</h3>
          <p className="text-gray-500 text-sm mb-3">
            Upload custom question banks in JSON format. Multi-language (English/Hindi) is supported out of the box.
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".json" 
            className="hidden" 
          />
          
          <div className="flex gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FileJson className="h-4 w-4" /> Upload File
            </button>
          </div>
        </div>

                <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3">
            <Download className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-on-surface)] mb-2">JSON Format Guide</h3>
          <p className="text-[var(--color-on-surface-variant)] text-sm mb-3">
            Our JSON format supports rich mathematical expressions (LaTeX) and multiple languages natively.
          </p>
          <ul className="text-sm text-[var(--color-on-surface-variant)] list-disc pl-5 space-y-2 mb-3">
            <li><strong>Math/LaTeX:</strong> Wrap your LaTeX formulas with <code>$</code> for inline equations (e.g., <code>{"$\\frac{1}{2}$"}</code>) or <code>$$</code> for block equations.</li>
            <li><strong>Multiple Languages:</strong> The <code>text</code> fields are objects mapping language codes to strings: <code>{"{\"en\": \"Question in English\", \"hi\": \"हिंदी में प्रश्न\"}"}</code>.</li>
            <li><strong>Markdown:</strong> Basic Markdown styling (bold, italics, code) is supported in questions and options.</li>
          </ul>
          <button 
             onClick={exportTemplateJSON}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-outline)] hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FileJson className="h-4 w-4" /> Download JSON Template
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Existing Test Banks</h3>
        <div className="divide-y divide-gray-100">
          {tests.map((test, index) => (
            <div key={`${test.id}-${index}`} className="py-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">{test.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{test.questions.length} questions • {test.sections.length} sections</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Available</span>
                <button 
                  onClick={() => deleteTest(test.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Test"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {tests.length === 0 && (
             <p className="text-sm text-gray-500 py-4">No tests available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
