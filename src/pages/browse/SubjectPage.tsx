import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { 
  Loader2, 
  ExternalLink, 
  Download, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  ScrollText, 
  CheckCircle2, 
  Sparkles,
  Award,
  Layers,
  UploadCloud
} from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import { apiClient } from '../../api/client';
import { BrowseSubjectDetail } from '../../types';
import { isMaterialType, normalizeMaterialType, MATERIAL_TYPES, MaterialTypeKey } from '../../content/browse';
import { browsePaths } from '../../utils/browsePaths';
import { getGtuOfficialSyllabusUrl, getAcademicYearSyllabusLabel, isValidSubjectCode } from '../../utils/gtuSyllabus';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../../utils/branchUtils';
import AdBlock from '../../components/ads/AdBlock';
import SeoContentBlock from '../../components/ads/SeoContentBlock';

export const SubjectPage: React.FC = () => {
  const { type = 'study-material', branchSlug, sem, subjectSlug } = useParams<{
    type: string;
    branchSlug: string;
    sem: string;
    subjectSlug: string;
  }>();

  const semester = sem === '1-or-2-common' ? 0 : Number(sem);
  const canonicalBranchSlug = branchSlug ? getCanonicalBranchSlug(branchSlug) : '';
  const materialTypeKey: MaterialTypeKey = normalizeMaterialType(type);
  const config = MATERIAL_TYPES[materialTypeKey];
  const validType = Boolean(config);
  const validParams = validType && Boolean(branchSlug) && Boolean(subjectSlug) && Number.isFinite(semester) && semester >= 0;

  const normalizedSubjectSlug = subjectSlug ? subjectSlug.toLowerCase() : '';

  // Auto-redirect alias URLs (e.g., gtu_be_016 or gtu-be-16) or uppercase subject codes to canonical slug
  if (
    branchSlug &&
    canonicalBranchSlug &&
    validType &&
    subjectSlug &&
    Number.isFinite(semester) &&
    (branchSlug !== canonicalBranchSlug || subjectSlug !== normalizedSubjectSlug)
  ) {
    return <Navigate to={browsePaths.subject(materialTypeKey, canonicalBranchSlug, semester, normalizedSubjectSlug)} replace />;
  }

  if (!validParams || !config || !branchSlug || !subjectSlug) {
    return <Navigate to="/resources" replace />;
  }

  const [data, setData] = useState<BrowseSubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: Syllabus | Study Material | PYQs | Practice
  const [activeTab, setActiveTab] = useState<'syllabus' | 'materials' | 'pyqs' | 'practice'>(() => {
    if (materialTypeKey === 'syllabus') return 'syllabus';
    if (materialTypeKey === 'pyq') return 'pyqs';
    return 'materials';
  });

  useEffect(() => {
    if (!validParams || !canonicalBranchSlug || !subjectSlug) return;
    setLoading(true);
    apiClient
      .getSubjectBrowse(canonicalBranchSlug, semester, subjectSlug, materialTypeKey)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Subject information could not be loaded');
      })
      .finally(() => setLoading(false));
  }, [canonicalBranchSlug, semester, subjectSlug, materialTypeKey, validParams]);

  const offering = data?.offering;
  const branchName = data?.branch?.name || getCanonicalBranchName(canonicalBranchSlug);

  const effectiveSubjectCode = offering?.subject_code && isValidSubjectCode(offering.subject_code)
    ? offering.subject_code
    : (isValidSubjectCode(subjectSlug) ? subjectSlug.toUpperCase() : (offering?.subject_code || ''));

  const subjectTitle = offering?.subject_name || (subjectSlug ? subjectSlug.replace(/[-_]/g, ' ').toUpperCase() : 'Subject');

  const syllabusMeta = getAcademicYearSyllabusLabel(effectiveSubjectCode, [], semester);
  const gtuPdfUrl = effectiveSubjectCode ? getGtuOfficialSyllabusUrl(effectiveSubjectCode) : null;
  const materialsList = data?.materials_without_session || [];
  const sessionsList = data?.sessions || [];

  return (
    <BrowseShell
      crumbs={[
        { label: 'Resources', to: '/resources' },
        { label: branchName, to: browsePaths.branch(materialTypeKey, canonicalBranchSlug) },
        { label: semester === 0 ? '1st Year Common' : `Semester ${semester}`, to: browsePaths.semester(materialTypeKey, canonicalBranchSlug, semester) },
        { label: subjectTitle },
      ]}
      eyebrow={effectiveSubjectCode ? `Subject Code: ${effectiveSubjectCode}` : 'GTU Curriculum Scheme'}
      title={subjectTitle}
      description={`Semester ${semester} • ${branchName} • Gujarat Technological University`}
    >
      {/* SUBJECT HEADER SUMMARY */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#F97316] uppercase tracking-wider">
                Official GTU Curriculum
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {syllabusMeta.badgeLabel}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
              {subjectTitle}
            </h2>
            <p className="text-xs text-[#64748B]">
              Semester {semester} • {branchName} • Code: <span className="font-mono font-bold text-[#0F172A] dark:text-white">{effectiveSubjectCode || 'In Catalog'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {gtuPdfUrl && (
              <a
                href={gtuPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white flex items-center gap-2 transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Official Syllabus PDF</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">University</span>
            <span className="font-extrabold text-[#0F172A] dark:text-white">GTU Ahmedabad</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Branch</span>
            <span className="font-extrabold text-[#0F172A] dark:text-white truncate block">{branchName}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Active Academic Year</span>
            <span className="font-extrabold text-[#0F172A] dark:text-white">{syllabusMeta.currentAcademicYear}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Curriculum Scheme</span>
            <span className="font-extrabold text-[#0F172A] dark:text-white">WEF {syllabusMeta.wefLabel}</span>
          </div>
        </div>
      </div>

      {/* FOUR TABS: Official Syllabus | Study Material | PYQs | Practice */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 mb-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'syllabus'
              ? 'text-[#F97316] border-b-2 border-[#F97316]'
              : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Official Syllabus</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'materials'
              ? 'text-[#F97316] border-b-2 border-[#F97316]'
              : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Study Material ({materialsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pyqs')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'pyqs'
              ? 'text-[#F97316] border-b-2 border-[#F97316]'
              : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Question Papers ({sessionsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'practice'
              ? 'text-[#F97316] border-b-2 border-[#F97316]'
              : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>MCQ Practice & Tests</span>
        </button>
      </div>

      {/* TAB 1: OFFICIAL SYLLABUS SCHEME */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6 mb-8">
          {/* Official Download & Verified Card */}
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-orange-500/10 text-[#F97316] shrink-0 mt-0.5">
                  <ScrollText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                      Official GTU Syllabus Specification
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Circular</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Direct syllabus document issued by Gujarat Technological University for Subject Code <span className="font-mono font-bold text-[#0F172A] dark:text-white">{effectiveSubjectCode || 'BE Curriculum'}</span>.
                  </p>
                </div>
              </div>

              {gtuPdfUrl && (
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <a
                    href={gtuPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold inline-flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>
              )}
            </div>

            {/* Teaching and Examination Scheme */}
            <div className="pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                Teaching & Examination Scheme (Marks Weightage)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-[#0F172A] dark:text-white mb-1">Theory Marks</div>
                  <div className="text-[11px] text-[#64748B] space-y-0.5">
                    <div>• End Semester Exam (ESE): <span className="font-bold text-[#0F172A] dark:text-white">70 Marks</span></div>
                    <div>• Progressive Assessment (PA/M): <span className="font-bold text-[#0F172A] dark:text-white">30 Marks</span></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-[#0F172A] dark:text-white mb-1">Practical & Lab Scheme</div>
                  <div className="text-[11px] text-[#64748B] space-y-0.5">
                    <div>• Practical Exam (ESE/V): <span className="font-bold text-[#0F172A] dark:text-white">20-30 Marks</span></div>
                    <div>• Continuous Evaluation (PA/I): <span className="font-bold text-[#0F172A] dark:text-white">20 Marks</span></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-[#0F172A] dark:text-white mb-1">Total Course Weightage</div>
                  <div className="text-[11px] text-[#64748B] space-y-0.5">
                    <div>• Total Marks: <span className="font-bold text-[#0F172A] dark:text-white">150 Marks</span></div>
                    <div>• Passing Requirement: <span className="font-bold text-[#0F172A] dark:text-white">Minimum 40%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Syllabus Files (if in database) */}
          {materialsList.length > 0 && (
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A] dark:text-white">Archived Syllabus Documents</span>
                <span className="text-[11px] text-[#64748B]">{materialsList.length} files available</span>
              </div>
              <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                {materialsList.map((m: any) => (
                  <div key={m.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white truncate">
                        {m.title || 'Official Syllabus Document'}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {m.original_filename || `${subjectTitle} Syllabus`} {m.version_label ? `• ${m.version_label}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.file_url ? (
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#F97316] text-white text-xs font-bold hover:bg-[#EA580C] transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      ) : (
                        <Link
                          to={`/materials/${m.id}`}
                          className="px-3 py-1.5 rounded-xl bg-[#F97316] text-white text-xs font-bold hover:bg-[#EA580C] transition-colors"
                        >
                          View Document
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDY MATERIAL */}
      {activeTab === 'materials' && (
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs mb-8">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] dark:text-white">Curated Subject Notes & Sheets</span>
            <span className="text-[11px] text-[#64748B]">{materialsList.length} verified notes</span>
          </div>

          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {materialsList.length > 0 ? (
              materialsList.map((m: any) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white truncate">
                      {m.title || 'Subject Lecture Notes'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {m.chapter ? `Chapter: ${m.chapter}` : ''} {m.unit_no ? `• Unit ${m.unit_no}` : ''} • Verified Academic Material
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/materials/${m.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#F97316] text-white text-xs font-bold hover:bg-[#EA580C] transition-colors"
                    >
                      Open Notes
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  No Handwritten Notes Uploaded Yet
                </h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Be the first to share your handwritten notes, formula sheets, or unit summaries for {subjectTitle}.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to="/contribute"
                    className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Contribute Notes</span>
                  </Link>
                  <Link
                    to={`/resources/study-material/${canonicalBranchSlug}/semester/${semester}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#0F172A] dark:text-white text-xs font-bold transition-colors"
                  >
                    Browse Semester
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PYQs LIST */}
      {activeTab === 'pyqs' && (
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs mb-8">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] dark:text-white">Official GTU Examination Question Papers</span>
            <span className="text-[11px] text-[#64748B]">{sessionsList.length} exam sessions</span>
          </div>

          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {sessionsList.length > 0 ? (
              sessionsList.map((s) => (
                <div key={s.session} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                      GTU Exam Session: {s.label || s.session}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Official examination question paper for Code {effectiveSubjectCode}
                    </p>
                  </div>
                  <Link
                    to={browsePaths.session('pyq', canonicalBranchSlug, semester, normalizedSubjectSlug, s.session)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                  >
                    View Paper
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Question Papers Being Digitized
                </h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Official GTU Winter and Summer question papers for Subject Code {effectiveSubjectCode || subjectTitle} are currently being indexed.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to="/resources/pyq"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Browse All PYQs</span>
                  </Link>
                  <Link
                    to="/contribute"
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#0F172A] dark:text-white text-xs font-bold transition-colors"
                  >
                    Upload Paper
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PRACTICE & MCQS */}
      {activeTab === 'practice' && (
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 shadow-2xs mb-8">
          <div className="max-w-xl">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Exam Readiness</span>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mt-1">
              Unit-wise Practice & Test Simulator
            </h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Prepare for GTU mid-semester exams and university theory finals with mock quizzes, question banks, and instant evaluation.
            </p>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <Link
                to="/practice/exam"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <span>Launch Practice Test</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/practice"
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#0F172A] dark:text-white hover:bg-slate-200 transition-colors"
              >
                Question Bank Hub
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SEO & Context Block */}
      <SeoContentBlock title={`GTU Academic Syllabus & Teaching Scheme: ${subjectTitle}`}>
        <p className="mb-2">
          This course specification for {subjectTitle} (Code: {effectiveSubjectCode || 'GTU'}) is part of the Semester {semester} engineering curriculum for {branchName} under the Gujarat Technological University teaching scheme.
        </p>
        <p>
          Students can download the official GTU circular PDF syllabus, review the evaluation scheme (70 marks ESE + 30 marks PA/M), access handwritten notes, and practice with archived university exam question papers.
        </p>
      </SeoContentBlock>

      <div className="mt-6">
        <AdBlock />
      </div>
    </BrowseShell>
  );
};

export default SubjectPage;
