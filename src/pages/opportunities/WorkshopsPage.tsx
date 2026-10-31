import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Share2, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { WorkshopDTO } from '@/types';
import { fetchWithAuth } from '../../api/client';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

export const WorkshopsPage: React.FC = () => {
  const [workshops, setWorkshops] = useState<WorkshopDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  // Load registered workshops from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shiksha_registered_workshops');
      if (stored) setRegisteredIds(JSON.parse(stored));
    } catch {}
  }, []);

  const fetchWorkshops = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      const res = await fetchWithAuth(`/api/workshops?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load workshops');
      const data = await res.json() as { success: boolean; workshops: WorkshopDTO[]; registeredWorkshopIds?: string[] };
      if (data.success) {
        setWorkshops(data.workshops || []);
        if (data.registeredWorkshopIds && data.registeredWorkshopIds.length > 0) {
          setRegisteredIds(prev => Array.from(new Set([...prev, ...(data.registeredWorkshopIds || [])])));
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load workshops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, [selectedCategory]);

  const handleRegister = async (workshopId: string) => {
    if (registeredIds.includes(workshopId)) return;
    setRegisteringId(workshopId);
    try {
      const res = await fetchWithAuth('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId })
      });
      const data = await res.json() as any;
      if (data.success) {
        const updated = Array.from(new Set([...registeredIds, workshopId]));
        setRegisteredIds(updated);
        try {
          localStorage.setItem('shiksha_registered_workshops', JSON.stringify(updated));
        } catch {}

        // Update local participant count if new registration
        if (data.isNewRegistration !== false) {
          setWorkshops(prev => prev.map(w => w.id === workshopId ? { ...w, currentParticipants: w.currentParticipants + 1 } : w));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegisteringId(null);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Opportunities' },
          { label: 'Workshops & Webinars' }
        ]}
        fallbackPath="/student"
      />

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 border border-navy-800 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Live Engineering Masterclasses
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Workshops & <span className="text-brand-orange">Technical Webinars</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Learn directly from seasoned industry engineers, research mentors, and placement toppers. Deep-dive into edge systems, robotics, and high-stakes coding interviews.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white dark:bg-navy-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Track:</span>
        {['all', 'AI & Cloud', 'Robotics & IoT', 'Career Strategy', 'Core Engineering'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat
                ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-sm'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {cat === 'all' ? 'All Masterclasses' : cat}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl h-72" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-2xl text-red-700">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : workshops.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-navy-900 border border-dashed border-slate-200 rounded-3xl space-y-3">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold">No Upcoming Workshops</h3>
          <p className="text-xs text-slate-500">Check back soon for upcoming masterclasses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops.map((item) => {
            const isRegistered = registeredIds.includes(item.id);
            const fillRatio = Math.min(100, Math.round((item.currentParticipants / Math.max(1, item.maxParticipants)) * 100));

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Category and Mode Badges */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-brand-orange text-xs font-bold">
                      {item.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${
                      item.isOnline
                        ? 'bg-blue-50 dark:bg-navy-800 text-blue-700 dark:text-blue-300'
                        : 'bg-emerald-50 dark:bg-navy-800 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {item.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {item.isOnline ? 'Online Stream' : 'On-Campus'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-navy-950 dark:text-white line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Speaker Info */}
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-100 dark:border-navy-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {item.speakerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-navy-950 dark:text-white truncate">
                        {item.speakerName}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.speakerCompanyOrInstitution}
                      </p>
                    </div>
                  </div>

                  {/* Schedule & Venue */}
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-orange" />
                      <span>{formatDateTime(item.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{item.venueOrUrl}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Seats: {item.currentParticipants} / {item.maxParticipants}</span>
                      <span>{fillRatio}% Booked</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-orange" style={{ width: `${fillRatio}%` }} />
                    </div>
                  </div>
                </div>

                {/* RSVP Action */}
                <div className="pt-2">
                  {isRegistered ? (
                    <div className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Participation Confirmed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(item.id)}
                      disabled={registeringId === item.id}
                      className="w-full py-2.5 px-4 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      {registeringId === item.id ? 'Reserving...' : 'RSVP / Reserve Free Seat'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkshopsPage;
