import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Check,
  ChevronDown,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

interface GtuSubjectPreset {
  name: string;
  nepCode: string;
  cbcsCode: string;
  semester: number;
  topics: string[];
}

const GTU_FIRST_YEAR_PRESETS: GtuSubjectPreset[] = [
  {
    name: 'Mathematics - 1 (Calculus)',
    nepCode: 'BE01000041',
    cbcsCode: '3110014',
    semester: 1,
    topics: [
      'Indeterminate Forms & L\'Hospital Rule',
      'Taylor & Maclaurin Series Expansions',
      'Partial Derivatives & Euler Theorem',
      'Maxima & Minima of Two Variables',
      'Double & Triple Integrals',
      'Beta and Gamma Functions',
    ],
  },
  {
    name: 'Programming for Problem Solving (PPS / C)',
    nepCode: 'BE01000161',
    cbcsCode: '3110003',
    semester: 1,
    topics: [
      'Data Types, Operators & Expressions',
      'Control Structures (Loops, Switch-Case)',
      '1D and 2D Arrays & String Manipulation',
      'Functions, Parameter Passing & Recursion',
      'Pointers, Pointer Arithmetic & Dynamic Memory',
      'Structures, Unions & File Handling',
    ],
  },
  {
    name: 'Basic Electrical Engineering (BEE)',
    nepCode: 'BE01000051',
    cbcsCode: '3110005',
    semester: 1,
    topics: [
      'DC Circuits, KCL, KVL & Mesh Analysis',
      'Thevenin & Norton Theorems',
      'Maximum Power Transfer & Superposition',
      'Single-Phase AC Fundamentals & Phasors',
      'Three-Phase AC Circuits & Power Measurement',
      'Single-Phase Transformers & DC Machines',
    ],
  },
  {
    name: 'Engineering Physics',
    nepCode: 'BE01R00021',
    cbcsCode: '3110018',
    semester: 1,
    topics: [
      'Wave Optics, Interference & Thin Films',
      'Diffraction & Polarization',
      'Lasers (Ruby, He-Ne) & Optical Fibers',
      'Quantum Mechanics & Wave-Particle Duality',
      'Superconductivity & Magnetic Materials',
      'Nanotechnology & Smart Materials',
    ],
  },
  {
    name: 'Basic Mechanical Engineering (BME)',
    nepCode: 'BE01000081',
    cbcsCode: '3110006',
    semester: 1,
    topics: [
      'First & Second Laws of Thermodynamics',
      'Steam Boilers (Cochran, Babcock & Wilcox)',
      'Internal Combustion (IC) Engines & Cycles',
      'Pumps, Compressors & Turbines',
      'Refrigeration & Air Conditioning Systems',
      'Power Transmission (Belts, Gears, Clutches)',
    ],
  },
  {
    name: 'Engineering Graphics & Design (EGD)',
    nepCode: 'BE01R00061',
    cbcsCode: '3110013',
    semester: 1,
    topics: [
      'Engineering Scales (Plain & Diagonal)',
      'Conic Sections (Ellipse, Parabola, Hyperbola)',
      'Orthographic Projections (1st & 3rd Angle)',
      'Projection of Points, Lines & Planes',
      'Section of Solids & Development of Surfaces',
      'Isometric Projections & Views',
    ],
  },
  {
    name: 'Mathematics - 2 (Linear Algebra & Vector Calculus)',
    nepCode: 'BE02000011',
    cbcsCode: '3110015',
    semester: 2,
    topics: [
      'Matrices, Rank, Echelon Form & System of Linear Equations',
      'Eigenvalues, Eigenvectors & Cayley-Hamilton Theorem',
      'Vector Differential Calculus (Gradient, Divergence, Curl)',
      'Vector Integral Calculus (Line, Surface, Volume Integrals)',
      'Green\'s, Stokes\' and Gauss Divergence Theorems',
      'First Order Ordinary Differential Equations',
    ],
  },
  {
    name: 'Data Structures (DSA)',
    nepCode: 'BE03007021',
    cbcsCode: '3130702',
    semester: 3,
    topics: [
      'Stack Applications & Infix-to-Postfix',
      'Queue, Circular Queue & Deque',
      'Singly & Doubly Linked Lists',
      'Binary Search Trees & AVL Tree Rotations',
      'Graph Traversals (BFS & DFS)',
      'Sorting (QuickSort, MergeSort) & Hashing',
    ],
  },
  {
    name: 'Operating System',
    nepCode: 'BE04007021',
    cbcsCode: '3140702',
    semester: 4,
    topics: [
      'Dual-Mode Execution & System Calls',
      'CPU Scheduling (FCFS, SJF, Round Robin)',
      'Critical Section Problem & Semaphores',
      'Deadlocks & Banker\'s Algorithm',
      'Virtual Memory, Paging & Page Replacement (LRU, FIFO)',
      'File System Implementation & Disk Scheduling',
    ],
  },
];

export const AdminAIGenerationControl: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [subjectCode, setSubjectCode] = useState(GTU_FIRST_YEAR_PRESETS[0].nepCode);
  const [subjectName, setSubjectName] = useState(GTU_FIRST_YEAR_PRESETS[0].name);
  const [semester, setSemester] = useState(GTU_FIRST_YEAR_PRESETS[0].semester);
  const [unitNo, setUnitNo] = useState(1);
  const [topicName, setTopicName] = useState(GTU_FIRST_YEAR_PRESETS[0].topics[0]);
  const [questionType, setQuestionType] = useState<'MCQ' | 'MSQ' | 'NAT'>('MCQ');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [bloomLevel, setBloomLevel] = useState<'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE'>('APPLY');
  const [count, setCount] = useState(5);
  const [autoVerify, setAutoVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = GTU_FIRST_YEAR_PRESETS[idx];
    setSubjectCode(p.nepCode);
    setSubjectName(p.name);
    setSemester(p.semester);
    setTopicName(p.topics[0]);
    setUnitNo(1);
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetchWithAuth('/api/admin/ai-generation/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectCode,
          subjectName,
          semester,
          unitNo,
          topicName,
          questionType,
          targetDifficulty: difficulty,
          targetBloomLevel: bloomLevel,
          count,
          autoVerify,
        }),
      });

      const data = await res.json() as any;
      if (!res.ok) {
        throw new Error(data.error || 'Batch generation failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger AI generation');
    } finally {
      setLoading(false);
    }
  };

  const currentPreset = GTU_FIRST_YEAR_PRESETS[selectedPresetIndex];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              GTU AI Question Synthesis Studio
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                2024–25 NEP Aligned
              </span>
            </h2>
            <p className="text-xs text-slate-400">Generate syllabus-grounded, verified engineering MCQs with automated branch mapping</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Gemini 2.5 Flash Engine
          </span>
        </div>
      </div>

      {/* GTU Subject Quick-Picker Bar */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-orange-400" /> Choose Target GTU Subject
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {GTU_FIRST_YEAR_PRESETS.map((p, idx) => (
            <button
              key={p.nepCode}
              type="button"
              onClick={() => handleSelectPreset(idx)}
              className={`p-2.5 rounded-xl border text-left transition text-xs font-medium cursor-pointer ${
                selectedPresetIndex === idx
                  ? 'bg-orange-500/15 border-orange-500 text-orange-300 shadow-xs'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="font-bold truncate">{p.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                NEP: {p.nepCode} | Sem {p.semester}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Topic Pills */}
      {currentPreset && (
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Suggested Syllabus Topics for {currentPreset.name}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentPreset.topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopicName(t)}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                  topicName === t
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configurator Form */}
      <form onSubmit={handleGenerateBatch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Subject Code</label>
          <input
            type="text"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Subject Name</label>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Topic</label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Question Type</label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="MCQ">MCQ (Single Correct)</option>
            <option value="MSQ">MSQ (Multiple Correct)</option>
            <option value="NAT">NAT (Numerical Answer)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="easy">Easy (Foundational Formula / Concept)</option>
            <option value="medium">Medium (Procedural / Analytical)</option>
            <option value="hard">Hard (Advanced / GATE Level)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Bloom Taxonomy Level</label>
          <select
            value={bloomLevel}
            onChange={(e) => setBloomLevel(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="REMEMBER">Remember (Recall Definition/Rule)</option>
            <option value="UNDERSTAND">Understand (Explain Concept)</option>
            <option value="APPLY">Apply (Solve Numerical/Trace Code)</option>
            <option value="ANALYZE">Analyze (Compare & Evaluate)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Batch Count</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Publishing Mode</label>
          <button
            type="button"
            onClick={() => setAutoVerify(!autoVerify)}
            className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              autoVerify
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/50 border-amber-800 text-amber-300'
            }`}
          >
            <span>{autoVerify ? '✓ Direct Publish (Live)' : '⏳ Stage in Ingestion Queue'}</span>
            <Check className={`w-3.5 h-3.5 ${autoVerify ? 'opacity-100' : 'opacity-0'}`} />
          </button>
        </div>

        <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">
            Source: <strong className="text-slate-300">GTU NEP Syllabus & Reference Textbooks</strong>
          </span>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg flex items-center space-x-2 transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing GTU Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate {count} GTU Questions</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Generated Batch Successfully (Batch ID: {result.batchId})</span>
            </div>
            <span className="text-xs text-slate-400">Model: {result.modelUsed}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Generated</span>
              <span className="text-lg font-black text-white">{result.generatedCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Staged / Verified</span>
              <span className="text-lg font-black text-emerald-400">{result.stagedCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Quarantined (Duplicates)</span>
              <span className="text-lg font-black text-rose-400">{result.quarantinedCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
