import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  FileText, 
  ArrowRight, 
  Layers, 
  Filter, 
  Loader2
} from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { apiClient } from '../../api/client';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../../utils/branchUtils';

interface SubjectEntry {
  code: string;
  name: string;
  slug: string;
  credits: number;
  notesCount: number;
  pyqsCount: number;
}

export const StudyPage: React.FC = () => {
  const { academicProfile } = useStudentAcademic();

  const [selectedSemester, setSelectedSemester] = useState<number>(academicProfile?.semester || 5);
  const [filterQuery, setFilterQuery] = useState('');
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const branchSlug = getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName);
  const branchName = getCanonicalBranchName(academicProfile?.branchName || academicProfile?.branchId);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    apiClient
      .getSemesterSubjects(branchSlug, selectedSemester, 'study-material')
      .then((res) => {
        if (isCancelled) return;
        if (res && res.subjects && res.subjects.length > 0) {
          const mapped: SubjectEntry[] = res.subjects.map((sub: any) => ({
            code: sub.subject_code || sub.code || '',
            name: sub.subject_name || sub.name || '',
            slug: sub.subject_slug || sub.code?.toLowerCase() || '',
            credits: 4,
            notesCount: sub.material_count || 0,
            pyqsCount: sub.session_count || 0
          }));
          setSubjects(mapped);
        } else {
          setSubjects([]);
        }
      })
      .catch(() => {
        if (!isCancelled) setSubjects([]);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [branchSlug, selectedSemester]);

  const filteredSubjects = subjects.filter((s) => 
    s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <BrowseShell
      crumbs={[{ label: 'Study Hub' }]}
      eyebrow="Academic Curriculum"
      title="Semester Study Workspace"
      description={`Organized units, lecture notes, formula sheets, and practice sets for ${branchName}.`}
    >
      {/* Top Semester Switcher */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316]">Active Department</span>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
              {branchName} • Semester {selectedSemester}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedSemester === sem
                    ? 'bg-[#F97316] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                S{sem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Subjects List */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs mb-8">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">
            Semester {selectedSemester} Courses ({filteredSubjects.length})
          </span>
          <span className="text-[11px] text-[#64748B]">Updated for 2026 Curriculum</span>
        </div>

        <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
          {loading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin text-[#F97316]" />
              <span>Loading semester subjects...</span>
            </div>
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subj) => (
              <div 
                key={subj.code || subj.slug} 
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Subject Title & Code */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/resources/study-material/${branchSlug}/semester/${selectedSemester}/${subj.slug || subj.code}`}
                      className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white hover:text-[#F97316] transition-colors"
                    >
                      {subj.name}
                    </Link>
                    {subj.code && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {subj.code}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                  <Link
                    to={`/resources/study-material/${branchSlug}/semester/${selectedSemester}/${subj.slug || subj.code}`}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Notes ({subj.notesCount})</span>
                  </Link>

                  <Link
                    to={`/resources/syllabus/${branchSlug}/semester/${selectedSemester}/${subj.slug || subj.code}`}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Syllabus</span>
                  </Link>

                  <Link
                    to={`/resources/study-material/${branchSlug}/semester/${selectedSemester}/${subj.slug || subj.code}`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] hover:bg-slate-800 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-xs text-[#64748B]">
              No subjects found for {branchName} Semester {selectedSemester}.
            </div>
          )}
        </div>
      </div>
    </BrowseShell>
  );
};

export default StudyPage;
