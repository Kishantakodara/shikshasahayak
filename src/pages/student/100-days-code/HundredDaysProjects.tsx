import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  ExternalLink, 
  Github, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  FolderGit2,
  Calendar
} from 'lucide-react';
import { fetchWithAuth } from '../../../api/client';

export interface StudentProject {
  id: string;
  title: string;
  description: string;
  track_id: string;
  phase_number: number;
  day_number: number;
  techStack: string[];
  repo_url?: string;
  demo_url?: string;
  status: string;
  created_at: string;
}

export interface ProjectsProps {
  projects: StudentProject[];
  onProjectAdded: () => void;
  onProjectDeleted: (projectId: string) => void;
  onBackToDashboard: () => void;
}

export const HundredDaysProjects: React.FC<ProjectsProps> = ({
  projects,
  onProjectAdded,
  onProjectDeleted,
  onBackToDashboard
}) => {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [phaseNumber, setPhaseNumber] = useState(1);
  const [dayNumber, setDayNumber] = useState(20);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both title and description.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const techStack = techStackInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetchWithAuth('/api/coding/100-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_project',
          projectData: {
            title: title.trim(),
            description: description.trim(),
            techStack: techStack.length > 0 ? techStack : ['JavaScript', 'HTML5'],
            repoUrl: repoUrl.trim() || undefined,
            demoUrl: demoUrl.trim() || undefined,
            phaseNumber,
            dayNumber
          }
        })
      });

      const data = await res.json() as any;
      if (data.success) {
        setTitle('');
        setDescription('');
        setTechStackInput('');
        setRepoUrl('');
        setDemoUrl('');
        setShowModal(false);
        onProjectAdded();
      } else {
        setErrorMsg(data.error || 'Failed to record project.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to remove this project entry?')) return;
    try {
      const res = await fetchWithAuth('/api/coding/100-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_project',
          projectId
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        onProjectDeleted(projectId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" /> 100 Days Project Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Capstone & <span className="text-orange-500">Milestone Projects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Practical applications built throughout your 100-day journey. Connect GitHub repositories and live deployments to build an engineering portfolio for campus recruiters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
            <FolderGit2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Projects Added Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              As you complete project milestone days (such as Day 20, 40, 60, 80, and 100), submit your GitHub repo and live demo link to display here.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    Phase {p.phase_number || 1} Milestone
                  </span>

                  <button
                    onClick={() => handleDelete(p.id)}
                    title="Delete project"
                    className="text-slate-400 hover:text-red-500 transition cursor-pointer p-1"
                    aria-label="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(p.techStack || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links & Date */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {p.repo_url && (
                    <a
                      href={p.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <Github className="w-3.5 h-3.5" /> Code
                    </a>
                  )}

                  {p.demo_url && (
                    <a
                      href={p.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Demo
                    </a>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 font-medium">
                  Day {p.day_number || 20}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Add 100 Days Capstone Project
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Queue & Rate Limiter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what the project solves, its architecture, and performance characteristics..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phase Number
                  </label>
                  <select
                    value={phaseNumber}
                    onChange={(e) => setPhaseNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value={1}>Phase 1 (Foundations)</option>
                    <option value={2}>Phase 2 (Problem Solving)</option>
                    <option value={3}>Phase 3 (Building)</option>
                    <option value={4}>Phase 4 (Real-World)</option>
                    <option value={5}>Phase 5 (Capstone)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Day Milestone
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tech Stack (comma separated)
                </label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="React 19, TypeScript, Cloudflare Workers, D1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Live Demo URL (Optional)
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://my-project.pages.dev"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HundredDaysProjects;
