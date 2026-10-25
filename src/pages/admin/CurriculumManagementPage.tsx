import React, { useState, useEffect } from 'react';
import { 
  Building2, ScrollText, GitBranch, Calendar, BookOpen, Upload, History, 
  FileCheck, ShieldAlert, Network, FileText, CheckCircle2, AlertCircle, 
  Trash2, RefreshCw, Download, Play, Plus, Eye, Sparkles, Layers, Search
} from 'lucide-react';

export const CurriculumManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'universities' | 'regulations' | 'branches' | 'semesters' | 'subjects' | 
    'upload' | 'history' | 'logs' | 'validation' | 'mapping' | 'syllabus'
  >('upload');

  const [stats, setStats] = useState<any>({
    totalUniversities: 0,
    totalBranches: 0,
    totalSubjects: 0,
    totalSyllabi: 0
  });

  const [historyVersions, setHistoryVersions] = useState<any[]>([]);
  const [importLogs, setImportLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/cms/history');
      const data = await res.json() as any;
      if (data.success) {
        setHistoryVersions(data.versions || []);
        setImportLogs(data.logs || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Error fetching CMS history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setValidationReport(null);
      setImportResult(null);
    }
  };

  const handleValidateWorkbook = async () => {
    if (!selectedFile) return;
    setValidating(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/v1/admin/cms/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json() as any;
      if (data.success) {
        setValidationReport(data.validationReport);
      }
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!validationReport || !validationReport.parsedData) return;
    setImporting(true);
    try {
      const res = await fetch('/api/v1/admin/cms/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedData: validationReport.parsedData,
          filename: selectedFile?.name || 'curriculum.xlsx',
          uploadedBy: 'Super Admin'
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setImportResult(data.summary);
        fetchHistory();
      }
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!confirm('Are you sure you want to activate this curriculum version?')) return;
    try {
      const res = await fetch('/api/v1/admin/cms/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, action: 'rollback' })
      });
      const data = await res.json() as any;
      if (data.success) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Rollback error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-navy-950 via-navy-900 to-blue-950 text-white p-6 rounded-2xl shadow-xl border border-navy-800">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Enterprise Master CMS
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Curriculum Management System</h1>
          <p className="text-blue-200 text-sm mt-1">
            Upload university workbooks to automatically generate branches, semesters, subjects, syllabus links, and AI memory.
          </p>
        </div>

        {/* Global Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-navy-900/90 p-3 rounded-xl border border-navy-700 shrink-0">
          <div className="text-center px-3">
            <div className="text-xs text-gray-400">Universities</div>
            <div className="text-lg font-black text-brand-orange">{stats.totalUniversities}</div>
          </div>
          <div className="text-center px-3 border-l border-navy-700">
            <div className="text-xs text-gray-400">Branches</div>
            <div className="text-lg font-black text-blue-400">{stats.totalBranches}</div>
          </div>
          <div className="text-center px-3 border-l border-navy-700">
            <div className="text-xs text-gray-400">Subjects</div>
            <div className="text-lg font-black text-green-400">{stats.totalSubjects}</div>
          </div>
          <div className="text-center px-3 border-l border-navy-700">
            <div className="text-xs text-gray-400">Syllabi</div>
            <div className="text-lg font-black text-purple-400">{stats.totalSyllabi}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (11 Sub-Modules) */}
      <div className="flex overflow-x-auto gap-2 p-2 bg-gray-100 dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-navy-800 scrollbar-none">
        {[
          { id: 'upload', label: 'Curriculum Upload', icon: Upload },
          { id: 'history', label: 'Curriculum History', icon: History },
          { id: 'validation', label: 'Validation Reports', icon: FileCheck },
          { id: 'logs', label: 'Import Logs', icon: ShieldAlert },
          { id: 'universities', label: 'Universities', icon: Building2 },
          { id: 'regulations', label: 'Regulations', icon: ScrollText },
          { id: 'branches', label: 'Branches', icon: GitBranch },
          { id: 'semesters', label: 'Semesters', icon: Calendar },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'mapping', label: 'Subject Mapping', icon: Network },
          { id: 'syllabus', label: 'Syllabus Manager', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CURRICULUM UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-800 p-8 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Upload className="w-8 h-8 text-brand-orange bg-orange-50 dark:bg-navy-900 p-1.5 rounded-xl" />
              <div>
                <h2 className="text-lg font-bold text-navy-900 dark:text-white">Upload University Workbook</h2>
                <p className="text-xs text-gray-500">Supports .xlsx, .xls, .csv workbooks with multi-sheet branch structures.</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-navy-600 p-8 rounded-2xl text-center space-y-4 hover:border-brand-orange transition">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="curriculum-file-input"
              />
              <label htmlFor="curriculum-file-input" className="cursor-pointer space-y-2 block">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                <div className="text-sm font-bold text-navy-900 dark:text-white">
                  {selectedFile ? selectedFile.name : 'Click or Drag & Drop University Workbook (.xlsx / .csv)'}
                </div>
                <p className="text-xs text-gray-400">Automatic sheet parsing, structure validation, and D1 database normalization.</p>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleValidateWorkbook}
                disabled={!selectedFile || validating}
                className="px-6 py-3 bg-navy-900 dark:bg-navy-700 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" /> {validating ? 'Validating Workbook...' : 'Validate Structure'}
              </button>

              {validationReport && validationReport.isValid && (
                <button
                  onClick={handleCommitImport}
                  disabled={importing}
                  className="px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" /> {importing ? 'Importing into D1...' : 'Commit & Import Curriculum'}
                </button>
              )}
            </div>
          </div>

          {/* Validation Preview Card */}
          {validationReport && (
            <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-brand-orange" /> Pre-Import Validation Report
                </h3>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  validationReport.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {validationReport.isValid ? 'VALID WORKBOOK' : 'VALIDATION ISSUES DETECTED'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl text-xs">
                  <div className="text-gray-400">Total Rows</div>
                  <div className="text-lg font-bold text-navy-900 dark:text-white">{validationReport.totalRowsProcessed}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl text-xs">
                  <div className="text-gray-400">Branches Detected</div>
                  <div className="text-lg font-bold text-blue-500">{validationReport.totalBranchesFound}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl text-xs">
                  <div className="text-gray-400">Subjects Found</div>
                  <div className="text-lg font-bold text-green-500">{validationReport.totalSubjectsFound}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl text-xs">
                  <div className="text-gray-400">Errors / Warnings</div>
                  <div className="text-lg font-bold text-amber-500">{validationReport.errorCount} / {validationReport.warningCount}</div>
                </div>
              </div>

              {/* Sample Rows Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-navy-900 text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Branch</th>
                      <th className="p-2.5">Sem</th>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Subject Name</th>
                      <th className="p-2.5">Credits</th>
                      <th className="p-2.5">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-navy-700">
                    {validationReport.parsedData.slice(0, 8).map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold">{row.branchCode}</td>
                        <td className="p-2.5">Sem {row.semester}</td>
                        <td className="p-2.5 font-mono text-brand-orange">{row.subjectCode}</td>
                        <td className="p-2.5">{row.subjectName}</td>
                        <td className="p-2.5">{row.credits}</td>
                        <td className="p-2.5">{row.subjectType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div className="p-6 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-2xl text-xs space-y-2 text-green-900 dark:text-green-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" /> Curriculum Import Successful!
              </div>
              <p>Created {importResult.branchesCreated} branches, {importResult.subjectsCreated} subjects, and linked {importResult.syllabiLinked} syllabus documents into Cloudflare D1.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURRICULUM HISTORY & ROLLBACK */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-orange" /> Curriculum Version History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-navy-900 text-gray-500 uppercase font-bold">
                <tr>
                  <th className="p-3">Version</th>
                  <th className="p-3">University</th>
                  <th className="p-3">Workbook</th>
                  <th className="p-3">Branches</th>
                  <th className="p-3">Subjects</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Uploaded At</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-700 font-medium">
                {historyVersions.map(ver => (
                  <tr key={ver.id}>
                    <td className="p-3 font-bold text-brand-orange">v{ver.version_number}</td>
                    <td className="p-3">{ver.university_name || 'GTU'}</td>
                    <td className="p-3">{ver.filename}</td>
                    <td className="p-3">{ver.total_branches}</td>
                    <td className="p-3">{ver.total_subjects}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        ver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ver.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{new Date(ver.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      {ver.status !== 'active' && (
                        <button
                          onClick={() => handleRollback(ver.id)}
                          className="px-3 py-1 bg-navy-900 text-white rounded-lg text-[10px] font-bold hover:bg-black"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: IMPORT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-orange" /> Import Audit Logs
          </h2>

          <div className="space-y-2">
            {importLogs.map(log => (
              <div key={log.id} className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-brand-orange font-bold">[{log.level.toUpperCase()}]</span> {log.message}
                </div>
                <span className="text-gray-400 text-[10px]">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OTHER SUB-TABS (Placeholder Summary for Management Views) */}
      {['universities', 'regulations', 'branches', 'semesters', 'subjects', 'validation', 'mapping', 'syllabus'].includes(activeTab) && (
        <div className="bg-white dark:bg-navy-800 p-8 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm text-center space-y-3">
          <BookOpen className="w-10 h-10 text-brand-orange mx-auto" />
          <h3 className="text-lg font-bold text-navy-900 dark:text-white capitalize">{activeTab} Manager</h3>
          <p className="text-xs text-gray-500">
            Structure and offerings are automatically managed via the Master Curriculum Upload engine.
          </p>
        </div>
      )}
    </div>
  );
};

export default CurriculumManagementPage;
