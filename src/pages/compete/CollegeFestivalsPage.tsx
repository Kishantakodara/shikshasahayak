import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Coins, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { CollegeFestivalDTO, FestEventDTO } from '@/types';
import { fetchWithAuth } from '../../api/client';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

export const CollegeFestivalsPage: React.FC = () => {
  const [festivals, setFestivals] = useState<CollegeFestivalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFestival, setActiveFestival] = useState<CollegeFestivalDTO | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('shiksha_registered_fest_events');
      if (stored) setRegisteredEvents(JSON.parse(stored));
    } catch {}
  }, []);

  const fetchFestivals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.set('type', selectedType);

      const res = await fetchWithAuth(`/api/festivals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load festivals');
      const data = await res.json() as { success: boolean; festivals: CollegeFestivalDTO[]; registeredEventIds?: string[] };
      if (data.success) {
        setFestivals(data.festivals || []);
        if (data.registeredEventIds && data.registeredEventIds.length > 0) {
          setRegisteredEvents(prev => Array.from(new Set([...prev, ...(data.registeredEventIds || [])])));
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load college festivals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals();
  }, [selectedType]);

  const handleRegisterEvent = async (festId: string, eventId: string) => {
    setRegisteringEventId(eventId);
    try {
      const res = await fetchWithAuth('/api/festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalId: festId,
          eventId,
          teamName: teamName.trim() || 'Solo Engineering Innovator'
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        const updated = Array.from(new Set([...registeredEvents, eventId]));
        setRegisteredEvents(updated);
        try {
          localStorage.setItem('shiksha_registered_fest_events', JSON.stringify(updated));
        } catch {}
        setTeamName('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegisteringEventId(null);
    }
  };

  const filtered = festivals.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.collegeName.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Compete' },
          { label: 'College Festivals & Techfests' }
        ]}
        fallbackPath="/student"
      />

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 border border-navy-800 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wide">
            <Trophy className="w-3.5 h-3.5" /> GTU & National Engineering Events
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            College Techfests & <span className="text-brand-orange">Competitions</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Discover premier engineering symposiums, national robotics arenas, hackathons, and project expos across GTU colleges, NITs, and premier state institutes.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-navy-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by college name, fest title, or city (e.g. GTU, LDCE, Vadodara, MSU)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Category:</span>
          {['all', 'Technical', 'Symposium', 'Hackathon', 'Cultural'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedType === type
                  ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All Fests' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
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
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-navy-900 border border-dashed border-slate-200 rounded-3xl space-y-3">
          <Trophy className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold">No College Festivals Found</h3>
          <p className="text-xs text-slate-500">Try searching for other colleges or reset filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((fest) => (
            <div
              key={fest.id}
              onClick={() => setActiveFestival(fest)}
              className="group bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 hover:border-brand-orange/60 transition-all shadow-sm hover:shadow-md cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                  <img
                    src={fest.bannerUrl}
                    alt={fest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-navy-950/80 backdrop-blur-md text-white text-[11px] font-bold">
                      {fest.festType}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <span className="text-[11px] font-bold text-brand-orange uppercase tracking-wider block">
                    {fest.collegeName}
                  </span>
                  <h3 className="text-base font-bold text-navy-950 dark:text-white group-hover:text-brand-orange transition line-clamp-1">
                    {fest.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {fest.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-brand-orange" /> {fest.startDate} to {fest.endDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {fest.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => setActiveFestival(fest)}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-navy-800 group-hover:bg-brand-orange group-hover:text-white text-navy-900 dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  View Competitions & Events <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Events Modal */}
      {activeFestival && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveFestival(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 hover:text-navy-950 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-orange uppercase tracking-wider block">
                {activeFestival.collegeName}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white">
                {activeFestival.name}
              </h2>
              <p className="text-xs text-slate-500">
                {activeFestival.location} • {activeFestival.startDate} to {activeFestival.endDate}
              </p>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeFestival.description}
            </p>

            {/* List of sub-events */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Events & Competitions Under This Fest
              </h4>

              {activeFestival.events && activeFestival.events.length > 0 ? (
                activeFestival.events.map((ev) => {
                  const isRegistered = registeredEvents.includes(ev.id);

                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded-md bg-brand-orange/15 text-brand-orange text-[10px] font-bold">
                            {ev.category}
                          </span>
                          <h4 className="text-sm font-bold text-navy-950 dark:text-white mt-1">
                            {ev.title}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-emerald-600 block">
                            Prize: ₹{ev.prizePool.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ev.entryFee > 0 ? `Entry: ₹${ev.entryFee}` : 'Free Entry'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {ev.description}
                      </p>

                      <div className="pt-2 border-t border-slate-200/50 dark:border-navy-800 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400">
                          Team Size: {ev.minTeamSize}-{ev.maxTeamSize} Members
                        </span>

                        {isRegistered ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                          </span>
                        ) : (
                          <div className="flex gap-2 items-center">
                            {ev.maxTeamSize > 1 && (
                              <input
                                type="text"
                                placeholder="Team Name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 w-28"
                              />
                            )}
                            <button
                              onClick={() => handleRegisterEvent(activeFestival.id, ev.id)}
                              disabled={registeringEventId === ev.id}
                              className="px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              {registeringEventId === ev.id ? 'Registering...' : 'Register'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">
                  Event brackets and rulebooks will be published closer to the festival date.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex justify-between items-center">
              <a
                href={activeFestival.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-brand-orange flex items-center gap-1 hover:underline"
              >
                Official Fest Website <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setActiveFestival(null)}
                className="py-2 px-5 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeFestivalsPage;
