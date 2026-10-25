import React, { useState, useEffect } from 'react';
import { Code, Play, Trophy, CheckCircle, Clock, Cpu, Award } from 'lucide-react';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

export const CodingPlatformPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'problem' | 'leaderboard'>('problem');
  const [challenge, setChallenge] = useState<any>(null);
  const [language, setLanguage] = useState<'cpp' | 'java' | 'python' | 'javascript'>('cpp');
  const [code, setCode] = useState<string>(
    '#include <iostream>\nusing namespace std;\n\nint main() {\n    int target;\n    // Read input and print indices\n    cout << "0 1";\n    return 0;\n}'
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/national/coding?mode=challenge')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success) setChallenge(data.challenge);
      })
      .catch(console.error);

    fetch('/api/v1/national/coding?mode=leaderboard')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success) setLeaderboard(data.leaderboard);
      })
      .catch(console.error);
  }, []);

  const handleRunCode = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/national/coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: challenge?.id || 'dsa_01',
          language,
          code
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setResult(data.submission);
      }
    } catch (err) {
      console.error('Error running code:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Practice Zone', path: '/student?tab=practice' },
          { label: 'DSA & Coding Arena' }
        ]}
        fallbackPath="/student?tab=practice"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-navy-900 to-blue-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-sm font-bold uppercase tracking-wider mb-1">
            <Code className="w-4 h-4" /> GTU DSA & Coding Arena
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Engineering Practice Arena</h1>
          <p className="text-blue-200 text-sm mt-1">
            Solve algorithmic coding challenges and benchmark code execution efficiency in real-time.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-navy-950 p-1.5 rounded-xl border border-navy-700 shrink-0">
          <button
            onClick={() => setActiveTab('problem')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'problem' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Problem Editor
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
              activeTab === 'leaderboard' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </button>
        </div>
      </div>

      {activeTab === 'problem' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Problem Statement */}
          <div className="lg:col-span-5 space-y-6 bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm">
            {challenge ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 text-xs font-bold rounded-lg">
                    {challenge.difficulty}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Acceptance: {challenge.acceptanceRatePercent}%</span>
                </div>
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">{challenge.title}</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{challenge.problemStatement}</p>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-navy-700">
                  <h3 className="text-xs font-bold uppercase text-gray-400">Sample Test Case</h3>
                  {challenge.testCases?.map((tc: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl font-mono text-xs space-y-1">
                      <div><span className="text-gray-400">Input:</span> {tc.input}</div>
                      <div><span className="text-brand-orange">Expected:</span> {tc.expectedOutput}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Loading problem details...</p>
            )}
          </div>

          {/* Code Editor & Execution */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-navy-950 p-4 rounded-2xl border border-navy-800 space-y-4">
              <div className="flex justify-between items-center">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as any)}
                  className="bg-navy-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-navy-700"
                >
                  <option value="cpp">C++ (GCC 11)</option>
                  <option value="java">Java 17</option>
                  <option value="python">Python 3.10</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                </select>

                <button
                  onClick={handleRunCode}
                  disabled={submitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> {submitting ? 'Running...' : 'Run Code'}
                </button>
              </div>

              <textarea
                rows={12}
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-navy-900 text-green-400 font-mono text-xs p-4 rounded-xl border border-navy-800 focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Execution Result */}
            {result && (
              <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-sm text-navy-900 dark:text-white">Status: {result.status}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{result.passedTestCases} / {result.totalTestCases} Testcases Passed</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-orange" />
                    <span>Execution Time: {result.executionTimeMs} ms</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-navy-900 rounded-xl flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <span>Memory: {result.memoryKB} KB</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Leaderboard View */
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-orange" /> Global Student Coding Leaderboard
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-navy-900 text-xs font-bold uppercase text-gray-500">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Problems Solved</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-700 font-medium">
                {leaderboard.map(entry => (
                  <tr key={entry.rank} className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition">
                    <td className="p-3 font-bold text-navy-900 dark:text-white">#{entry.rank}</td>
                    <td className="p-3">{entry.userName}</td>
                    <td className="p-3">{entry.problemsSolved}</td>
                    <td className="p-3 text-brand-orange font-bold">{entry.score} pts</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-900">
                        {entry.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingPlatformPage;
