import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  FileText, 
  Target, 
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import { apiClient } from '../../api/client';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: string;
  subjectName?: string;
  daysRemaining?: number;
  status: string;
  totalMarks?: number;
  link?: string;
}

export const AcademicTimelinePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getStudentTimeline();
      if (res?.success && Array.isArray(res.timeline)) {
        setEvents(res.timeline);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      console.error('Failed to load timeline:', err);
      setError(err?.message || 'Failed to load academic schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const getBadgeColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'EXAM':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800';
      case 'ASSIGNMENT':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'VIVA':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <BrowseShell
      crumbs={[{ label: 'Academic Timeline' }]}
      eyebrow="Milestones & Schedules"
      title="Your Academic Timeline"
      description="Linear chronological roadmap of GTU university exams, college internals, and homework deadlines."
    >
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 shadow-2xs mb-8">
        
        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Synchronizing university academic calendar...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-300">{error}</span>
            </div>
            <button
              onClick={fetchTimeline}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Timeline Stream */}
        {!loading && (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] dark:before:bg-slate-800">
            {events.length === 0 ? (
              <div className="p-8 text-center text-[#64748B]">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">All Milestones Synchronized</h4>
                <p className="text-xs">No active exam or assignment deadlines found for the current period.</p>
              </div>
            ) : (
              events.map((evt, idx) => {
                const isFirst = idx === 0;
                return (
                  <div key={evt.id || idx} className="relative">
                    {/* Timeline Bullet */}
                    <div className={`absolute -left-6 sm:-left-8 top-1 w-3.5 h-3.5 rounded-full ring-4 ${
                      isFirst
                        ? 'bg-[#F97316] ring-orange-100 dark:ring-orange-950'
                        : 'bg-slate-400 dark:bg-slate-600 ring-slate-100 dark:ring-slate-900'
                    }`} />

                    {/* Event Card */}
                    <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800/80 rounded-2xl p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className={`text-[11px] font-black uppercase tracking-wider ${
                          isFirst ? 'text-[#F97316]' : 'text-[#64748B]'
                        }`}>
                          {evt.date ? evt.date.split('T')[0] : 'Upcoming'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getBadgeColor(evt.category)}`}>
                          {evt.category}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                        {evt.subjectName && <strong className="font-semibold text-slate-700 dark:text-slate-300">{evt.subjectName} • </strong>}
                        {evt.daysRemaining !== undefined ? (
                          evt.daysRemaining >= 0 
                            ? `${evt.daysRemaining} days remaining until scheduled time.`
                            : `Deadline was ${Math.abs(evt.daysRemaining)} days ago.`
                        ) : 'Official date confirmed on university syllabus.'}
                      </p>

                      {evt.link && (
                        <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
                          <Link
                            to={evt.link}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#F97316] text-xs font-semibold text-[#0F172A] dark:text-white flex items-center justify-between transition-colors group"
                          >
                            <span>Open Related Workspace</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F97316] group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </BrowseShell>
  );
};

export default AcademicTimelinePage;
