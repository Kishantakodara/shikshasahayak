// ============================================================
// SHIKSHA SAHAYAK OS: ACADEMIC IMPORT & EXPORT MODAL
// CSV/JSON Preview, Validation, Duplicate Detection, & Export
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { adminSubjectMasterClient } from '../../../api/adminSubjectMasterClient';

interface AcademicImportExportModalProps {
  isOpen: boolean;
  mode: 'import' | 'export';
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const AcademicImportExportModal: React.FC<AcademicImportExportModalProps> = ({
  isOpen,
  mode,
  onClose,
  onImportSuccess,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      try {
        const preview = await adminSubjectMasterClient.previewCsv(text);
        setPreviewResult(preview);
      } catch (err) {
        console.error('Preview error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!csvContent) return;
    try {
      setIsImporting(true);
      await adminSubjectMasterClient.importCsv(csvContent, {
        filename: fileName || 'academic_structure.csv',
        archiveMissing: false,
      });
      alert('Academic structure imported successfully!');
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const blob = await adminSubjectMasterClient.exportCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shikshasahayak_academic_catalog_${Date.now()}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to export catalog');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
      <div className="relative w-full max-w-xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 font-sans space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white font-display flex items-center gap-2">
            {mode === 'import' ? (
              <>
                <Upload className="w-5 h-5 text-orange-400" />
                Import Academic Structure & Subjects
              </>
            ) : (
              <>
                <Download className="w-5 h-5 text-orange-400" />
                Export Academic Catalog Report
              </>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === 'import' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Upload a structured CSV file containing universities, branches, semesters, and subjects. The system validates all records and detects duplicates before committing changes.
            </p>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/60 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-900/40">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="academic-csv-upload"
              />
              <label htmlFor="academic-csv-upload" className="cursor-pointer block">
                <FileSpreadsheet className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-white block">
                  {fileName || 'Click to select CSV File (e.g. subjects_master.csv)'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Expected headers: Branch, Semester, Subject Name, Subject Code, Syllabus Link
                </span>
              </label>
            </div>

            {/* Validation Preview Breakdown */}
            {isLoading && (
              <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                Validating CSV rows...
              </div>
            )}

            {previewResult && (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Validation Results:</span>
                  <span className="text-slate-400 font-mono">{previewResult.totalRows || 0} total records</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                    <span className="font-extrabold text-sm block font-mono">{previewResult.validCount || previewResult.parsedRecords?.length || 0}</span>
                    <span className="text-[10px] font-bold">Valid Records</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-amber-400">
                    <span className="font-extrabold text-sm block font-mono">{previewResult.warnings?.length || 0}</span>
                    <span className="text-[10px] font-bold">Warnings / Duplicates</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-rose-400">
                    <span className="font-extrabold text-sm block font-mono">{previewResult.errorCount || 0}</span>
                    <span className="text-[10px] font-bold">Critical Errors</span>
                  </div>
                </div>

                {previewResult.errors?.length > 0 && (
                  <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-300 text-[11px] space-y-1">
                    <span className="font-bold block">Issues to Review:</span>
                    {previewResult.errors.slice(0, 3).map((err: any, i: number) => (
                      <p key={i}>• {err.message || String(err)}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!previewResult || isImporting || (previewResult.errorCount > 0 && !previewResult.parsedRecords?.length)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Import Valid Records</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Export the current ShikshaSahayak Master Academic Catalog (universities, branches, semesters, subjects, syllabus links, and coverage metadata).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  exportFormat === 'csv'
                    ? 'bg-orange-500/10 border-orange-500/40 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-orange-400 mb-1.5" />
                <span className="text-xs font-bold block">CSV Format</span>
                <span className="text-[10px] text-slate-500">Universal spreadsheet export for Excel / Sheets</span>
              </div>

              <div
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  exportFormat === 'json'
                    ? 'bg-orange-500/10 border-orange-500/40 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 text-cyan-400 mb-1.5" />
                <span className="text-xs font-bold block">JSON Format</span>
                <span className="text-[10px] text-slate-500">Structured raw data export for automation</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Download Export File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
