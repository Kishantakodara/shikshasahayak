// ============================================================
// ADMIN CONTENT OPERATIONS & COVERAGE HUB
// Comprehensive GTU subject coverage matrix, batch ingestion, and triage.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  FileText,
  Clock,
  Loader2,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export const AdminContentOperationsHub: React.FC = () => {
  const [coverageData, setCoverageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [ingesting, setIngesting] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  useEffect(() => {
    fetchCoverage();
  }, []);

  const fetchCoverage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/content-operations/coverage');
      const data = await res.json() as any;
      if (res.ok && data.success) {
        setCoverageData(data);
      } else {
        setError(data.error || 'Failed to fetch content coverage matrix');
      }
    } catch {
      setError('Network error fetching coverage summary');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBatchIngestion = async (subjectCodes: string[]) => {
    setIngesting(true);
    setBatchResult(null);
    try {
      const res = await fetchWithAuth('/api/admin/content-operations/batch-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetSubjectCodes: subjectCodes,
          examYears: [2024, 2023],
          examSessions: ['WINTER', 'SUMMER'],
        }),
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        setBatchResult(data);
        fetchCoverage(); // Refresh
      } else {
        alert(`Batch ingestion error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  };

  const subjects = coverageData?.subjects || [];
  const filteredSubjects = subjects.filter((s: any) => {
    const matchesSearch =
      s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subjectCode.includes(searchQuery);
    const matchesStatus = filterStatus === 'ALL' || s.coverageStatus === filterStatus;
    const matchesSem = selectedSemester === 'ALL' || String(s.semester) === selectedSemester;
    return matchesSearch && matchesStatus && matchesSem;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-orange-500" />
            <span>GTU Content Operations & Ingestion Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit live subject coverage across 8 Semesters & 13 Phase-1 Engineering Streams
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoverage}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleTriggerBatchIngestion(['3110014', '3110015', '3150710', '3150702'])}
            disabled={ingesting}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
          >
            {ingesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ingesting Core Batch...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Ingest Core GTU Batch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      {coverageData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Catalog Subjects</span>
            <span className="text-2xl font-bold text-white">{coverageData.totalCatalogSubjects}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-emerald-400 block mb-1">Full Coverage</span>
            <span className="text-2xl font-bold text-emerald-400">{coverageData.fullCoverageSubjects}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-amber-400 block mb-1">Partial Coverage</span>
            <span className="text-2xl font-bold text-amber-400">{coverageData.partialCoverageSubjects}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Empty Catalog</span>
            <span className="text-2xl font-bold text-slate-400">{coverageData.emptySubjects}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-orange-400 block mb-1">Live Verified Questions</span>
            <span className="text-2xl font-bold text-orange-400">{coverageData.totalLiveQuestions}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subject code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="FULL">FULL</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="EMPTY">EMPTY</option>
            <option value="NEEDS_REVIEW">NEEDS REVIEW</option>
          </select>
        </div>
      </div>

      {/* Coverage Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Subject Code</th>
                <th className="px-4 py-3">Subject Name</th>
                <th className="px-4 py-3">Sem</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Live Questions</th>
                <th className="px-4 py-3">MCQ / MSQ / NAT</th>
                <th className="px-4 py-3">Discovered Papers</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSubjects.map((s: any) => (
                <tr key={s.subjectCode} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{s.subjectCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{s.subjectName}</td>
                  <td className="px-4 py-3">Sem {s.semester}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.coverageStatus === 'FULL'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : s.coverageStatus === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s.coverageStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{s.liveQuestionCount}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {s.mcqCount} / {s.msqCount} / {s.natCount}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{s.papersDiscovered} papers</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleTriggerBatchIngestion([s.subjectCode])}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-300 text-[11px] font-medium transition-colors"
                    >
                      Ingest Subject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
