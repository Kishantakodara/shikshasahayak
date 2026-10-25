import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Sparkles, 
  Calculator, 
  BookOpen, 
  X,
  Code
} from 'lucide-react';
import { getAllPyqQuestions } from '../../config/pyqQuestionBank';
import { QuestionRenderer } from '../quiz/question-renderer';
import { Question } from '../../types';

export function AdminPyqManager() {
  const [questions, setQuestions] = useState<Question[]>(getAllPyqQuestions());
  const [jsonInput, setJsonInput] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(questions[0] || null);

  const handleBulkUpload = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      setQuestions(prev => [...items, ...prev]);
      setUploadStatus(`Successfully imported ${items.length} PYQ question(s)!`);
      setJsonInput('');
      setTimeout(() => setShowUploadModal(false), 1500);
    } catch (err: any) {
      setUploadStatus(`Invalid JSON syntax: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-left p-2 sm:p-4 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            LMS PYQ Bank & Bulk Ingestion Manager
            <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
              Admin Tool
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage Numerical (NAT), Analytical, Theoretical, and Reasoning questions for GTU & GATE.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Bulk Import PYQs</span>
        </button>
      </div>

      {/* Main Grid: List on Left, Live Question Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: PYQ Catalog */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ingested Questions ({questions.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">GTU & GATE Seeds Active</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                onClick={() => setPreviewQuestion(q)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  previewQuestion?.id === q.id
                    ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded-full font-mono uppercase">
                    {q.examSource || 'GTU'} {q.examYear || ''} • {q.questionCategory || q.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Marks: {q.marks}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                  {q.questionText}
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Student Question Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Live Question & Solution Preview</span>
          </h3>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg space-y-4">
            {previewQuestion ? (
              <QuestionRenderer
                question={previewQuestion}
                selectedAnswer={previewQuestion.correctAnswer}
                onChange={() => {}}
                showFeedback={true}
                isCorrect={true}
              />
            ) : (
              <p className="text-xs text-slate-400">Select a question from the left catalog to preview.</p>
            )}
          </div>
        </div>

      </div>

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileJson className="h-5 w-5 text-purple-500" />
                <span>Bulk Import PYQs (JSON Format)</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Paste JSON array containing question definitions (MCQ, MSQ, NAT, Assertion-Reason) to bulk ingest into the ShikshaSahayak database.
            </p>

            <textarea
              rows={10}
              placeholder={`[\n  {\n    "id": "pyq-custom-001",\n    "type": "NAT",\n    "questionText": "Compute integral...",\n    "questionCategory": "numerical",\n    "correctAnswer": "5.5",\n    "marks": 2\n  }\n]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
            />

            {uploadStatus && (
              <p className={`text-xs font-semibold ${uploadStatus.includes('Successfully') ? 'text-emerald-600' : 'text-red-500'}`}>
                {uploadStatus}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
