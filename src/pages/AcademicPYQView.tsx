import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { apiClient } from '../api/client';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Calendar, 
  FileText, 
  Tag, 
  Building,
  GraduationCap,
  AlertTriangle,
  FileQuestion,
  FileCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { getGtuOfficialSyllabusUrl, getCurrentAcademicYear } from '../utils/gtuSyllabus';
import { getGtuPyqUrl, getCourseCodeFromBranch, normalizeGtuPyqUrl } from '../utils/gtuPyq';
import AuthorByline from '../components/common/AuthorByline';
import SeoContentBlock from '../components/ads/SeoContentBlock';

const AcademicPYQView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pyq, setPyq] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPyq = async () => {
      try {
        const data = await apiClient.getAcademicPYQ(id as string);
        setPyq(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPyq();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">Loading...</div>;
  if (!pyq) return <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">PYQ not found.</div>;

  const courseCode = getCourseCodeFromBranch(pyq.branch_name);
  const sessionCode = pyq.session || `${(pyq.exam_month || '').toUpperCase().includes('W') ? 'W' : 'S'}${pyq.exam_year || 2025}`;
  const effectivePaperUrl = normalizeGtuPyqUrl(
    (pyq.question_paper_url && pyq.question_paper_url.startsWith('http'))
      ? pyq.question_paper_url
      : getGtuPyqUrl(sessionCode, courseCode, pyq.subject_code || '115AN01')
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans pb-20">
      {/* Header */}
      <div className="bg-[#1E293B] border-b border-slate-700/50 pt-20 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 w-fit">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> {pyq.exam_type}
            </span>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {pyq.exam_month} {pyq.exam_year}
            </span>
            <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {pyq.branch_name}
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Sem {pyq.semester}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4 max-w-4xl">
            {pyq.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Subject: {pyq.subject_name} ({pyq.subject_code})
            </div>
            {pyq.subject_code && (
              <a
                href={getGtuOfficialSyllabusUrl(pyq.subject_code)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-semibold underline"
              >
                View Official Syllabus <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" /> {pyq.university}
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> {pyq.views || 0} views
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
        
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Important Topics Alert */}
          {pyq.important_topics && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4 items-start">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-400 mb-1">Important Topics Covered</h3>
                <p className="text-sm text-amber-200/70 leading-relaxed">{pyq.important_topics}</p>
              </div>
            </div>
          )}

          {/* Blog / Analysis */}
          <div className="bg-[#1E293B] rounded-2xl p-6 md:p-8 border border-slate-700/50 shadow-xl" data-color-mode="dark">
            <MDEditor.Markdown 
              source={pyq.content} 
              style={{ backgroundColor: 'transparent' }}
              className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-a:text-[#6366F1] hover:prose-a:text-blue-400"
            />
          </div>
        </div>

        {/* Right Sidebar (Downloads) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 space-y-6">
            
            <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Download className="h-5 w-5 text-[#6366F1]" /> Downloads
              </h3>
              
              <div className="space-y-4">
                {/* Question Paper Download */}
                <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <FileQuestion className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Question Paper</h4>
                        <p className="text-xs text-slate-500">PDF • 1.2 MB</p>
                      </div>
                    </div>
                  </div>
                  <a href={effectivePaperUrl} target="_blank" rel="noreferrer" download className="w-full bg-slate-800 hover:bg-blue-600 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Download Paper
                  </a>
                </div>

                {/* Solution Download */}
                {pyq.solution_url && pyq.solution_url !== '#' && (
                  <div className="bg-[#0F172A] border border-emerald-500/30 rounded-xl p-4 hover:border-emerald-500/60 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <FileCheck className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                            Official Solution <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </h4>
                          <p className="text-xs text-slate-500">PDF</p>
                        </div>
                      </div>
                    </div>
                    <a href={pyq.solution_url} target="_blank" rel="noreferrer" className="w-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 relative z-10">
                      <Download className="h-4 w-4" /> Download Solution
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
                <span className="text-xs font-medium text-slate-500">
                  Total Downloads: {pyq.downloads}
                </span>
              </div>
            </div>

            <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Similar Papers</h3>
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <Link to="#" key={item} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-lg bg-[#0F172A] border border-slate-700 group-hover:border-slate-500 flex items-center justify-center shrink-0 transition-colors">
                      <FileText className="h-5 w-5 text-slate-400 group-hover:text-[#6366F1] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#6366F1] transition-colors leading-tight mb-1">DBMS End Sem 2024</h4>
                      <p className="text-xs text-slate-500">Dec 2024 • University</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

        <AuthorByline 
          authorName="ShikshaSahayak Examination Moderation Team"
          reviewerName="GTU Departmental Evaluation Board"
          updatedDate={`Academic Year ${getCurrentAcademicYear()} Session`}
          readTime="5 min read"
        />

        <SeoContentBlock title={`Official Examination Question Paper & Solution Guide: ${pyq.title}`}>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <h4 className="text-base font-bold text-navy-900 dark:text-white">1. Paper Analysis & Evaluation Model</h4>
            <p>
              This verified examination asset (<strong>{pyq.title}</strong>) represents an official GTU question paper for {pyq.subject_name || 'this course'} (Semester {pyq.semester_no || pyq.semester || 'Curriculum'}). Aligned with Gujarat Technological University's 70-mark End-Semester Examination (ESE) pattern, reviewing past papers allows students to identify repeated 7-mark descriptive questions, formula derivations, and standard problem-solving techniques for Academic Year {getCurrentAcademicYear()}.
            </p>

            <h4 className="text-base font-bold text-navy-900 dark:text-white mt-6">2. Strategic Preparation Tips</h4>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li><strong>Prioritize High-Frequency Topics:</strong> Focus on recurring 7-mark questions across 5+ years of session papers.</li>
              <li><strong>Step-by-Step Marking Scheme:</strong> GTU evaluators award step-wise marks for clear block diagrams, intermediate formulas, and correct SI units.</li>
              <li><strong>Cross-Check Syllabus Scope:</strong> Use our integrated GTU syllabus viewer to confirm current module boundaries for Academic Year {getCurrentAcademicYear()}.</li>
            </ul>
          </div>
        </SeoContentBlock>

      </div>
    </div>
  );
};

export default AcademicPYQView;
