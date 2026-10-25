import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Clock, 
  Terminal, 
  Code2, 
  Play, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Timer, 
  BarChart3,
  RotateCcw
} from 'lucide-react';
import { ConquestDTO, ConquestProblemDTO, LeaderboardEntryDTO } from '@/types';
import { fetchWithAuth } from '../../api/client';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

export const CodingConquestPage: React.FC = () => {
  const [conquest, setConquest] = useState<ConquestDTO | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<ConquestProblemDTO | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Timer simulation (in seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3480); // ~58 minutes

  // Code editor states
  const [language, setLanguage] = useState<string>('cpp');
  const [code, setCode] = useState<string>('// Enter your competitive solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Fast I/O\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    return 0;\n}');
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<any>(null);
  const [userScore, setUserScore] = useState<number>(0);

  useEffect(() => {
    const fetchConquest = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth('/api/coding/conquest');
        const data = await res.json() as any;
        if (data.success && data.conquest) {
          setConquest(data.conquest);
          if (data.conquest.problems?.length > 0) {
            setSelectedProblem(data.conquest.problems[0]);
          }
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConquest();
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmitSolution = async () => {
    if (!selectedProblem || !code.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/coding/conquest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conquestId: conquest?.id,
          problemId: selectedProblem.id,
          language,
          code
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setVerdict(data);
        setUserScore(prev => prev + data.score);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Compete', path: '/compete/festivals' },
          { label: `Coding Conquest: ${conquest?.title || 'Contest Arena'}` }
        ]}
        fallbackPath="/student"
      />

      {/* Contest Top Banner with Live Clock */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 border border-navy-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Competitive Coding Arena
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Coding Conquest: <span className="text-brand-orange">{conquest?.title || 'Algorithmic Sprint'}</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Live competitive duel. Solve problems against the clock, optimize runtime, and climb the state engineering leaderboard.
          </p>
        </div>

        {/* Live Contest Timer & Your Points */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-navy-900/90 border border-brand-orange/40 rounded-2xl px-5 py-3">
            <Timer className="w-6 h-6 text-brand-orange animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Time Remaining</span>
              <span className="text-2xl font-black text-white font-mono">{formatTimer(secondsRemaining)}</span>
            </div>
          </div>

          <div className="bg-navy-900/90 border border-navy-700 rounded-2xl px-5 py-3 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Your Score</span>
            <span className="text-2xl font-black text-emerald-400">{userScore} pts</span>
          </div>
        </div>
      </div>

      {/* Problem Tabs Row */}
      {conquest && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-700">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Contest Problems:</span>
          {conquest.problems.map((prob) => (
            <button
              key={prob.id}
              onClick={() => {
                setSelectedProblem(prob);
                setVerdict(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                selectedProblem?.id === prob.id
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>{prob.title}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-navy-950/20 text-white/90">
                {prob.points} pts
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Problem (Left), Editor (Center/Right), Leaderboard (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Problem Statement */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-5">
          {selectedProblem ? (
            <>
              <div className="border-b border-slate-100 dark:border-navy-800 pb-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-brand-orange uppercase">{selectedProblem.difficulty} Difficulty</span>
                  <span className="text-xs font-extrabold text-emerald-600">{selectedProblem.points} Points</span>
                </div>
                <h2 className="text-xl font-black text-navy-950 dark:text-white">{selectedProblem.title}</h2>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement</h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedProblem.description}
                </p>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-100 dark:border-navy-800 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Sample Input:</span>
                  <code className="text-slate-800 dark:text-slate-200 font-mono bg-white dark:bg-navy-900 px-2 py-1 rounded block border border-slate-200 dark:border-navy-700">
                    {selectedProblem.sampleInput}
                  </code>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Sample Output:</span>
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono bg-white dark:bg-navy-900 px-2 py-1 rounded block border border-slate-200 dark:border-navy-700">
                    {selectedProblem.sampleOutput}
                  </code>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">Select a problem from the tabs above.</p>
          )}
        </div>

        {/* Right Column: Code Editor & Leaderboard */}
        <div className="lg:col-span-7 space-y-6">
          {/* Editor Container */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-orange" />
                <span className="text-xs font-bold uppercase text-slate-500">Language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value="cpp">C++ 20 (GCC)</option>
                  <option value="java">Java 21</option>
                  <option value="python">Python 3.12</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-400">Target Time: O(N)</span>
            </div>

            <textarea
              rows={14}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed border border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              spellCheck={false}
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Structural & Format Verification</span>
              <button
                onClick={handleSubmitSolution}
                disabled={submitting || !code.trim()}
                className="py-2.5 px-6 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {submitting ? 'Verifying Solution...' : 'Submit Solution'}
              </button>
            </div>

            {verdict && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {verdict.message} (+{verdict.score} pts)
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Format Verified</span>
              </div>
            )}
          </div>

          {/* Real-time Contest Leaderboard */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
              <h3 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-orange" /> Real-time Contest Standings
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{leaderboard.length} Participants</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-navy-800 text-slate-400">
                    <th className="pb-2 font-bold uppercase">Rank</th>
                    <th className="pb-2 font-bold uppercase">Competitor</th>
                    <th className="pb-2 font-bold uppercase">College</th>
                    <th className="pb-2 font-bold uppercase text-right">Solved</th>
                    <th className="pb-2 font-bold uppercase text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {leaderboard.map((row) => (
                    <tr
                      key={row.rank}
                      className={row.userName.includes('(You)') ? 'bg-orange-50/60 dark:bg-brand-orange/10 font-bold' : ''}
                    >
                      <td className="py-2.5">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-bold ${
                          row.rank === 1 ? 'bg-amber-100 text-amber-800' : row.rank === 2 ? 'bg-slate-200 text-slate-700' : row.rank === 3 ? 'bg-amber-200/60 text-amber-900' : 'text-slate-500'
                        }`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-2.5 text-navy-950 dark:text-white">{row.userName}</td>
                      <td className="py-2.5 text-slate-500">{row.college}</td>
                      <td className="py-2.5 text-right font-mono">{row.solvedCount}/3</td>
                      <td className="py-2.5 text-right font-extrabold text-brand-orange">{row.score} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingConquestPage;
