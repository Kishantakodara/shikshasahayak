import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, File, Trash2, ShieldAlert } from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { compressPdfFile } from '../utils/pdfCompressor';
import { usePreventTabClose } from '../hooks/usePreventTabClose';

function parseFilename(filename: string) {
  const name = filename.replace(/\.pdf$/i, '');
  
  // 1. Detect Branch
  let branch = '';
  const branchMatch = name.match(/\b(cse|it|ece|ee|me|ce|computer|information|electrical|ece|mechanical|civil)\b/i);
  if (branchMatch) {
    const b = branchMatch[1].toLowerCase();
    if (['cse', 'computer'].includes(b)) branch = 'branch_computer';
    else if (['it', 'information'].includes(b)) branch = 'branch_it';
    else if (['ee', 'electrical'].includes(b)) branch = 'branch_electrical';
    else if (['ece', 'electronics'].includes(b)) branch = 'branch_ece';
    else if (['me', 'mechanical'].includes(b)) branch = 'branch_mechanical';
    else if (['ce', 'civil'].includes(b)) branch = 'branch_civil';
  }

  // 2. Detect Semester
  let semester = '';
  const semMatch = name.match(/sem(?:ester)?\s*([1-8])/i);
  if (semMatch) {
    semester = semMatch[1];
  }

  // 3. Detect Type
  let type = 'study-material';
  if (/syllabus/i.test(name)) {
    type = 'syllabus';
  } else if (/(pyq|endsem|midsem|paper|exam)/i.test(name)) {
    type = 'pyq';
  }

  // 4. Detect Year & Session
  let year = '';
  const yearMatch = name.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = yearMatch[1];
  }
  
  let session = '';
  const sessionMatch = name.match(/\b(winter|summer|dec|may|jun|jan|spring)\b/i);
  if (sessionMatch) {
    const s = sessionMatch[1].toLowerCase();
    if (['winter', 'dec', 'jan'].includes(s)) session = 'winter';
    else if (['summer', 'may', 'jun', 'spring'].includes(s)) session = 'summer';
  }

  // 5. Clean Subject
  let subject = name
    .replace(/\b(cse|it|ece|ee|me|ce|computer|information|electrical|ece|mechanical|civil)\b/gi, '')
    .replace(/sem(?:ester)?\s*[1-8]/gi, '')
    .replace(/\b(pyq|endsem|midsem|paper|exam|syllabus|notes|studymaterial|study-material|tutorial)\b/gi, '')
    .replace(/\b(20\d{2})\b/g, '')
    .replace(/\b(winter|summer|dec|may|jun|jan|spring)\b/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize words
  subject = subject.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return { branch, semester, type, year, session, subject };
}

function mapDeptToBranchId(deptId: string): string {
  const mapping: Record<string, string> = {
    'cse': 'branch_computer',
    'it': 'branch_it',
    'ee': 'branch_electrical',
    'ece': 'branch_ece',
    'me': 'branch_mechanical',
    'ce': 'branch_civil'
  };
  return mapping[deptId] || `branch_${deptId}`;
}

const BulkUpload = ({ embedded = false }: { embedded?: boolean }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [department, setDepartment] = useState('it');
  const [targetSemester, setTargetSemester] = useState('auto');
  const [dragActive, setDragActive] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  usePreventTabClose(isUploading);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await processFiles(e.target.files);
  };

  const processFiles = async (fileList: FileList) => {
    const selectedFiles = Array.from(fileList);
    const files = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.pdf'));
    if (files.length === 0) {
      addLog('No PDF files found in the selection.');
      return;
    }

    setTotal(files.length);
    setProgress(0);
    setIsUploading(true);
    addLog(`Found ${files.length} PDF files. Starting bulk upload and parsing...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        addLog(`[${i + 1}/${files.length}] Parsing metadata for: ${file.name}`);
        const parsed = parseFilename(file.name);
        
        // Resolve parameters
        const finalBranch = parsed.branch || mapDeptToBranchId(department);
        const finalSemester = (targetSemester === 'auto' ? parsed.semester : targetSemester) || '1';
        const finalSubject = parsed.subject || 'General Subject';
        
        const titleString = parsed.subject 
          ? `${parsed.subject} (${parsed.type === 'pyq' ? 'PYQ' : parsed.type === 'syllabus' ? 'Syllabus' : 'Study Material'})`
          : file.name.replace(/\.pdf$/i, '');

        addLog(`  -> Subject: "${finalSubject}" | Type: "${parsed.type}" | Semester: ${finalSemester} | Branch: ${finalBranch}`);
        
        addLog(`  -> Compressing PDF...`);
        let processedFile = file;
        try {
          processedFile = await compressPdfFile(file, () => {});
          const savedPercentage = ((file.size - processedFile.size) / file.size) * 100;
          if (savedPercentage > 0) {
            addLog(`  -> Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(processedFile.size / 1024 / 1024).toFixed(2)}MB (Saved ${savedPercentage.toFixed(1)}%)`);
          } else {
            addLog(`  -> Already optimized (no size reduction).`);
          }
        } catch (compErr: any) {
          addLog(`  -> [Warning] Compression failed, using original. Reason: ${compErr.message || compErr}`);
        }

        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('title', titleString);
        formData.append('material_type', parsed.type);
        formData.append('manual_subject_name', finalSubject);
        formData.append('branch_ids', finalBranch);
        formData.append('semesters', finalSemester);
        
        if (parsed.type === 'pyq') {
          formData.append('exam_year', parsed.year || new Date().getFullYear().toString());
          formData.append('exam_session', parsed.session || 'winter');
        }

        const res = await fetch('/api/admin/materials', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}) as any) as any;
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json() as any;
        addLog(`✓ Success: Uploaded "${titleString}" (ID: ${data.id})`);
      } catch (err: any) {
        addLog(`❌ Failed: "${file.name}" — ${err.message}`);
      }
      setProgress(i + 1);
    }

    setIsUploading(false);
    addLog('🎉 Bulk upload completed!');
  };

  const handleCleanup = async () => {
    if (!confirm('This will audit and synchronize the database and the R2 storage bucket, deleting any broken records or orphaned storage files. Do you want to proceed?')) return;
    setIsUploading(true);
    addLog('Starting audit and cleanup of D1 records and R2 storage...');
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as any;
      if (data.success) {
        addLog(`✓ Sync complete! Cleaned up ${data.dbDeletedCount} broken DB records and ${data.r2DeletedCount} orphaned R2 files.`);
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach((log: string) => addLog(`  [Audit Log] ${log}`));
        }
      } else {
        addLog(`❌ Sync audit failed: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`❌ Audit Error: ${err.message}`);
    }
    setIsUploading(false);
  };

  const content = (
    <div className={`${embedded ? '' : 'max-w-4xl mx-auto bg-surface rounded-3xl shadow-xl p-8 border border-border'}`}>
      {!embedded && (
        <>
          <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">Bulk Content Uploader</h1>
          <p className="text-muted mb-8">Automatically parse and upload multiple PDFs. The system will extract metadata from filenames.</p>
        </>
      )}

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-text">Fallback Department</label>
          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isUploading}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">
              ▼
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-text">Semester Setting</label>
          <div className="relative">
            <select
              value={targetSemester}
              onChange={(e) => setTargetSemester(e.target.value)}
              disabled={isUploading}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
            >
              <option value="auto">Auto-detect from Subject Code / Name</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem} (Enforce for all)</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">
              ▼
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        whileHover={{ scale: isUploading ? 1 : 1.01 }}
        whileTap={{ scale: isUploading ? 1 : 0.99 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center relative transition-all duration-300 overflow-hidden ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border bg-background hover:bg-surface-secondary'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFolderSelect}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />
        
        <div className="flex flex-col items-center pointer-events-none relative z-0">
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="text-lg font-bold text-text mb-2">Processing & Uploading Files...</p>
                <p className="text-sm font-medium text-primary">
                  {progress} / {total} Completed
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4 shadow-sm border border-border">
                  <Upload className="h-8 w-8 text-muted" />
                </div>
                <p className="text-xl font-bold text-text mb-2">
                  Click or Drag to Bulk Upload PDFs
                </p>
                <p className="text-sm text-muted">
                  Drag and drop files. Branch/Sem/Subject/Type are parsed from filenames.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {total > 0 && isUploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-surface-secondary">
            <motion.div 
              className="h-full bg-primary" 
              initial={{ width: 0 }}
              animate={{ width: `${(progress / total) * 100}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        )}
      </motion.div>

      <div className="mt-8 bg-[#0B1220] rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-green-400 border border-slate-800 shadow-inner">
        {logs.map((log, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i} 
            className="mb-1.5 flex items-start gap-3"
          >
            <span className="text-slate-600 shrink-0 select-none">[{new Date().toLocaleTimeString()}]</span>
            <span className={
              log.includes('❌') ? 'text-red-400' : 
              log.includes('🎉') ? 'text-blue-400 font-bold' : 
              log.includes('✓') ? 'text-emerald-400 font-medium' :
              'text-green-400'
            }>
              {log}
            </span>
          </motion.div>
        ))}
        <div ref={logEndRef} />
        {logs.length === 0 && <span className="text-slate-500">System ready. Awaiting files...</span>}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleCleanup}
          disabled={isUploading}
          className="bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 group"
          title="Audit database and R2 storage objects to delete any broken records"
        >
          <ShieldAlert className="h-4 w-4 group-hover:scale-110 transition-transform" /> Sync D1/R2 Storage & Clean
        </button>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      {content}
    </div>
  );
};

export default BulkUpload;
