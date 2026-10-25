import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  FileText, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { apiClient } from '../../api/client';

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  slug: string;
  semester: number;
  progress: number;
  units: string;
  materialCount?: number;
  pyqCount?: number;
}

export const MySubjectsPage: React.FC = () => {
  const { academicProfile } = useStudentAcademic();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);

  const branchName = academicProfile?.branchName || 'Computer Engineering';
  const semesterNum = academicProfile?.semester || 3;
  const branchSlug = (academicProfile as any)?.branchSlug || academicProfile?.branchId || 'computer-engineering';

  const loadSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getStudentDashboard();
      if (res?.success && res.data?.subjects) {
        setSubjects(res.data.subjects);
      } else {
        setSubjects([]);
      }
    } catch (err: any) {
      console.error('Failed to load enrolled subjects:', err);
      setError(err?.message || 'Could not load curriculum courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [academicProfile]);

  return (
    <BrowseShell
      crumbs={[{ label: 'My Subjects' }]}
      eyebrow="Curriculum Roster"
      title="My Subjects"
      description={`Active semester ${semesterNum} curriculum for ${branchName}. Track syllabus coverage and jump directly into study units.`}
    >
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs mb-8">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">Enrolled Semester Courses</span>
          <span className="text-[11px] text-[#64748B]">{subjects.length} Active Subjects</span>
        </div>

        {loading && (
          <div className="p-10 text-center flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Loading enrolled courses from university database...
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-xs font-semibold text-red-800 dark:text-red-300">{error}</span>
            </div>
            <button
              onClick={loadSubjects}
              className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {subjects.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">No courses found</p>
                <p className="text-xs">No active subjects registered for Semester {semesterNum} under {branchName}.</p>
              </div>
            ) : (
              subjects.map((subj) => (
                <div
                  key={subj.code || subj.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/student/subject/${subj.code || subj.slug}`}
                        className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white hover:text-[#F97316] transition-colors"
                      >
                        {subj.name}
                      </Link>
                      {subj.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {subj.code}
                        </span>
                      )}
                      <span className="text-[10px] text-[#64748B]">Semester {subj.semester || semesterNum}</span>
                    </div>

                    <div className="mt-2 max-w-sm">
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                        <span>{subj.units || '7 Units syllabus'}</span>
                        <span className="font-bold text-[#0F172A] dark:text-white">{subj.progress || 60}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            (subj.progress || 60) >= 70 ? 'bg-emerald-500' : 'bg-[#F97316]'
                          }`}
                          style={{ width: `${subj.progress || 60}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                    <Link
                      to={`/student/subject/${subj.code || subj.slug}`}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Study Notes ({subj.materialCount || 0})</span>
                    </Link>

                    <Link
                      to="/student/practice"
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Practice MCQs</span>
                    </Link>

                    <Link
                      to="/resources/pyq"
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-600 dark:text-purple-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PYQs ({subj.pyqCount || 0})</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </BrowseShell>
  );
};

export default MySubjectsPage;
