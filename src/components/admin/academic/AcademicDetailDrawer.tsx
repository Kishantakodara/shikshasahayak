// ============================================================
// SHIKSHA SAHAYAK OS: ACADEMIC DETAIL DRAWER
// Slide-out contextual panel for University, Branch, Semester, Subject, and Year
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Building2,
  Building,
  Calendar,
  Book,
  GraduationCap,
  Layers,
  FileText,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  BarChart2,
} from 'lucide-react';
import {
  UniversityAdminItem,
  BranchAdminItem,
  SemesterAdminItem,
  SubjectAdminItem,
  AcademicYearAdminItem,
  UnitCoverageItem,
} from '../../../types/academic-management';

export type DetailEntityType = 'university' | 'branch' | 'semester' | 'subject' | 'academic-year';

interface AcademicDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: DetailEntityType;
  data: any;
  onNavigateToTab?: (tab: string, filterParams?: any) => void;
  onEditEntity?: (data: any) => void;
  onDeleteEntity?: (id: string, hard?: boolean) => void;
}

export const AcademicDetailDrawer: React.FC<AcademicDetailDrawerProps> = ({
  isOpen,
  onClose,
  entityType,
  data,
  onNavigateToTab,
  onEditEntity,
}) => {
  if (!isOpen || !data) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'semesters' | 'subjects' | 'units' | 'materials' | 'coverage' | 'settings'>('overview');

  // Status Badge Renderer
  const renderStatusBadge = (status: string, isActive?: boolean) => {
    const isAct = isActive !== undefined ? isActive : status?.toLowerCase() === 'active';
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 border ${
          isAct
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        {status || (isAct ? 'Active' : 'Inactive')}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-[#0F172A] border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 animate-slide-left font-sans">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/60">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                {entityType.replace('-', ' ')}
              </span>
              {renderStatusBadge(data.status, data.isActive)}
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight font-display truncate">
              {data.name || data.year || data.title}
            </h3>

            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
              {entityType === 'university' && `Code: ${data.shortName || data.id} • ${data.state}, ${data.country}`}
              {entityType === 'branch' && `Code: ${data.code || data.shortName} • ${data.universityName || 'GTU'}`}
              {entityType === 'semester' && `Semester ${data.semesterNumber || data.order} • ${data.branchName}`}
              {entityType === 'subject' && `Code: ${data.code || 'N/A'} • Sem ${data.semester} • ${data.branchName}`}
              {entityType === 'academic-year' && `Session: ${data.year} (${data.startDate} to ${data.endDate})`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 overflow-x-auto scrollbar-none bg-slate-900/30">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-orange-400 border-orange-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Overview
          </button>

          {entityType === 'university' && (
            <button
              onClick={() => setActiveTab('branches')}
              className={`pb-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === 'branches'
                  ? 'text-orange-400 border-orange-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Branches ({data.totalBranches || 0})
            </button>
          )}

          {entityType === 'branch' && (
            <button
              onClick={() => setActiveTab('subjects')}
              className={`pb-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === 'subjects'
                  ? 'text-orange-400 border-orange-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Subjects ({data.totalSubjects || 0})
            </button>
          )}

          {entityType === 'subject' && (
            <>
              <button
                onClick={() => setActiveTab('coverage')}
                className={`pb-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                  activeTab === 'coverage'
                    ? 'text-orange-400 border-orange-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Content Coverage
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`pb-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                  activeTab === 'materials'
                    ? 'text-orange-400 border-orange-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Study Materials & PYQs
              </button>
            </>
          )}
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                {entityType === 'university' && (
                  <>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Branches</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.totalBranches || 0}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Subjects</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.totalSubjects || 0}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Active Students</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.totalStudents || 0}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Calendar</span>
                      <p className="text-xs font-bold text-slate-300 mt-1.5">2026-27 Active</p>
                    </div>
                  </>
                )}

                {entityType === 'branch' && (
                  <>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Semesters</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.totalSemesters || 8}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Subjects</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.totalSubjects || 0}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Students</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.totalStudents || 0}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">University</span>
                      <p className="text-xs font-bold text-slate-300 mt-1.5">{data.universityShort || 'GTU'}</p>
                    </div>
                  </>
                )}

                {entityType === 'subject' && (
                  <>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Semester</span>
                      <p className="text-xl font-extrabold text-white mt-1">Sem {data.semester}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Credits</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.credits || 4}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Study Materials</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.materialsCount || 0}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">PYQs & Papers</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.pyqsCount || 0}</p>
                    </div>
                  </>
                )}

                {entityType === 'academic-year' && (
                  <>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Universities</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.universitiesCount || 3}</p>
                    </div>
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Branches</span>
                      <p className="text-xl font-extrabold text-white mt-1">{data.branchesCount || 12}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Hierarchy Context Info */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Academic Placement</h4>
                <div className="text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>University:</span>
                    <span className="text-white font-bold">{data.universityName || data.universityShort || 'GTU'}</span>
                  </div>
                  {data.branchName && (
                    <div className="flex items-center justify-between">
                      <span>Branch:</span>
                      <span className="text-white font-bold">{data.branchName}</span>
                    </div>
                  )}
                  {data.semester !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Semester:</span>
                      <span className="text-white font-bold">Semester {data.semester}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Academic Year:</span>
                    <span className="text-white font-bold">{data.academicYear || data.year || '2026-27'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Navigation Buttons */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Navigation</h4>

                {entityType === 'university' && onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('branches', { university: data.id })}
                    className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-400" />
                      Manage Branches for {data.shortName || data.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                {entityType === 'branch' && onNavigateToTab && (
                  <>
                    <button
                      onClick={() => onNavigateToTab('semesters', { university: data.universityId, branch: data.id })}
                      className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        Manage Semesters
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => onNavigateToTab('subjects', { university: data.universityId, branch: data.id })}
                      className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                    >
                      <span className="flex items-center gap-2">
                        <Book className="w-4 h-4 text-orange-400" />
                        Manage Subjects Catalog
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </>
                )}

                {entityType === 'semester' && onNavigateToTab && (
                  <button
                    onClick={() =>
                      onNavigateToTab('subjects', {
                        university: data.universityId,
                        branch: data.branchId,
                        semester: String(data.semesterNumber || data.order),
                      })
                    }
                    className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Book className="w-4 h-4 text-orange-400" />
                      View Semester Subjects
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                {entityType === 'subject' && onNavigateToTab && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => onNavigateToTab('cms')}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        Open Curriculum
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => onNavigateToTab('content-factory')}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Generate AI Content
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => onNavigateToTab('study-material')}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        Study Materials
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => onNavigateToTab('pyqs')}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between transition border border-slate-700/60"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        PYQs & Papers
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CONTENT COVERAGE (for Subject) */}
          {activeTab === 'coverage' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">Catalog Content Coverage</span>
                  <span className="text-sm font-extrabold text-orange-400 font-mono">
                    {data.contentCoverage || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.contentCoverage || 0}%` }}
                  />
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit-Wise Breakdown</h4>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((uNo) => {
                  const pct = uNo === 1 ? 82 : uNo === 2 ? 64 : uNo === 3 ? 20 : 0;
                  return (
                    <div
                      key={uNo}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">Unit {uNo}</span>
                        <p className="text-[10px] text-slate-400">Core Subject Module {uNo}</p>
                      </div>
                      <span className={`font-mono font-bold ${pct > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: STUDY MATERIALS & PYQS */}
          {activeTab === 'materials' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Resources</h4>
                <span className="text-xs font-bold text-orange-400">
                  {(data.materialsCount || 0) + (data.pyqsCount || 0)} Total
                </span>
              </div>

              {data.materialsCount === 0 && data.pyqsCount === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-500">
                  No materials cataloged for this subject yet.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-white font-medium">Lecture Notes & Smart Guides</span>
                    <span className="font-bold text-emerald-400 font-mono">{data.materialsCount || 0} files</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-white font-medium">Previous Year Question Papers</span>
                    <span className="font-bold text-cyan-400 font-mono">{data.pyqsCount || 0} papers</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-2.5">
          {onEditEntity && (
            <button
              onClick={() => onEditEntity(data)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Edit {entityType}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
