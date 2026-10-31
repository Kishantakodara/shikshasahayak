import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  Download, 
  X, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileSpreadsheet, 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  Copy, 
  Send,
  Users,
  Sparkles
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface BulkEnrollModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  joinCode?: string;
}

export interface ParsedStudent {
  enrollment_number: string;
  full_name?: string;
  name?: string;
  email?: string;
  row: number;
  isValidEmail?: boolean;
}

interface EnrollmentResult {
  successful: any[];
  failed: any[];
  whitelistedEmailsCount?: number;
  invitationsDispatchedCount?: number;
  classDetails?: {
    id: string;
    name: string;
    joinCode: string;
  };
  summary: { total: number; successful: number; failed: number; whitelisted?: number };
}

/**
 * BulkEnrollModal Component
 * 
 * Allows teachers to upload Excel (.xlsx, .xls) or CSV files for bulk student enrollment.
 * Automatically adds student emails to beta.shikshasahayak.org whitelist and creates class join invitations.
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6
 */
export const BulkEnrollModal: React.FC<BulkEnrollModalProps> = ({
  open,
  onClose,
  classId,
  className,
  joinCode,
}) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<EnrollmentResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  const enrollMutation = useMutation({
    mutationFn: (students: ParsedStudent[]) =>
      teacherClient.bulkEnrollStudents(
        classId,
        students.map((s) => ({
          name: s.full_name || s.name || '',
          enrollment_number: s.enrollment_number,
          email: s.email || '',
        }))
      ),
    onSuccess: (res: any) => {
      const data = res.data;
      setResult(data);
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes', classId, 'students'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'students'] });
      
      const whitelisted = data.whitelistedEmailsCount || data.summary?.whitelisted || 0;
      if (data.summary?.failed === 0) {
        toast.success(`Enrolled ${data.summary.successful} students! ${whitelisted} email(s) whitelisted for Beta.`);
      } else {
        toast.warning(
          `${data.summary.successful} enrolled, ${data.summary.failed} failed. ${whitelisted} email(s) whitelisted.`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Enrollment failed: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    if (!isExcel && !isCsv) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV (.csv) spreadsheet');
      return;
    }

    setFile(selectedFile);
    parseSpreadsheet(selectedFile);
  };

  const parseSpreadsheet = async (uploadedFile: File) => {
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setErrors(['Spreadsheet contains no sheets']);
        return;
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

      if (rawRows.length === 0) {
        setErrors(['Spreadsheet is empty']);
        return;
      }

      // Check header row (row 0)
      const headerRow: string[] = (rawRows[0] || []).map((h: any) => String(h).trim().toLowerCase());
      
      // Auto-detect column indices
      let enrollIdx = -1;
      let nameIdx = -1;
      let emailIdx = -1;

      headerRow.forEach((colName, idx) => {
        const clean = colName.replace(/[^a-z0-9]/g, '');
        if (clean.includes('enroll') || clean.includes('roll') || clean.includes('regno') || clean.includes('studentno')) {
          enrollIdx = idx;
        } else if (clean.includes('name') || clean.includes('student') || clean.includes('fullname')) {
          nameIdx = idx;
        } else if (clean.includes('mail') || clean.includes('email')) {
          emailIdx = idx;
        }
      });

      // Default positional fallback if headers were not recognized
      const hasHeader = enrollIdx !== -1 || nameIdx !== -1 || emailIdx !== -1;
      if (!hasHeader) {
        enrollIdx = 0;
        nameIdx = 1;
        emailIdx = 2;
      } else {
        if (enrollIdx === -1) enrollIdx = 0;
        if (nameIdx === -1 && rawRows[0]?.length > 1) nameIdx = 1;
        if (emailIdx === -1 && rawRows[0]?.length > 2) emailIdx = 2;
      }

      const startRow = hasHeader ? 1 : 0;
      const parsed: ParsedStudent[] = [];
      const validationErrors: string[] = [];
      const seenEnrollment = new Set<string>();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (let i = startRow; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every((c: any) => !String(c).trim())) continue;

        const rawEnroll = row[enrollIdx] !== undefined ? String(row[enrollIdx]).trim() : '';
        const rawName = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
        const rawEmail = row[emailIdx] !== undefined ? String(row[emailIdx]).trim().toLowerCase() : '';

        // If all three are empty, skip
        if (!rawEnroll && !rawName && !rawEmail) continue;

        const finalEnroll = rawEnroll || (rawEmail ? rawEmail.split('@')[0].toUpperCase() : `GTU-${i + 1}`);
        const isValidEmail = rawEmail ? emailRegex.test(rawEmail) : false;

        if (rawEmail && !isValidEmail) {
          validationErrors.push(`Row ${i + 1}: Invalid email address format "${rawEmail}"`);
        }

        if (seenEnrollment.has(finalEnroll)) {
          validationErrors.push(`Row ${i + 1}: Duplicate enrollment number "${finalEnroll}"`);
        } else {
          seenEnrollment.add(finalEnroll);
        }

        parsed.push({
          enrollment_number: finalEnroll,
          full_name: rawName || (rawEmail ? rawEmail.split('@')[0] : `Student ${i + 1}`),
          name: rawName || (rawEmail ? rawEmail.split('@')[0] : `Student ${i + 1}`),
          email: rawEmail || undefined,
          isValidEmail,
          row: i + 1,
        });
      }

      setParsedData(parsed);
      setErrors(validationErrors);

      if (parsed.length > 0) {
        setStep('preview');
      } else {
        toast.error('No valid student rows found in spreadsheet. Check file headers.');
      }
    } catch (err: any) {
      console.error('Error parsing spreadsheet:', err);
      toast.error(`Failed to parse file: ${err.message || 'Unknown error'}`);
    }
  };

  const handleEnroll = () => {
    if (parsedData.length === 0) return;
    enrollMutation.mutate(parsedData);
  };

  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        'Full Name': 'Aarav Patel',
        'Enrollment Number': '210101001',
        'Email Address': 'aarav.patel@gmail.com',
      },
      {
        'Full Name': 'Diya Sharma',
        'Enrollment Number': '210101002',
        'Email Address': 'diya.sharma@gmail.com',
      },
      {
        'Full Name': 'Rohan Mehta',
        'Enrollment Number': '210101003',
        'Email Address': 'rohan.mehta@gmail.com',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Auto fit column widths
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 20 },
      { wch: 30 },
    ];

    XLSX.writeFile(workbook, 'shikshasahayak_student_roster_template.xlsx');
    toast.success('Excel (.xlsx) template downloaded!');
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = `Full Name,Enrollment Number,Email Address\nAarav Patel,210101001,aarav.patel@gmail.com\nDiya Sharma,210101002,diya.sharma@gmail.com\nRohan Mehta,210101003,rohan.mehta@gmail.com`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shikshasahayak_student_roster_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV template downloaded!');
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setResult(null);
    setStep('upload');
    onClose();
  };

  const validEmailsCount = parsedData.filter((s) => s.email && s.isValidEmail).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-navy-800">
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Automated Student Roster
          </div>
          <DialogTitle className="text-2xl font-bold font-display text-navy-900 dark:text-white">
            Add Students via Excel / CSV Sheet
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Upload an Excel (.xlsx, .xls) or CSV spreadsheet for <span className="font-bold text-navy-900 dark:text-white">"{className}"</span>. Student emails will automatically be whitelisted on <span className="text-brand-orange font-semibold">beta.shikshasahayak.org</span> and receive class join details.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6 mt-4">
            <div className="border-2 border-dashed border-orange-200 dark:border-navy-700 bg-orange-50/30 dark:bg-navy-950/40 rounded-3xl p-8 text-center space-y-4 transition hover:border-brand-orange">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-navy-800 text-brand-orange flex items-center justify-center mx-auto shadow-xs">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  Upload Student Excel or CSV Sheet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  Drag and drop your roster file here or click below to select (.xlsx, .xls, .csv).
                </p>
              </div>

              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="roster-upload"
              />

              <label htmlFor="roster-upload">
                <Button type="button" className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Select Excel / CSV File
                  </span>
                </Button>
              </label>
            </div>

            {/* Template & Guidelines Card */}
            <div className="p-5 bg-gray-50 dark:bg-navy-950 rounded-2xl border border-gray-200 dark:border-navy-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                    Expected Spreadsheet Columns:
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Your sheet should include: <span className="font-semibold text-gray-700 dark:text-gray-200">Full Name</span>, <span className="font-semibold text-gray-700 dark:text-gray-200">Enrollment Number</span>, and <span className="font-semibold text-gray-700 dark:text-gray-200">Email Address</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadExcelTemplate}
                    className="text-xs border-brand-orange/40 text-brand-orange hover:bg-orange-50 dark:hover:bg-navy-900 font-bold gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Excel (.xlsx) Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCsvTemplate}
                    className="text-xs border-gray-300 dark:border-navy-700 text-gray-700 dark:text-gray-300 font-semibold gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV Template
                  </Button>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 dark:border-navy-800 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Automatic Whitelist on <strong className="text-navy-900 dark:text-white">beta.shikshasahayak.org</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>Class Details & Join Code Sent to Student Emails</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Validation */}
        {step === 'preview' && (
          <div className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-orange-50 dark:bg-navy-950 rounded-2xl border border-orange-200 dark:border-navy-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-orange" />
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white">
                    Parsed: {parsedData.length} Students
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({validEmailsCount} emails ready for Beta Whitelisting)
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('upload')}
                className="text-xs text-gray-500 hover:text-navy-900 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Change Spreadsheet
              </Button>
            </div>

            {errors.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/40 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-yellow-900 dark:text-yellow-200 mb-1">
                      {errors.length} Format Notice(s):
                    </p>
                    <ul className="text-[11px] text-yellow-800 dark:text-yellow-300 space-y-0.5 max-h-24 overflow-y-auto">
                      {errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Students Table Preview */}
            <div className="border border-gray-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-navy-950 text-gray-400 font-bold border-b border-gray-200 dark:border-navy-800 sticky top-0 uppercase">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Enrollment Number</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3 text-right">Beta Whitelist Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-navy-800 text-gray-700 dark:text-gray-300 font-medium">
                    {parsedData.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/40">
                        <td className="p-3 text-gray-400 font-mono text-[11px]">{student.row}</td>
                        <td className="p-3 font-bold text-navy-900 dark:text-white">
                          {student.full_name || student.name || '-'}
                        </td>
                        <td className="p-3 font-mono font-semibold text-brand-orange">
                          {student.enrollment_number}
                        </td>
                        <td className="p-3">
                          {student.email ? (
                            <span className="font-mono text-xs">{student.email}</span>
                          ) : (
                            <span className="text-gray-400 italic">No email provided</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {student.email && student.isValidEmail ? (
                            <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle className="w-3 h-3 mr-1" /> Ready to Whitelist
                            </Badge>
                          ) : student.email ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Invalid Email Format
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-gray-400">
                              Offline Only
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-navy-800">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEnroll}
                disabled={enrollMutation.isPending || parsedData.length === 0}
                className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md gap-2"
              >
                {enrollMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enrolling & Whitelisting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm & Enroll {parsedData.length} Student{parsedData.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results & Invitation Confirmation */}
        {step === 'result' && result && (
          <div className="space-y-5 mt-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-navy-900 dark:text-white font-display">
                Roster Enrollment Complete! 🎉
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {result.summary.successful} students enrolled into <span className="font-bold text-navy-900 dark:text-white">"{className}"</span>.
              </p>
            </div>

            {/* Whitelist and Email Status Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  Beta Whitelist Updated
                </div>
                <p className="text-2xl font-black text-navy-900 dark:text-white">
                  {result.whitelistedEmailsCount || result.summary.whitelisted || 0}
                </p>
                <p className="text-[11px] text-gray-500">
                  Student emails granted instant access to <strong>beta.shikshasahayak.org</strong>
                </p>
              </div>

              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Mail className="w-4 h-4" />
                  Class Invitation Dispatches
                </div>
                <p className="text-2xl font-black text-navy-900 dark:text-white">
                  {result.invitationsDispatchedCount || result.summary.successful || 0}
                </p>
                <p className="text-[11px] text-gray-500">
                  Join notifications generated with Class Join Code & Portal Link
                </p>
              </div>
            </div>

            {/* Quick Share Join Link Box */}
            {(joinCode || result.classDetails?.joinCode) && (
              <div className="p-4 bg-gray-50 dark:bg-navy-950 rounded-2xl border border-gray-200 dark:border-navy-800 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-brand-orange" />
                    Class Join Code: <strong className="font-mono text-brand-orange text-sm">{joinCode || result.classDetails?.joinCode}</strong>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const code = joinCode || result.classDetails?.joinCode || '';
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://beta.shikshasahayak.org';
                      const link = `${baseUrl}/login?joinCode=${encodeURIComponent(code)}`;
                      navigator.clipboard.writeText(link);
                      toast.success('Join link copied! Share on WhatsApp or Class Email.');
                    }}
                    className="text-xs font-bold text-brand-orange border-brand-orange/40 hover:bg-orange-50 dark:hover:bg-navy-900 gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Join Link
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-navy-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setParsedData([]);
                  setErrors([]);
                }}
              >
                Upload Another Sheet
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

