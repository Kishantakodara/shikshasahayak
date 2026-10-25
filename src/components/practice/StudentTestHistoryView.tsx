import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Award, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { TestHistoryItem, TestResultDTO } from '../../types';
import { PortalReturnBar } from '../navigation/PortalReturnBar';

import { fetchWithAuth } from '../../api/client';

interface StudentTestHistoryViewProps {
  onBackToDashboard?: () => void;
  onSelectSessionResult?: (result: TestResultDTO) => void;
}

export const StudentTestHistoryView: React.FC<StudentTestHistoryViewProps> = ({
  onBackToDashboard,
  onSelectSessionResult,
}) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState('ALL');

  useEffect(() => {
    fetchHistory();
  }, [filterSource]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterSource !== 'ALL'
        ? `/api/student/tests/history?sourceMode=${filterSource}`
        : `/api/student/tests/history`;
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        setError('Failed to load test history. Please try again.');
        return;
      }
      const data = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      } else {
        setHistory([]);
      }
    } catch {
      setError('Could not connect to the server. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      navigate('/student/test-dashboard');
    }
  };

  const handleViewResult = async (sessionId: string) => {
    try {
      const res = await fetchWithAuth(`/api/student/tests/${sessionId}/result`);
      const data = await res.json();
      if (data.success && data.result) {
        if (onSelectSessionResult) {
          onSelectSessionResult(data.result);
        } else {
          navigate(`/student/test/${sessionId}/result`);
        }
      } else {
        navigate(`/student/test/${sessionId}/result`);
      }
    } catch {
      navigate(`/student/test/${sessionId}/result`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'GATE Practice', path: '/student/test-dashboard' },
          { label: 'Test History & Reviews' }
        ]}
        fallbackPath="/student/test-dashboard"
      />

      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Practice Dashboard</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-orange-400" />
            <span>My Test History &amp; Results</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Review past examination sessions and detailed solutions.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'GTU_PYQ', 'GATE_PYQ', 'PRACTICE'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterSource(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterSource === mode
                  ? 'bg-orange-500/20 text-orange-500 border-orange-500'
                  : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl space-y-3">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg text-xs font-semibold hover:bg-orange-500/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl space-y-4">
          <div className="p-4 bg-orange-500/10 rounded-2xl">
            <History className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No Test Sessions Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You haven't completed any tests yet.
              {filterSource !== 'ALL' && ` Try switching the filter to "ALL".`}
            </p>
          </div>
          <button
            onClick={() => navigate('/student/test-dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            Start a Practice Test
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              onClick={() => handleViewResult(item.id)}
              className="bg-card hover:bg-muted/40 border border-border hover:border-orange-500/40 rounded-xl p-4 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground">{item.testType}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                      {item.sourceMode}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'In Progress'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.questionCount} Questions • {item.durationMinutes} Minutes • Status:{' '}
                    <span className="text-foreground font-semibold">{item.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 self-end md:self-auto">
                <div className="text-right">
                  <div className="text-base font-bold text-foreground">{item.obtainedMarks} / {item.totalMarks}</div>
                  <div className={`text-xs font-semibold ${item.accuracyPercentage >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.accuracyPercentage}% Accuracy
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
