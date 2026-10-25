// ============================================================
// SHIKSHA SAHAYAK OS - ADMIN SUBJECT MASTER API CLIENT
// Frontend client for uploading, previewing, importing, exporting, and managing the Subject Master
// ============================================================

import { parseSubjectMasterCsv, CsvParseResult, generateErrorCsvReport } from '../utils/csvSubjectMasterParser';

export interface SubjectMasterAdminRecord {
  id: string;
  subject_name: string;
  subject_code: string;
  subject_slug: string;
  semester: number;
  syllabus_link?: string;
  is_active: number;
  wef_year?: number;
  branch_name: string;
  branch_slug: string;
  branch_short?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImportHistoryRecord {
  id: string;
  filename: string;
  uploaded_by: string;
  uploaded_at: string;
  total_rows: number;
  imported_rows: number;
  updated_rows: number;
  unchanged_rows: number;
  skipped_rows: number;
  error_count: number;
  archived_count: number;
  error_log_json?: string;
}

export const adminSubjectMasterClient = {
  /**
   * Search and filter D1 subject master
   */
  async getSubjects(params?: { branch?: string; semester?: number | string; search?: string; code?: string }): Promise<SubjectMasterAdminRecord[]> {
    const query = new URLSearchParams();
    if (params?.branch) query.set('branch', params.branch);
    if (params?.semester !== undefined && params.semester !== 'all') query.set('semester', String(params.semester));
    if (params?.search) query.set('search', params.search);
    if (params?.code) query.set('code', params.code);

    const res = await fetch(`/api/admin/academic/subjects?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.statusText}`);
    const data = await res.json();
    return data.subjects || [];
  },

  /**
   * Preview CSV import client-side & server-side
   */
  async previewCsv(csvText: string): Promise<CsvParseResult & { missingFromCsvCount?: number }> {
    try {
      const res = await fetch('/api/admin/academic/subjects/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Backend preview API unreachable, using client parser fallback:', e);
    }
    // Fallback to client-side parsing
    return parseSubjectMasterCsv(csvText);
  },

  /**
   * Execute CSV import into Cloudflare D1
   */
  async importCsv(csvText: string, options?: { filename?: string; archiveMissing?: boolean; uploadedBy?: string }): Promise<any> {
    const res = await fetch('/api/admin/academic/subjects/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv: csvText,
        filename: options?.filename || 'subject_master_import.csv',
        archiveMissing: Boolean(options?.archiveMissing),
        uploadedBy: options?.uploadedBy || 'Admin',
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Import failed with status ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Export current Subject Master CSV
   */
  async exportCsv(): Promise<Blob> {
    const res = await fetch('/api/admin/academic/subjects/export');
    if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
    return await res.blob();
  },

  /**
   * Fetch past import audit history
   */
  async getImportHistory(): Promise<ImportHistoryRecord[]> {
    const res = await fetch('/api/admin/academic/subjects/history');
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  },

  /**
   * Generate downloadable error report CSV
   */
  downloadErrorReport(errors: any[], warnings: any[]) {
    const csvStr = generateErrorCsvReport(errors, warnings);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subject_master_error_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
