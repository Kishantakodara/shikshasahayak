// ============================================================
// SHIKSHA SAHAYAK OS - ADMIN ACADEMIC SUBJECT MASTER COMPONENT
// CSV Upload, Validation, Preview, Upsert, History, & Subject Table
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Upload, Download, RefreshCw, CheckCircle2, 
  AlertTriangle, XCircle, Search, Filter, History, Eye, ShieldAlert,
  ArrowRight, Sparkles, BookOpen, Layers, ExternalLink, HelpCircle
} from 'lucide-react';
import { 
  adminSubjectMasterClient, 
  SubjectMasterAdminRecord, 
  ImportHistoryRecord 
} from '../../api/adminSubjectMasterClient';
import { CsvParseResult } from '../../utils/csvSubjectMasterParser';

export const AcademicSubjectMasterPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'master' | 'history'>('upload');
  
  // Master Subject List State
  const [subjects, setSubjects] = useState<SubjectMasterAdminRecord[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // CSV Upload & Preview State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<(CsvParseResult & { missingFromCsvCount?: number }) | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [archiveMissing, setArchiveMissing] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  // History State
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load Subjects
  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await adminSubjectMasterClient.getSubjects({
        branch: selectedBranch,
        semester: selectedSemester,
        search: searchQuery,
      });
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subject master:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Load History
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await adminSubjectMasterClient.getImportHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'master') loadSubjects();
    if (activeSubTab === 'history') loadHistory();
  }, [activeSubTab, selectedBranch, selectedSemester, searchQuery]);

  // Handle File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setIsParsing(true);
    setImportSummary(null);

    try {
      const text = await file.text();
      setCsvRawText(text);
      const preview = await adminSubjectMasterClient.previewCsv(text);
      setPreviewResult(preview);
    } catch (err: any) {
      alert(`Error reading CSV file: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle File Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setIsParsing(true);
    setImportSummary(null);

    try {
      const text = await file.text();
      setCsvRawText(text);
      const preview = await adminSubjectMasterClient.previewCsv(text);
      setPreviewResult(preview);
    } catch (err: any) {
      alert(`Error reading CSV file: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Execute Database Import
  const handleConfirmImport = async () => {
    if (!csvRawText) return;
    setIsImporting(true);

    try {
      const result = await adminSubjectMasterClient.importCsv(csvRawText, {
        filename: csvFile?.name || 'gtu_subject_master.csv',
        archiveMissing,
        uploadedBy: 'Admin',
      });
      setImportSummary(result);
      setPreviewResult(null);
      setCsvFile(null);
      setCsvRawText('');
      loadSubjects();
    } catch (err: any) {
      alert(`Import Failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Export CSV
  const handleExport = async () => {
    try {
      const blob = await adminSubjectMasterClient.exportCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `padhaku_subject_master_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export Failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-navy-750">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Automated Academic Master</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              CSV Engineering Subject Master
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Authoritative database-driven subject catalog for Computer, IT, Electrical, ECE, Mechanical, Civil, and Chemical engineering branches across Semesters 1 through 8.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 border border-navy-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-brand-orange" />
              <span>Export Master CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-navy-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'upload'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-gray-300 hover:bg-navy-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV Master</span>
          </button>

          <button
            onClick={() => setActiveSubTab('master')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'master'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-gray-300 hover:bg-navy-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Live Subject Directory</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-gray-300 hover:bg-navy-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Import History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CSV UPLOAD & PREVIEW */}
      {activeSubTab === 'upload' && (
        <div className="space-y-6">
          {/* Import Summary Alert */}
          {importSummary && (
            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 flex items-start gap-4 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  Subject Master Import Successfully Completed!
                </h3>
                <p className="text-xs">
                  {importSummary.message} (Skipped {importSummary.skippedCount} filler rows, archived {importSummary.archivedCount} missing subjects).
                </p>
              </div>
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="bg-white dark:bg-navy-900 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-navy-800 hover:border-brand-orange text-center space-y-4 transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center mx-auto shadow-inner">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">
                Upload Engineering Subject Master CSV
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                Drag and drop your engineering subject master CSV file here, or click browse to select. The parser automatically detects branch section headers or row-level branch columns.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <label className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Select CSV File</span>
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </label>

              <a
                href="/data/gtu_subject_master_2026.csv"
                download
                className="px-4 py-2.5 bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-750 text-navy-900 dark:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-brand-orange" />
                <span>Download Sample GTU CSV</span>
              </a>
            </div>
          </div>

          {/* Loading Indicator */}
          {isParsing && (
            <div className="p-6 bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-brand-orange animate-spin mx-auto" />
              <p className="text-xs font-bold text-navy-900 dark:text-white">
                Parsing headers, validating branches, checking syllabus links & detecting duplicates...
              </p>
            </div>
          )}

          {/* PREVIEW & VALIDATION REPORT */}
          {previewResult && !isParsing && (
            <div className="space-y-6">
              {/* Metrics Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 bg-white dark:bg-navy-900 rounded-2xl border border-gray-150 dark:border-navy-800 shadow-xs text-center">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Rows</span>
                  <span className="text-xl font-extrabold text-navy-900 dark:text-white">{previewResult.totalRows}</span>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <span className="text-[10px] font-bold text-emerald-600 block uppercase">New Subjects</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">+{previewResult.newCount}</span>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/40 text-center">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase">Updates</span>
                  <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{previewResult.updatedCount}</span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-navy-850 rounded-2xl border border-gray-200 dark:border-navy-750 text-center">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase">Unchanged</span>
                  <span className="text-xl font-extrabold text-gray-700 dark:text-gray-300">{previewResult.unchangedCount}</span>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-center">
                  <span className="text-[10px] font-bold text-amber-600 block uppercase">Skipped Filler</span>
                  <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{previewResult.skippedCount}</span>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800/40 text-center">
                  <span className="text-[10px] font-bold text-red-600 block uppercase">Errors</span>
                  <span className="text-xl font-extrabold text-red-600 dark:text-red-400">{previewResult.errorCount}</span>
                </div>
              </div>

              {/* Detected Metadata Tags */}
              <div className="p-5 bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-navy-900 dark:text-white block">
                    Branches Detected ({previewResult.branchesDetected.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewResult.branchesDetected.map(b => (
                      <span key={b} className="px-2.5 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-[10px] font-bold">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-xs font-extrabold text-navy-900 dark:text-white block">
                    Semesters Detected:
                  </span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {previewResult.semestersDetected.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-navy-800 text-white text-[10px] font-bold">
                        Sem {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Errors / Warnings Action Bar */}
              {(previewResult.errorCount > 0 || previewResult.warningCount > 0) && (
                <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      {previewResult.errorCount} critical errors and {previewResult.warningCount} warnings detected.
                    </span>
                  </div>
                  <button
                    onClick={() => adminSubjectMasterClient.downloadErrorReport(previewResult.errors, previewResult.warnings)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer border-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Error CSV</span>
                  </button>
                </div>
              )}

              {/* Confirmation Controls */}
              <div className="p-6 bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="archiveMissing"
                    checked={archiveMissing}
                    onChange={e => setArchiveMissing(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange accent-brand-orange cursor-pointer"
                  />
                  <label htmlFor="archiveMissing" className="text-xs font-bold text-navy-900 dark:text-white cursor-pointer">
                    Archive subjects missing from this CSV (Mark inactive in D1 database)
                    {previewResult.missingFromCsvCount ? ` — (${previewResult.missingFromCsvCount} subjects currently in DB will be marked inactive)` : ''}
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting || previewResult.errorCount > 0}
                    className="px-6 py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer border-none"
                  >
                    {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Confirm & Execute Database Import</span>
                  </button>

                  <button
                    onClick={() => setPreviewResult(null)}
                    className="px-4 py-3 bg-gray-100 dark:bg-navy-800 text-navy-900 dark:text-white font-bold text-xs rounded-xl transition cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE SUBJECT DIRECTORY */}
      {activeSubTab === 'master' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-5 bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Engineering Branch</label>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white font-bold"
              >
                <option value="all">All Branches</option>
                <option value="computer">Computer Engineering</option>
                <option value="it">Information Technology</option>
                <option value="electrical">Electrical Engineering</option>
                <option value="ece">Electronics & Communication</option>
                <option value="mechanical">Mechanical Engineering</option>
                <option value="civil">Civil Engineering</option>
                <option value="chemical">Chemical Engineering</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white font-bold"
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">Search Subject Code or Name</label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Data Structures or BE03000081..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-750 text-navy-900 dark:text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-navy-850 text-navy-900 dark:text-white font-extrabold uppercase text-[10px] border-b border-gray-150 dark:border-navy-800">
                  <tr>
                    <th className="px-5 py-3.5">Branch</th>
                    <th className="px-4 py-3.5">Sem</th>
                    <th className="px-4 py-3.5">Subject Code</th>
                    <th className="px-5 py-3.5">Subject Name</th>
                    <th className="px-4 py-3.5">Syllabus Link</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {loadingSubjects ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-gray-400 font-bold">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-orange" />
                        Loading subjects from Cloudflare D1 database...
                      </td>
                    </tr>
                  ) : subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-gray-400 font-bold">
                        No subjects match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    subjects.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-850/50 transition">
                        <td className="px-5 py-3 font-bold text-navy-900 dark:text-white">
                          {s.branch_name}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-brand-orange">
                          Sem {s.semester}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {s.subject_code}
                        </td>
                        <td className="px-5 py-3 font-bold text-navy-900 dark:text-white">
                          {s.subject_name}
                        </td>
                        <td className="px-4 py-3">
                          {s.syllabus_link ? (
                            <a
                              href={s.syllabus_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-orange hover:underline font-bold inline-flex items-center gap-1"
                            >
                              <span>Official Link</span> <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.is_active !== 0
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {s.is_active !== 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT HISTORY TIMELINE */}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-brand-orange" />
            CSV Subject Master Import Audit Log
          </h3>

          {loadingHistory ? (
            <div className="py-8 text-center text-gray-400 font-bold">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-orange" />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-gray-400 font-bold">
              No previous CSV imports recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-850 border border-gray-150 dark:border-navy-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-navy-900 dark:text-white">{item.filename}</span>
                      <span className="text-[10px] font-bold text-gray-400">by {item.uploaded_by}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                      {new Date(item.uploaded_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      +{item.imported_rows} inserted
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      {item.updated_rows} updated
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-navy-750 text-gray-700 dark:text-gray-300 font-bold text-xs">
                      {item.unchanged_rows} unchanged
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
