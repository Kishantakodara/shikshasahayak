// ============================================================
// SHIKSHA SAHAYAK OS - AI QUIZ GENERATOR MODAL COMPONENT
// ============================================================

import React, { useState } from "react";
import { AIQuizDraftSpec } from "../../types/ai-intelligence";
import { generateAIQuizDraft } from "../../api/aiIntelligenceClient";
import { BrainCircuit, Sparkles, CheckCircle, XCircle, X, Send } from "lucide-react";

interface AIQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export const AIQuizGeneratorModal: React.FC<AIQuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectId = "os",
}) => {
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [topicName, setTopicName] = useState("");
  const [questionCount, setQuestionCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<AIQuizDraftSpec | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName) return;
    setLoading(true);
    const result = await generateAIQuizDraft(subjectId, topicName, questionCount);
    setDraft(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B132B] border border-slate-700/60 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Quiz Draft Generator</h2>
            <p className="text-xs text-slate-400">Generated questions require admin/teacher review before publishing</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Subject ID</label>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              placeholder="e.g. os, cn, dbms"
              className="w-full bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Topic / Concept *</label>
            <input
              type="text"
              required
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g. CPU Scheduling Algorithms"
              className="w-full bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Questions</label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]"
            >
              <option value={2}>2 Questions</option>
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Generating Draft..." : "Generate AI Quiz Draft"}
            </button>
          </div>
        </form>

        {draft && (
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Generated Questions — Requires Review</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase font-bold">Draft</span>
            </div>
            <p className="text-xs text-slate-500 italic">⚠️ AI-generated content must be reviewed and approved before publishing to students.</p>
            <div className="space-y-4">
              {draft.questions.map((q, idx) => (
                <div key={idx} className="bg-[#1C2541]/70 border border-slate-700/60 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">Q{idx + 1}. {q.questionText}</p>
                  <ul className="space-y-1.5">
                    {q.options.map((opt, oIdx) => (
                      <li
                        key={oIdx}
                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                          oIdx === q.correctOptionIndex
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800/40 border-slate-700 text-slate-300"
                        }`}
                      >
                        {oIdx === q.correctOptionIndex
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                        {opt}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800">
                      <span className="font-bold text-slate-300">Explanation: </span>{q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
