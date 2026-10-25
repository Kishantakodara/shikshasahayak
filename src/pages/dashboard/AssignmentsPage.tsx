import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Check, 
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  FileText
} from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import { apiClient } from '../../api/client';

interface AssignmentItem {
  id: string;
  title: string;
  subjectName: string;
  subjectCode?: string | null;
  className?: string | null;
  totalMarks: number;
  dueDate: string | null;
  status: 'OPEN' | 'SUBMITTED' | 'COMPLETED' | 'LATE' | 'UPCOMING';
  description?: string | null;
  instructions?: string | null;
  allowLateSubmission?: boolean;
  submission?: {
    id: string;
    status: string;
    obtainedMarks?: number | null;
    feedback?: string | null;
    submittedAt: string;
    isLate?: boolean;
  } | null;
}

export const AssignmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getStudentAssignments();
      if (res?.success && Array.isArray(res.assignments)) {
        setAssignments(res.assignments);
      } else {
        setAssignments([]);
      }
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
      setError(err?.message || 'Failed to connect to assignments service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const pendingList = assignments.filter((a) => a.status === 'OPEN' || a.status === 'LATE' || a.status === 'UPCOMING');
  const completedList = assignments.filter((a) => a.status === 'SUBMITTED' || a.status === 'COMPLETED');

  const handleUploadSubmit = async () => {
    if (!selectedAssignment) return;
    if (!submissionText.trim() && !submissionLink.trim()) {
      alert('Please provide your solution notes or submission link.');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccessMsg(null);
    try {
      const payload: { textContent?: string; externalLinks?: string[] } = {};
      if (submissionText.trim()) payload.textContent = submissionText.trim();
      if (submissionLink.trim()) payload.externalLinks = [submissionLink.trim()];

      const res = await apiClient.submitStudentAssignment(selectedAssignment.id, payload);
      setSubmitSuccessMsg(res?.message || 'Assignment submitted successfully!');
      
      setTimeout(() => {
        setShowSubmitModal(false);
        setSelectedAssignment(null);
        setSubmissionText('');
        setSubmissionLink('');
        setSubmitSuccessMsg(null);
        fetchAssignments();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BrowseShell
      crumbs={[{ label: 'Assignments' }]}
      eyebrow="Academic Submissions"
      title="Coursework & Assignments"
      description="Track departmental lab reports, weekly problem sets, and faculty submissions with real verification receipts."
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'pending'
              ? 'bg-[#F97316] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pending Tasks ({pendingList.length})
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'submitted'
              ? 'bg-[#F97316] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Completed Submissions ({completedList.length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-8 text-center bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading verified student assignments...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-300">{error}</span>
          </div>
          <button
            onClick={fetchAssignments}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Assignment List */}
      {!loading && (
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs mb-8">
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {(activeTab === 'pending' ? pendingList : completedList).length === 0 ? (
              <div className="p-10 text-center text-[#64748B] space-y-2">
                <ClipboardList className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  {activeTab === 'pending' ? "You're all caught up!" : "No completed submissions yet."}
                </h4>
                <p className="text-xs">
                  {activeTab === 'pending'
                    ? "No pending coursework or lab reports due for your semester."
                    : "Submitted assignments and verified teacher grading will appear here."}
                </p>
              </div>
            ) : (
              (activeTab === 'pending' ? pendingList : completedList).map((item) => (
                <div
                  key={item.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-[#F97316]">
                        {item.subjectName}
                      </span>
                      {item.className && <span className="text-[11px] text-[#64748B]">• {item.className}</span>}
                      {item.status === 'LATE' && (
                        <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-extrabold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Late Submission Allowed
                        </span>
                      )}
                      {item.status === 'COMPLETED' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Graded ({item.submission?.obtainedMarks ?? item.totalMarks} / {item.totalMarks})
                        </span>
                      )}
                      {item.status === 'SUBMITTED' && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Submitted — Under Evaluation
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
                      {item.description || item.instructions || 'Review the practical experiment details and submit your lab report before the deadline.'}
                    </p>

                    {item.submission?.feedback && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs">
                        <span className="font-bold text-[#0F172A] dark:text-white">Faculty Feedback: </span>
                        <span className="text-slate-600 dark:text-slate-300">{item.submission.feedback}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-start md:self-auto shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#0F172A] dark:text-white block">
                        {item.dueDate ? `Due: ${item.dueDate.split('T')[0]}` : 'Flexible Due Date'}
                      </span>
                      <span className="text-[11px] text-[#64748B]">{item.totalMarks} Marks</span>
                    </div>

                    {item.status !== 'SUBMITTED' && item.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => {
                          setSelectedAssignment(item);
                          setShowSubmitModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit Work</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500">
                        {item.status === 'COMPLETED' ? 'Checked' : 'Submitted'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#F97316] tracking-wider">Submit Assignment</span>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white mt-0.5">
                {selectedAssignment.title}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Subject: {selectedAssignment.subjectName} • Total: {selectedAssignment.totalMarks} Marks
              </p>
            </div>

            {submitSuccessMsg ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{submitSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] dark:text-white block mb-1">
                      Assignment Notes / Written Answer
                    </label>
                    <textarea
                      rows={3}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Type your answer, observations, or summary of experimental readings here..."
                      className="w-full text-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-[#0F172A] dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#F97316]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0F172A] dark:text-white block mb-1">
                      Google Drive / Cloudflare R2 Document Link
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900">
                      <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="url"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://drive.google.com/... or public PDF link"
                        className="w-full text-xs bg-transparent text-[#0F172A] dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    disabled={isSubmitting}
                    onClick={() => setShowSubmitModal(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleUploadSubmit}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isSubmitting ? 'Submitting...' : 'Confirm Submission'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </BrowseShell>
  );
};

export default AssignmentsPage;
