import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Code2, 
  Compass, 
  Layers, 
  Award, 
  Flame, 
  ChevronRight, 
  AlertCircle, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { PortalReturnBar } from '../../../components/navigation/PortalReturnBar';
import { fetchWithAuth } from '../../../api/client';
import { 
  AVAILABLE_TRACKS, 
  TrackMetadata, 
  DayRoadmapItem, 
  DayProblemDetailDTO 
} from '../../../data/coding100DaysCurriculum';
import { HundredDaysDashboard } from './HundredDaysDashboard';
import { HundredDaysTrackSelector } from './HundredDaysTrackSelector';
import { HundredDaysRoadmap } from './HundredDaysRoadmap';
import { HundredDaysDailyLesson } from './HundredDaysDailyLesson';
import { HundredDaysProjects, StudentProject } from './HundredDaysProjects';
import { HundredDaysAchievements, AchievementItem } from './HundredDaysAchievements';

export type HundredDaysViewMode = 'dashboard' | 'tracks' | 'roadmap' | 'day' | 'projects' | 'achievements';

export const HundredDaysHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Primary state
  const [activeTrackId, setActiveTrackId] = useState<string>('dsa');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [problemDetail, setProblemDetail] = useState<DayProblemDetailDTO | null>(null);
  const [roadmap, setRoadmap] = useState<DayRoadmapItem[]>([]);
  const [solvedDays, setSolvedDays] = useState<number[]>([]);
  const [stats, setStats] = useState({
    daysCompleted: 0,
    completionPercentage: 0,
    streakCount: 0,
    totalXp: 0,
    currentPhaseNumber: 1,
    currentPhaseName: 'Foundations & Syntax Mastery'
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [badges, setBadges] = useState<AchievementItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [switchingTrack, setSwitchingTrack] = useState(false);

  // Set document title for SEO
  useEffect(() => {
    document.title = "100 Days of Code | ShikshaSahayak - Structured Engineering Coding Roadmap";
  }, []);

  // Determine current active view based on pathname
  const getViewMode = (): HundredDaysViewMode => {
    const path = location.pathname;
    if (path.includes('/tracks')) return 'tracks';
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/achievements')) return 'achievements';
    if (path.includes('/day/')) return 'day';
    if (path.includes('/track/')) return 'roadmap';
    return 'dashboard';
  };

  const viewMode = getViewMode();

  // Load primary 100 days state from API
  const loadPlatformData = useCallback(async (track: string = activeTrackId, targetDay?: number) => {
    setLoading(true);
    setErrorMsg(null);

    const queryDay = targetDay !== undefined ? targetDay : currentDay;

    try {
      // 1. Fetch main dashboard & day payload
      const res = await fetchWithAuth(`/api/coding/100-days?track=${track}&day=${queryDay}`);
      const data = await res.json() as any;

      if (data.success) {
        if (data.trackId) setActiveTrackId(data.trackId);
        if (data.currentDay) setCurrentDay(data.currentDay);
        if (data.problem) setProblemDetail(data.problem);
        if (data.roadmap) setRoadmap(data.roadmap);
        if (data.solvedDays) setSolvedDays(data.solvedDays);
        if (data.stats) setStats(data.stats);
        if (data.recentSubmissions) setRecentSubmissions(data.recentSubmissions);
      } else {
        setErrorMsg(data.error || 'Failed to load challenge data.');
      }

      // 2. Fetch projects and achievements in parallel
      const [projRes, badgeRes] = await Promise.all([
        fetchWithAuth('/api/coding/100-days?view=projects').then(r => r.json()).catch(() => null),
        fetchWithAuth('/api/coding/100-days?view=achievements').then(r => r.json()).catch(() => null)
      ]);

      if (projRes && projRes.success) {
        setProjects(projRes.projects || []);
      }
      if (badgeRes && badgeRes.success) {
        setBadges(badgeRes.badges || []);
      }
    } catch (err: any) {
      console.error('Error fetching 100 Days state:', err);
      setErrorMsg('Network error connecting to learning engine. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [activeTrackId, currentDay]);

  // Initial load or route param change
  useEffect(() => {
    // Check if day is specified in URL param /day/:dayNumber
    const matchDay = location.pathname.match(/\/day\/(\d+)/);
    const dayFromUrl = matchDay ? parseInt(matchDay[1], 10) : undefined;

    // Check if track is specified in URL param /track/:trackId
    const matchTrack = location.pathname.match(/\/track\/([a-zA-Z0-9_-]+)/);
    const trackFromUrl = matchTrack ? matchTrack[1] : undefined;

    loadPlatformData(trackFromUrl || activeTrackId, dayFromUrl);
  }, [location.pathname]);

  // Handle Switch Track
  const handleSelectTrack = async (newTrackId: string) => {
    if (newTrackId === activeTrackId) {
      navigate('/student/100-days-code');
      return;
    }

    setSwitchingTrack(true);
    try {
      const res = await fetchWithAuth('/api/coding/100-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enroll_track',
          trackId: newTrackId
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setActiveTrackId(newTrackId);
        await loadPlatformData(newTrackId, 1);
        navigate('/student/100-days-code');
      }
    } catch (err) {
      console.error('Track switch failed:', err);
    } finally {
      setSwitchingTrack(false);
    }
  };

  // Handle Solution Accepted
  const handleSolutionAccepted = (awardedXp: number, streak: number) => {
    if (!solvedDays.includes(currentDay)) {
      setSolvedDays(prev => [...prev, currentDay]);
      setStats(prev => ({
        ...prev,
        daysCompleted: prev.daysCompleted + 1,
        completionPercentage: Math.round(((prev.daysCompleted + 1) / 100) * 100),
        streakCount: streak,
        totalXp: prev.totalXp + awardedXp
      }));
    }
  };

  // Find active track metadata
  const currentTrack = AVAILABLE_TRACKS.find(t => t.id === activeTrackId) || AVAILABLE_TRACKS[0];

  // Breadcrumbs generator
  const getCrumbs = () => {
    const base = [
      { label: 'Student Portal', path: '/student' },
      { label: '100 Days of Code', path: '/student/100-days-code' }
    ];

    if (viewMode === 'tracks') {
      base.push({ label: 'Learning Tracks', path: '/student/100-days-code/tracks' });
    } else if (viewMode === 'roadmap') {
      base.push({ label: `${currentTrack.name} Roadmap`, path: `/student/100-days-code/track/${activeTrackId}` });
    } else if (viewMode === 'day') {
      base.push({ label: `Day ${currentDay}: ${problemDetail?.title || 'Daily Sprint'}`, path: `/student/100-days-code/day/${currentDay}` });
    } else if (viewMode === 'projects') {
      base.push({ label: 'Project Portfolio', path: '/student/100-days-code/projects' });
    } else if (viewMode === 'achievements') {
      base.push({ label: 'Achievements', path: '/student/100-days-code/achievements' });
    }

    return base;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Global Portal Return Bar */}
      <PortalReturnBar
        crumbs={getCrumbs()}
        fallbackPath="/student"
      />

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none gap-2">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => navigate('/student/100-days-code')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'dashboard'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/student/100-days-code/tracks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'tracks'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Tracks</span>
          </button>

          <button
            onClick={() => navigate(`/student/100-days-code/track/${activeTrackId}`)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'roadmap'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>

          <button
            onClick={() => navigate('/student/100-days-code/projects')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'projects'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => navigate('/student/100-days-code/achievements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'achievements'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Badges</span>
          </button>
        </div>

        {/* Active Track Chip */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>{currentTrack.name}</span>
        </div>
      </div>

      {/* 3. Loading & Error States */}
      {loading ? (
        <div className="space-y-6 animate-pulse py-8">
          <div className="h-44 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        </div>
      ) : errorMsg ? (
        <div className="p-8 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-800 dark:text-red-200">{errorMsg}</h3>
          <button
            onClick={() => loadPlatformData()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        /* 4. Active Subview Rendering */
        <>
          {viewMode === 'dashboard' && (
            <HundredDaysDashboard
              track={currentTrack}
              solvedDays={solvedDays}
              currentDay={currentDay}
              stats={stats}
              roadmap={roadmap}
              recentSubmissions={recentSubmissions}
              onSelectDay={(d) => navigate(`/student/100-days-code/day/${d}`)}
              onOpenTracks={() => navigate('/student/100-days-code/tracks')}
              onOpenRoadmap={() => navigate(`/student/100-days-code/track/${activeTrackId}`)}
              onOpenProjects={() => navigate('/student/100-days-code/projects')}
              onOpenAchievements={() => navigate('/student/100-days-code/achievements')}
            />
          )}

          {viewMode === 'tracks' && (
            <HundredDaysTrackSelector
              tracks={AVAILABLE_TRACKS}
              activeTrackId={activeTrackId}
              onSelectTrack={handleSelectTrack}
              onBackToDashboard={() => navigate('/student/100-days-code')}
              switchingTrack={switchingTrack}
            />
          )}

          {viewMode === 'roadmap' && (
            <HundredDaysRoadmap
              track={currentTrack}
              roadmap={roadmap}
              solvedDays={solvedDays}
              currentDay={currentDay}
              onSelectDay={(d) => navigate(`/student/100-days-code/day/${d}`)}
              onBackToDashboard={() => navigate('/student/100-days-code')}
            />
          )}

          {viewMode === 'day' && problemDetail && (
            <HundredDaysDailyLesson
              dayNumber={currentDay}
              trackId={activeTrackId}
              problem={problemDetail}
              isSolved={solvedDays.includes(currentDay)}
              onNavigateDay={(d) => navigate(`/student/100-days-code/day/${d}`)}
              onSolutionAccepted={handleSolutionAccepted}
              onBackToRoadmap={() => navigate(`/student/100-days-code/track/${activeTrackId}`)}
            />
          )}

          {viewMode === 'projects' && (
            <HundredDaysProjects
              projects={projects}
              onProjectAdded={() => loadPlatformData()}
              onProjectDeleted={(pid) => setProjects(prev => prev.filter(p => p.id !== pid))}
              onBackToDashboard={() => navigate('/student/100-days-code')}
            />
          )}

          {viewMode === 'achievements' && (
            <HundredDaysAchievements
              badges={badges}
              daysCompletedCount={stats.daysCompleted}
              streakCount={stats.streakCount}
              totalXp={stats.totalXp}
              onBackToDashboard={() => navigate('/student/100-days-code')}
            />
          )}
        </>
      )}
    </div>
  );
};

export default HundredDaysHub;
