import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Play,
} from 'lucide-react';
import { StudentMasteryRoadmap } from './StudentMasteryRoadmap';
import { PortalReturnBar } from '../navigation/PortalReturnBar';
import { toast } from 'sonner';

export function StudentAdaptiveDashboard() {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<any>(null);
  const [masteryRecords, setMasteryRecords] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('3110014');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        fetch('/api/student/adaptive/recommendations'),
        fetch('/api/student/adaptive/mastery'),
      ]);

      const rJson = await rRes.json();
      const mJson = await mRes.json();

      if (rJson.success) setRecommendation(rJson.recommendation);
      if (mJson.success) setMasteryRecords(mJson.masteryRecords || []);
    } catch {
      // Network error — silently fail; data stays empty
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async (mode: string, subjectCode?: string, topicName?: string) => {
    try {
      const res = await fetch('/api/student/adaptive/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, subjectCode, topicName, questionCount: 10 }),
      });
      const data = await res.json();
      if (data.success && data.session?.id) {
        navigate(`/student/test/${data.session.id}`);
      } else {
        toast.error('Could not initialize adaptive test session.');
      }
    } catch {
      toast.error('Failed to start adaptive practice session.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4 sm:p-6">
        <div className="bg-card border border-border rounded-2xl p-6 h-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded-xl p-4 h-16" />)}
        </div>
      </div>
    );
  }

  const weakestTopic = masteryRecords[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Practice Zone', path: '/student?tab=practice' },
          { label: 'Adaptive AI Diagnostic' }
        ]}
        fallbackPath="/student?tab=practice"
      />

      {/* Header Banner — intentional dark gradient preserved */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-950/80 border border-orange-800/50 text-orange-400 rounded-full text-xs font-bold mb-3">
              <BrainCircuit className="w-4 h-4" /> AI Adaptive Learning Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">Your Personalized Learning Path</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Target your weak areas, revise past mistakes, and master GTU/GATE topics with real-time accuracy adaptation.
            </p>
          </div>

          {recommendation ? (
            <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl max-w-sm w-full space-y-3">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Recommended For You</span>
              <h4 className="text-sm font-bold text-slate-200">{recommendation.topicName} ({recommendation.subjectCode})</h4>
              <p className="text-xs text-slate-400">{recommendation.reason}</p>
              <button
                onClick={() => handleStartPractice('WEAK_TOPIC_MODE', recommendation.subjectCode, recommendation.topicName)}
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Start Practice Now
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl max-w-sm w-full space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Recommendation Yet</span>
              <p className="text-xs text-slate-400">Complete a few practice sessions and we'll generate personalised recommendations based on your weak areas.</p>
              <button
                onClick={() => handleStartPractice('BALANCED_PRACTICE')}
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Start Balanced Practice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl">
          <span className="text-muted-foreground text-xs">Topics Tracked</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{masteryRecords.length}</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <span className="text-muted-foreground text-xs">Weakest Topic</span>
          <div className="text-sm font-bold text-red-500 mt-1 truncate">
            {weakestTopic ? weakestTopic.topic_name : 'None yet'}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <span className="text-muted-foreground text-xs">Mastered Topics</span>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1">
            {masteryRecords.filter((m) => m.mastery_level === 'MASTERED').length}
          </div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <span className="text-muted-foreground text-xs">Avg Mastery Score</span>
          <div className="text-2xl font-extrabold text-orange-500 mt-1">
            {masteryRecords.length > 0
              ? Math.round(masteryRecords.reduce((s, m) => s + m.mastery_score, 0) / masteryRecords.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Quick Adaptive Modes Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Adaptive Practice Modes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleStartPractice('WEAK_TOPIC_MODE')}
            className="p-3 bg-card hover:bg-muted border border-border rounded-xl text-left transition-colors space-y-1"
          >
            <div className="text-orange-500 font-bold text-xs">Weak Topic Mode</div>
            <div className="text-[10px] text-muted-foreground">Target lowest accuracy topics</div>
          </button>
          <button
            onClick={() => handleStartPractice('REVISION_MODE')}
            className="p-3 bg-card hover:bg-muted border border-border rounded-xl text-left transition-colors space-y-1"
          >
            <div className="text-blue-500 font-bold text-xs">Revision Mode</div>
            <div className="text-[10px] text-muted-foreground">Revise past mistakes</div>
          </button>
          <button
            onClick={() => handleStartPractice('CHALLENGE_MODE')}
            className="p-3 bg-card hover:bg-muted border border-border rounded-xl text-left transition-colors space-y-1"
          >
            <div className="text-purple-500 font-bold text-xs">Challenge Mode</div>
            <div className="text-[10px] text-muted-foreground">Hard difficulty questions</div>
          </button>
          <button
            onClick={() => handleStartPractice('BALANCED_PRACTICE')}
            className="p-3 bg-card hover:bg-muted border border-border rounded-xl text-left transition-colors space-y-1"
          >
            <div className="text-emerald-500 font-bold text-xs">Balanced Mode</div>
            <div className="text-[10px] text-muted-foreground">Mix of weak, new &amp; revision</div>
          </button>
        </div>
      </div>

      {/* Subject Roadmap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-foreground">Subject Mastery Roadmap</h3>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-background border border-border text-xs text-foreground rounded-lg p-2 focus:outline-none focus:border-orange-500"
          >
            <option value="3110014">Mathematics - 1 (3110014)</option>
            <option value="3110015">Mathematics - 2 (3110015)</option>
            <option value="3110002">Physics (3110002)</option>
            <option value="3110003">Programming in C (3110003)</option>
            <option value="3110005">Basic Electrical Engg (3110005)</option>
          </select>
        </div>
        <StudentMasteryRoadmap subjectCode={selectedSubject} />
      </div>
    </div>
  );
}
