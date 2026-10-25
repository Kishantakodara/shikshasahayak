import React, { useState, useEffect } from "react";
import { Briefcase, Building2, TrendingUp } from "lucide-react";
import { getStudentCareerProfile, getCareerRoadmaps, addProjectToProfile } from "../../api/studentCareerClient";
import { StudentCareerProfile, CareerRoadmap } from "../../types/student-success-career";
import { SkillManagerCard } from "./SkillManagerCard";
import { CareerRoadmapViewer } from "./CareerRoadmapViewer";
import { ProjectPortfolioCard } from "./ProjectPortfolioCard";

export const StudentCareerDashboard: React.FC = () => {
  const [profile, setProfile] = useState<StudentCareerProfile | null>(null);
  const [roadmaps, setRoadmaps] = useState<CareerRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStudentCareerProfile(),
      getCareerRoadmaps(),
    ]).then(([prof, maps]) => {
      setProfile(prof);
      setRoadmaps(maps);
    }).finally(() => setLoading(false));
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    const ok = await addProjectToProfile({
      title: newTitle,
      description: newDesc,
      technologies: ["React", "TypeScript"],
      isPublic: true,
    });

    if (ok) {
      setShowAddProjectModal(false);
      setNewTitle("");
      setNewDesc("");
      getStudentCareerProfile().then(setProfile);
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-3xl p-5 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-3xl p-6 h-48" />
        <div className="bg-card border border-border rounded-3xl p-6 h-48" />
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <div className="p-4 bg-orange-500/10 rounded-2xl">
        <Briefcase className="h-8 w-8 text-[#f97316]" />
      </div>
      <h3 className="text-base font-bold text-foreground">No Career Profile Yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Set up your career profile to track placement readiness, career goals, and project portfolio.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Placement Readiness */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
            <span>Placement Readiness</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground font-display">{profile.placementReadinessScore}%</span>
            <span className="text-xs font-bold text-emerald-500">Campus Ready</span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#f97316] to-emerald-400 h-full rounded-full"
              style={{ width: `${profile.placementReadinessScore}%` }}
            />
          </div>
        </div>

        {/* Career Interests */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
            <span>Career Goals</span>
            <Briefcase className="h-4 w-4 text-[#f97316]" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(profile.careerInterests || []).length > 0 ? (
              (profile.careerInterests || []).map((interest, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f97316] text-xs font-bold"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No career interests set yet.</span>
            )}
          </div>
        </div>

        {/* Target Companies */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
            <span>Target Recruiters</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(profile.targetCompanies || []).length > 0 ? (
              (profile.targetCompanies || []).map((company, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold"
                >
                  {company}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No target companies set yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CareerRoadmapViewer roadmaps={roadmaps} />
        <div className="space-y-6">
          <SkillManagerCard skills={profile.skills} />
          <ProjectPortfolioCard projects={profile.projects} onAddProject={() => setShowAddProjectModal(true)} />
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-foreground font-display">Add Project to Portfolio</h3>
            <form onSubmit={handleAddProject} className="space-y-3">
              <input
                type="text"
                placeholder="Project Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#f97316]"
                required
              />
              <textarea
                placeholder="Short Description & key features..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#f97316]"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#f97316] text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 transition-colors"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
