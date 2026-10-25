import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface ReportQuestionModalProps {
  questionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportQuestionModal({ questionId, isOpen, onClose }: ReportQuestionModalProps) {
  const [reportType, setReportType] = useState<string>('WRONG_ANSWER');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/student/questions/${questionId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit report.');
      }
    } catch {
      setError('Network error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-100">Report Submitted</h3>
            <p className="text-xs text-slate-300">
              Thanks! Your report has been sent to the ShikshaSahayak quality team for investigation.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-base border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" /> Report Question Issue
            </div>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason for Report</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="WRONG_ANSWER">Wrong Answer or Option</option>
                <option value="AMBIGUOUS">Ambiguous Question Statement</option>
                <option value="TYPO">Spelling or Typo Error</option>
                <option value="BROKEN_LATEX">Broken Math / Formula Formatting</option>
                <option value="INCORRECT_EXPLANATION">Incorrect Solution Explanation</option>
                <option value="DUPLICATE">Duplicate Question</option>
                <option value="OUT_OF_SYLLABUS">Out of Syllabus</option>
                <option value="TECHNICAL_ERROR">Technical Issue</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Additional Details (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain what is incorrect or broken about this question..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
