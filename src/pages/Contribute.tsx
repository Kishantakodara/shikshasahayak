import React, { useState, useEffect } from 'react';
import { Upload, FileText, Book, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { DEPARTMENTS, SEMESTERS, YEARS } from '../constants';
import { PaperType } from '../types';
import { apiClient } from '../api/client';
import { compressPdfFile } from '../utils/pdfCompressor';
import { usePreventTabClose } from '../hooks/usePreventTabClose';
type UploadType = 'pyq' | 'note' | 'solution';

const departmentToBranchSlug: Record<string, string> = {
  cse: 'computer',
  it: 'it',
  ee: 'electrical',
  ece: 'ece',
  me: 'mechanical',
  ce: 'civil',
};

const branchSlugToDepartment: Record<string, string> = {
  computer: 'cse',
  it: 'it',
  electrical: 'ee',
  ece: 'ece',
  mechanical: 'me',
  civil: 'ce',
};

const Contribute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<UploadType>('pyq');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('Submitting...');

  usePreventTabClose(isSubmitting);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0].id);
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [paperType, setPaperType] = useState<PaperType>(PaperType.ENDSEM);
  const [author, setAuthor] = useState(''); // For notes/solutions
  const [file, setFile] = useState<File | null>(null);

  // Subject States
  const [subjectMode, setSubjectMode] = useState<'catalog' | 'custom'>('catalog');
  const [subjectOfferingId, setSubjectOfferingId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [catalogSubjects, setCatalogSubjects] = useState<any[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  // Solution Submission States
  const [parentDocumentId, setParentDocumentId] = useState('');
  const [parentPyqs, setParentPyqs] = useState<any[]>([]);
  const [isParentPyqsLoading, setIsParentPyqsLoading] = useState(false);
  const [prefilledParentTitle, setPrefilledParentTitle] = useState('');

  // 1. Process URL Search Params for Pre-filling
  useEffect(() => {
    const typeParam = searchParams.get('type') as UploadType;
    const parentDocIdParam = searchParams.get('parent_document_id');
    const subjectIdParam = searchParams.get('subject_id');
    const departmentParam = searchParams.get('department');
    const semesterParam = searchParams.get('semester');

    if (typeParam === 'solution') {
      setActiveTab('solution');
      if (departmentParam) {
        const mapped = branchSlugToDepartment[departmentParam] || departmentParam;
        setDepartment(mapped);
      }
      if (semesterParam) setSemester(Number(semesterParam));
      if (subjectIdParam) {
        setSubjectOfferingId(subjectIdParam);
        setSubjectMode('catalog');
      }
      if (parentDocIdParam) {
        setParentDocumentId(parentDocIdParam);
        apiClient.getMaterial(parentDocIdParam)
          .then((data) => {
            setPrefilledParentTitle(data.title);
            setTitle(`Solution for ${data.title}`);
          })
          .catch((err) => console.error("Failed to load parent PYQ details:", err));
      }
      setStep(2);
    }
  }, [searchParams]);

  useEffect(() => {
    const slug = departmentToBranchSlug[department];
    if (!slug || !semester) {
      setCatalogSubjects([]);
      return;
    }

    let isActive = true;
    setIsCatalogLoading(true);
    apiClient.getCatalog(slug, semester, 2026)
      .then((data) => {
        if (isActive) setCatalogSubjects(data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch catalog subjects:', err);
        if (isActive) setCatalogSubjects([]);
      })
      .finally(() => {
        if (isActive) setIsCatalogLoading(false);
      });

    return () => { isActive = false; };
  }, [department, semester]);

  // Fetch approved PYQs when subject selection changes for solutions
  useEffect(() => {
    if (activeTab !== 'solution' || !subjectOfferingId || parentDocumentId) {
      setParentPyqs([]);
      return;
    }

    let isActive = true;
    setIsParentPyqsLoading(true);
    apiClient.getMaterials(subjectOfferingId)
      .then((data) => {
        if (!isActive) return;
        const pyqs = data.filter((m: any) => m.type === 'pyq' && (m.status === 'published' || m.approval_status === 'approved'));
        setParentPyqs(pyqs);
      })
      .catch((err) => {
        console.error("Failed to fetch subject PYQs:", err);
        if (isActive) setParentPyqs([]);
      })
      .finally(() => {
        if (isActive) setIsParentPyqsLoading(false);
      });

    return () => { isActive = false; };
  }, [subjectOfferingId, activeTab, parentDocumentId]);

  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    setSubjectOfferingId('');
    setSubjectName('');
    setSubjectCode('');
    setSubjectMode('catalog');
  };

  const handleSemesterChange = (val: number) => {
    setSemester(val);
    setSubjectOfferingId('');
    setSubjectName('');
    setSubjectCode('');
    setSubjectMode('catalog');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 100 * 1024 * 1024) { // 100 MB limit
        alert('File size exceeds 100MB. Please try a smaller file.');
        e.target.value = ''; // Reset input
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (activeTab === 'solution' && !parentDocumentId) {
      alert('Please select a question paper to submit a solution for.');
      return;
    }

    if (subjectMode === 'catalog' && !subjectOfferingId && activeTab !== 'solution') {
      alert('Please select a subject or choose custom subject.');
      return;
    }
    if (subjectMode === 'custom' && !subjectName.trim()) {
      alert('Custom subject name is required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Compressing PDF...');

    try {
      let finalFile = file;

      // Attempt to compress if it's a PDF
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          finalFile = await compressPdfFile(file, (progress, msg) => {
            setSubmitMessage(`Compressing... ${Math.round(progress)}% - ${msg}`);
          });
        } catch (compErr) {
          console.error("Compression failed, uploading original:", compErr);
        }
      }

      setSubmitMessage('Uploading...');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('material_type', activeTab); // 'pyq', 'note', or 'solution'
      
      formData.append('departmentId', department);
      formData.append('semester', semester.toString());
      
      if (subjectMode === 'catalog') {
        formData.append('subject_id', subjectOfferingId);
      } else {
        formData.append('subject_name', subjectName);
        formData.append('subject_code', subjectCode);
      }

      if (activeTab === 'pyq') {
        formData.append('exam_year', year.toString());
      } else if (activeTab === 'solution') {
        formData.append('parent_document_id', parentDocumentId);
        if (author.trim()) {
          formData.append('author', author);
        }
      } else {
        // Backend doesn't have an author field, so append it to the title
        formData.set('title', `${title} (by ${author})`);
      }
      formData.append('file', finalFile);
      
      await apiClient.submitMaterial(formData);
      setStep(3); // Success state
    } catch (error: any) {
      console.error('Submission Error:', error);
      let errMsg = error.message || 'Unknown error';
      if (errMsg.toLowerCase() === 'failed to fetch') {
        errMsg = 'Network error or connection dropped. Please check your internet connection or try a smaller file.';
      }
      alert('Failed to submit: ' + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6">What are you uploading?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button
          onClick={() => { setActiveTab('note'); setStep(2); }}
          className="p-6 border-2 border-gray-100 dark:border-navy-800 hover:border-brand-orange dark:hover:border-brand-orange rounded-xl text-left group transition-all hover:shadow-md dark:bg-navy-900 flex flex-col justify-between"
        >
          <div>
            <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-transform">
              <Book className="h-6 w-6 text-brand-orange" />
            </div>
            <h3 className="font-bold text-navy-900 dark:text-white mb-1">Study Notes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Share your lecture notes or summaries.</p>
          </div>
        </button>

        <button
          onClick={() => { setActiveTab('solution'); setStep(2); }}
          className="p-6 border-2 border-gray-100 dark:border-navy-800 hover:border-brand-orange dark:hover:border-brand-orange rounded-xl text-left group transition-all hover:shadow-md dark:bg-navy-900 flex flex-col justify-between"
        >
          <div>
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-bold text-navy-900 dark:text-white mb-1">PYQ Solution</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Share solutions for listed exam papers.</p>
          </div>
        </button>

        <button
          onClick={() => { setActiveTab('pyq'); setStep(2); }}
          className="p-6 border-2 border-gray-100 dark:border-navy-800 hover:border-brand-orange dark:hover:border-brand-orange rounded-xl text-left group transition-all hover:shadow-md dark:bg-navy-900 flex flex-col justify-between"
        >
          <div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-navy-900 dark:text-white mb-1">Question Paper (PYQ)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload Midsem, Endsem, or Quiz papers.</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">Enter Details</h2>
        <button 
          type="button" 
          onClick={() => {
            window.history.replaceState(null, '', window.location.pathname);
            setParentDocumentId('');
            setPrefilledParentTitle('');
            setTitle('');
            setStep(1);
          }} 
          className="text-sm text-gray-500 hover:text-brand-orange dark:text-gray-400 dark:hover:text-brand-orange"
        >
          Change Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {searchParams.get('parent_document_id') ? (
          <div className="p-4 bg-emerald-50 dark:bg-navy-800/40 border border-emerald-200 dark:border-navy-750 rounded-xl md:col-span-2 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Contributing Solution For</p>
              <p className="text-sm font-semibold text-navy-900 dark:text-white">{prefilledParentTitle || 'Loading paper details...'}</p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
              >
                {SEMESTERS.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
              <select
                value={subjectMode === 'custom' ? '__custom' : subjectOfferingId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom') {
                    setSubjectMode('custom');
                    setSubjectOfferingId('');
                    setSubjectName('');
                    setSubjectCode('');
                  } else {
                    setSubjectMode('catalog');
                    setSubjectOfferingId(val);
                    const selected = catalogSubjects.find(s => s.id === val);
                    setSubjectName(selected?.subjectName || '');
                    setSubjectCode(selected?.subjectCode || '');
                  }
                }}
                disabled={isCatalogLoading}
                className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none disabled:opacity-60"
                required
              >
                <option value="">{isCatalogLoading ? 'Loading subjects...' : 'Select Subject'}</option>
                {catalogSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subjectName}{sub.subjectCode ? ` (${sub.subjectCode})` : ''}
                  </option>
                ))}
                {activeTab !== 'solution' && <option value="__custom">Other / Custom Subject</option>}
              </select>
            </div>

            {subjectMode === 'custom' && (
              <div className="space-y-4 p-5 bg-gray-50 dark:bg-navy-850 border border-gray-200 dark:border-navy-800 rounded-xl md:col-span-2 animate-fade-in">
                <h4 className="text-sm font-bold text-navy-900 dark:text-white">Enter Custom Subject Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Subject Name</label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="e.g. Mathematics 2"
                      className="w-full bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-750 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange text-navy-900 dark:text-white"
                      required={subjectMode === 'custom'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Subject Code (Optional)</label>
                    <input
                      type="text"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      placeholder="e.g. MA-201"
                      className="w-full bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-750 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange text-navy-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'solution' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select PYQ Paper</label>
                <select
                  value={parentDocumentId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setParentDocumentId(val);
                    const selected = parentPyqs.find(p => p.id === val);
                    if (selected) {
                      setTitle(`Solution for ${selected.title}`);
                    } else {
                      setTitle('');
                    }
                  }}
                  disabled={isParentPyqsLoading || !subjectOfferingId}
                  className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none disabled:opacity-60"
                  required
                >
                  <option value="">
                    {isParentPyqsLoading 
                      ? 'Loading PYQs...' 
                      : !subjectOfferingId 
                        ? 'Please select a subject first' 
                        : parentPyqs.length === 0 
                          ? 'No approved PYQs found for this subject' 
                          : 'Select PYQ Paper'}
                  </option>
                  {parentPyqs.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                {subjectOfferingId && !isParentPyqsLoading && parentPyqs.length === 0 && (
                  <p className="text-xs text-brand-orange mt-2 flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle className="h-4 w-4" />
                    No question papers listed for this subject yet. Upload the question paper first!
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Title / Topic Name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={activeTab === 'pyq' ? "e.g. End Sem Question Paper" : activeTab === 'solution' ? "e.g. Solution for End Sem Question Paper" : "e.g. Unit 3 Trees Notes"}
          className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange outline-none"
          required
        />
      </div>

      {activeTab === 'pyq' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paper Type</label>
            <select
              value={paperType}
              onChange={(e) => setPaperType(e.target.value as PaperType)}
              className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
            >
              {Object.values(PaperType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {(activeTab === 'note' || activeTab === 'solution') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {activeTab === 'solution' ? 'Author / Contributor Name' : 'Author Name (Your Name)'}
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={activeTab === 'solution' ? "e.g. John Doe (Optional)" : "e.g. John Doe"}
            className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange outline-none"
            required={activeTab === 'note'}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload PDF</label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-navy-50 dark:file:bg-navy-800 file:text-navy-700 dark:file:text-gray-200 hover:file:bg-navy-100 dark:hover:file:bg-navy-700 cursor-pointer"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-orange text-white py-3 rounded-xl font-bold hover:bg-brand-hover transition-colors shadow-lg disabled:opacity-70"
      >
        {isSubmitting ? submitMessage : 'Submit for Review'}
      </button>
    </form>
  );

  const renderStep3 = () => (
    <div className="text-center animate-fade-in-up py-8">
      <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">Submission Received!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Thank you for contributing. Your {activeTab === 'pyq' ? 'paper' : activeTab === 'solution' ? 'solution' : 'note'} has been sent to the admins for approval. It will be live once verified.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => { setStep(1); setTitle(''); setFile(null); setParentDocumentId(''); setPrefilledParentTitle(''); }}
          className="bg-navy-900 dark:bg-brand-orange text-white px-6 py-2 rounded-lg hover:bg-navy-800 dark:hover:bg-brand-hover transition-colors"
        >
          Upload Another
        </button>
        <Link to="/" className="px-6 py-2 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800">
          Go Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-full bg-gray-50 dark:bg-navy-950 py-8 transition-colors">
      <div className="max-w-2xl mx-auto px-4">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white">Contribute to ShikshaSahayak</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Help your juniors by sharing study resources.</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-10 space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-brand-orange text-white' : 'bg-gray-200 dark:bg-navy-800 text-gray-500 dark:text-gray-400'}`}>1</div>
          <div className={`h-1 w-10 ${step >= 2 ? 'bg-brand-orange' : 'bg-gray-200 dark:bg-navy-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-brand-orange text-white' : 'bg-gray-200 dark:bg-navy-800 text-gray-500 dark:text-gray-400'}`}>2</div>
          <div className={`h-1 w-10 ${step >= 3 ? 'bg-brand-orange' : 'bg-gray-200 dark:bg-navy-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-brand-orange text-white' : 'bg-gray-200 dark:bg-navy-800 text-gray-500 dark:text-gray-400'}`}>3</div>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-800 p-8 transition-colors">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Admins review all submissions to ensure quality and relevance.</span>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
