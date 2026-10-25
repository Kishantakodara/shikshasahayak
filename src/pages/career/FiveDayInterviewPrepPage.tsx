import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Award, 
  BookOpen, 
  Code, 
  BrainCircuit, 
  MessageSquare, 
  Calculator, 
  ChevronRight,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePageMeta } from '../../utils/seo';
import { fetchWithAuth } from '../../api/client';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

interface DayTask {
  id: string;
  title: string;
  category: 'core' | 'coding' | 'aptitude' | 'system-design' | 'behavioral';
  estimatedMinutes: number;
  description: string;
  actionUrl?: string;
  isCompleted?: boolean;
}

interface InterviewDayModule {
  dayNumber: number;
  title: string;
  theme: string;
  summary: string;
  badge: string;
  tasks: DayTask[];
  completedCount?: number;
  isDayFullyCompleted?: boolean;
}

export const FiveDayInterviewPrepPage: React.FC = () => {
  usePageMeta({
    title: '5-Day Engineering Interview Preparation Program | ShikshaSahayak',
    description: 'Structured 5-day placement readiness bootcamp for engineering students: Resume, Core CS, DSA, System Design, Aptitude, and Mock Technical Interviews.',
    keywords: 'interview preparation, campus placements, GTU placements, 5-day interview prep, technical interview questions, aptitude practice',
  });

  const { currentUser } = useAuth();
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<InterviewDayModule[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/career/interview-prep');
      const data = (await res.json()) as any;
      if (data?.success && data?.program) {
        setProgram(data.program);
        setProgressPercentage(data.progressPercentage || 0);
      }
    } catch (err) {
      console.error('Failed to load interview prep program:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgram();
  }, [currentUser]);

  const handleToggleTask = async (dayNumber: number, taskId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setProgram((prev) =>
      prev.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const updatedTasks = day.tasks.map((t) =>
          t.id === taskId ? { ...t, isCompleted: !currentStatus } : t
        );
        const completedCount = updatedTasks.filter((t) => t.isCompleted).length;
        return {
          ...day,
          tasks: updatedTasks,
          completedCount,
          isDayFullyCompleted: completedCount === updatedTasks.length,
        };
      })
    );

    try {
      await fetchWithAuth('/api/career/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber,
          taskId,
          isCompleted: !currentStatus,
        }),
      });
    } catch (err) {
      console.error('Error updating task progress:', err);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'core':
        return { label: 'Core CS', icon: BrainCircuit, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'coding':
        return { label: 'Coding / DSA', icon: Code, color: 'bg-orange-500/10 text-[#F97316] border-orange-500/20' };
      case 'system-design':
        return { label: 'System Design', icon: LayersIcon, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      case 'aptitude':
        return { label: 'Aptitude & Logic', icon: Calculator, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'behavioral':
        return { label: 'Behavioral & STAR', icon: MessageSquare, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      default:
        return { label: 'Task', icon: BookOpen, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const selectedDayModule = program.find((d) => d.dayNumber === activeDay);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans text-[#0F172A] dark:text-slate-100">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Career', path: '/student/career' },
          { label: '5-Day Interview Prep' }
        ]}
        fallbackPath="/student"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#090D1A] text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 text-[#F97316] border border-orange-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Placement Roadmap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              5-Day Engineering Interview Preparation Program
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              A high-impact structured curriculum designed for engineering campus placements. Master technical problem solving, system design, core CS, and behavioral interview simulations in 5 focused days.
            </p>
          </div>

          {/* Progress Card */}
          <div className="w-full sm:w-64 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Bootcamp Completion</span>
              <span className="text-[#F97316] font-extrabold">{progressPercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {progressPercentage === 100 ? '🎉 All 5 Days Completed!' : 'Keep going! 1 day at a time.'}
            </p>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {program.map((day) => {
          const isActive = day.dayNumber === activeDay;
          const isDone = day.isDayFullyCompleted;

          return (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                isActive
                  ? 'bg-orange-500/10 border-[#F97316] shadow-sm ring-1 ring-orange-500/30'
                  : 'bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-[#F97316]' : 'text-[#64748B]'}`}>
                  Day {day.dayNumber}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">
                    {day.completedCount || 0}/{day.tasks.length}
                  </span>
                )}
              </div>
              <h3 className={`text-xs font-bold line-clamp-2 ${isActive ? 'text-[#0F172A] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                {day.title}
              </h3>
            </button>
          );
        })}
      </div>

      {/* Active Day Detail Card */}
      {selectedDayModule && (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/10 text-[#F97316]">
                  {selectedDayModule.badge}
                </span>
                <span className="text-xs text-[#64748B] font-semibold">• {selectedDayModule.theme}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
                {selectedDayModule.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                {selectedDayModule.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">
                {selectedDayModule.completedCount || 0} of {selectedDayModule.tasks.length} Tasks Done
              </span>
            </div>
          </div>

          {/* Task Checklist */}
          <div className="space-y-4">
            {selectedDayModule.tasks.map((task) => {
              const badge = getCategoryBadge(task.category);
              const BadgeIcon = badge.icon;
              const isChecked = Boolean(task.isCompleted);

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(selectedDayModule.dayNumber, task.id, isChecked)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 hover:border-[#F97316]'
                      }`}
                      aria-label={`Toggle completion of ${task.title}`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>~{task.estimatedMinutes} mins</span>
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-[#0F172A] dark:text-white'}`}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {task.actionUrl && (
                    <Link
                      to={task.actionUrl}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#F97316] bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Trophy Card */}
      {progressPercentage === 100 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1 text-left">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                5-Day Placement Program Completed!
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                You have systematically prepared across Core CS, DSA, System Design, Aptitude, and Mock Behavioral interviews.
              </p>
            </div>
          </div>
          <Link
            to="/career/jobs"
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 shrink-0"
          >
            <span>Explore Engineering Jobs & Internships</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

export default FiveDayInterviewPrepPage;
