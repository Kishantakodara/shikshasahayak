// ============================================================
// STUDENT AI STUDY ASSISTANT DRAWER
// Socratic hints, wrong-answer misconception diagnosis, and derivations.
// ============================================================

import React, { useState } from 'react';
import { Lightbulb, Sparkles, AlertCircle, BookOpen, ChevronRight, X, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

interface AIStudyAssistantDrawerProps {
  questionId: string;
  isOpen: boolean;
  onClose: () => void;
  selectedWrongOption?: string;
  isPracticeMode?: boolean;
}

export const AIStudyAssistantDrawer: React.FC<AIStudyAssistantDrawerProps> = ({
  questionId,
  isOpen,
  onClose,
  selectedWrongOption,
  isPracticeMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<'HINT' | 'DIAGNOSE' | 'EXPLAIN'>('HINT');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [cached, setCached] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssistance = async (type: 'HINT' | 'DIAGNOSE' | 'EXPLAIN') => {
    setActiveTab(type);
    setLoading(true);
    setError(null);

    const endpoint =
      type === 'HINT'
        ? '/api/student/study-assistant/hint'
        : type === 'DIAGNOSE'
        ? '/api/student/study-assistant/diagnose'
        : '/api/student/study-assistant/explain';

    const payload: any = { questionId };
    if (type === 'DIAGNOSE' && selectedWrongOption) {
      payload.selectedOption = selectedWrongOption;
    }

    try {
      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as any;
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch AI assistance');
      }

      setContent(data.markdownContent || '');
      setCached(Boolean(data.cached));
    } catch (err: any) {
      setError(err.message || 'AI Assistant is currently unavailable');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && questionId) {
      if (selectedWrongOption) {
        fetchAssistance('DIAGNOSE');
      } else {
        fetchAssistance('HINT');
      }
    }
  }, [isOpen, questionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Study Assistant</h3>
              <p className="text-xs text-slate-400">Socratic guidance & Concept mastery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
          <button
            onClick={() => fetchAssistance('HINT')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'HINT'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Socratic Hint</span>
          </button>
          {selectedWrongOption && (
            <button
              onClick={() => fetchAssistance('DIAGNOSE')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'DIAGNOSE'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Why Option {selectedWrongOption}?</span>
            </button>
          )}
          {isPracticeMode && (
            <button
              onClick={() => fetchAssistance('EXPLAIN')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'EXPLAIN'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Derivation</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <p className="text-xs text-slate-400">Synthesizing pedagogical guidance...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </div>

              {cached && (
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Edge Cached (Instant response, zero compute latency)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-center">
          <p className="text-[11px] text-slate-500">
            Powered by ShikshaSahayak Question Intelligence AI Engine
          </p>
        </div>
      </div>
    </div>
  );
};
