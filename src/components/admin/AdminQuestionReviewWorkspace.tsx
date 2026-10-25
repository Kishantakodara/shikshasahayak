import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  Trash2,
  Copy,
  Award,
  Sparkles,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

interface Props {
  questionId: string;
  onBack: () => void;
}

export function AdminQuestionReviewWorkspace({ questionId, onBack }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([]);
  const [correctAnswer, setCorrectAnswer] = useState<any>('');
  const [isOriginalPyq, setIsOriginalPyq] = useState(true);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [questionId]);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/questions/${questionId}`);
      const json = await res.json();
      if (json.success) {
        const q = json.question;
        setData(q);
        setQuestionText(q.question_text || '');
        setQuestionType(q.question_type || 'MCQ');
        setSubjectCode(q.subject_code || '');
        setSubjectName(q.subject_name || '');
        setTopicName(q.topic_name || '');
        setDifficulty(q.difficulty || 'medium');
        setExplanation(q.explanation || '');
        setIsOriginalPyq(Boolean(q.is_original_pyq));
        setIsAiGenerated(Boolean(q.is_ai_generated));

        if (q.options_json) {
          try {
            const parsed = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json;
            setOptions(Array.isArray(parsed) ? parsed : []);
          } catch {
            setOptions([]);
          }
        }

        let cleanAns = q.correct_answer_json || '';
        try {
          const parsedAns = typeof cleanAns === 'string' && (cleanAns.startsWith('{') || cleanAns.startsWith('[')) ? JSON.parse(cleanAns) : cleanAns;
          cleanAns = String(parsedAns).replace(/^"|"$/g, '');
        } catch {
          cleanAns = String(cleanAns).replace(/^"|"$/g, '');
        }
        setCorrectAnswer(cleanAns);
      } else {
        setError(json.error || 'Failed to load question details');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/admin/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          questionType,
          subjectCode,
          subjectName,
          semester: data?.semester || 1,
          topicName,
          difficulty,
          options,
          correctAnswer,
          explanation,
          isOriginalPyq,
          isAiGenerated,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Question changes saved successfully!');
        loadDetail();
      } else {
        alert(`Save failed: ${json.error}`);
      }
    } catch {
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve and publish this question to the master question bank?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/questions/${questionId}/approve`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Question approved and published!');
        onBack();
      } else {
        alert(`Approval failed: ${json.error}`);
      }
    } catch {
      alert('Approval failed');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const res = await fetchWithAuth(`/api/admin/questions/${questionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Question rejected');
        onBack();
      }
    } catch {
      alert('Rejection failed');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Question Workspace...</div>;
  }

  if (error || !data) {
    return <div className="p-6 bg-red-950 text-red-300 rounded-xl">{error || 'Question not found'}</div>;
  }

  const valReport = data.validationReport || { isValid: true, errors: [] };
  const duplicates = data.duplicateCandidates || [];

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back to Ingestion Queue
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <XCircle className="w-4 h-4 text-red-400" /> Reject
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-orange-400" /> Save Changes
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve & Publish
          </button>
        </div>
      </div>

      {/* 3-Column Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Metadata Editor */}
        <div className="lg:col-span-3 space-y-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
            Metadata & Provenance
          </h3>

          <div>
            <label className="text-xs text-slate-400">Question ID</label>
            <input type="text" disabled value={data.id} className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 rounded" />
          </div>

          <div>
            <label className="text-xs text-slate-400">Subject Code & Name</label>
            <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded" />
            <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded" />
          </div>

          <div>
            <label className="text-xs text-slate-400">Topic Name</label>
            <input type="text" value={topicName} onChange={e => setTopicName(e.target.value)} className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded" />
          </div>

          <div>
            <label className="text-xs text-slate-400">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300">Provenance Invariants</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isOriginalPyq} onChange={e => { setIsOriginalPyq(e.target.checked); if (e.target.checked) setIsAiGenerated(false); }} />
              <span className="text-xs text-amber-300 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-400" /> Original PYQ</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isAiGenerated} onChange={e => { setIsAiGenerated(e.target.checked); if (e.target.checked) setIsOriginalPyq(false); }} />
              <span className="text-xs text-purple-300 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Generated</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Content & Options Editor */}
        <div className="lg:col-span-6 space-y-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
            Question Content & Options
          </h3>

          <div>
            <label className="text-xs text-slate-400">Question Statement (Markdown / LaTeX)</label>
            <textarea
              rows={4}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-950 border border-slate-800 rounded text-sm font-mono text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* MCQ / MSQ Options Editor */}
          {questionType !== 'NAT' && (
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Options ({options.length})</label>
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-slate-400 text-center">{opt.id}</span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx].text = e.target.value;
                      setOptions(newOpts);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded"
                  />
                  <input
                    type="radio"
                    name="correctRadio"
                    checked={correctAnswer === opt.id}
                    onChange={() => setCorrectAnswer(opt.id)}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400">Explanation & Pedagogical Steps</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Quality Control & Duplicate Risks */}
        <div className="lg:col-span-3 space-y-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
            Quality & Technical Check
          </h3>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Technical Validator</div>
            {valReport.isValid ? (
              <div className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> All checks passed</div>
            ) : (
              <div className="text-xs text-red-400 space-y-1">
                {valReport.errors.map((err: string, i: number) => (
                  <div key={i} className="flex items-start gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {err}</div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Duplicate Risk Analysis</div>
            {duplicates.length === 0 ? (
              <div className="text-xs text-slate-400">No near-duplicates detected.</div>
            ) : (
              <div className="space-y-2">
                {duplicates.map((d: any) => (
                  <div key={d.questionId} className="p-2 bg-slate-900 rounded border border-amber-900/40 text-xs">
                    <div className="text-amber-400 font-bold">Match Score: {(d.similarity * 100).toFixed(0)}%</div>
                    <div className="text-slate-300 line-clamp-2 mt-1">{d.questionText}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
