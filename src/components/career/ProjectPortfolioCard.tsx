import React from "react";
import { FolderGit2, ExternalLink, Github, Plus } from "lucide-react";
import { StudentProject } from "../../types/student-success-career";

interface Props {
  projects: StudentProject[];
  onAddProject?: () => void;
}

export const ProjectPortfolioCard: React.FC<Props> = ({ projects, onAddProject }) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderGit2 className="h-5 w-5 text-purple-500" />
          <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
            Project Portfolio &amp; Hackathons ({projects.length})
          </h3>
        </div>
        {onAddProject && (
          <button
            onClick={onAddProject}
            className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-purple-500/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="p-6 bg-muted/30 rounded-2xl border border-border text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">No Projects Added Yet</p>
          <p>Showcase your academic, personal, or hackathon projects to stand out for campus placement drives.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-foreground text-sm">{project.title}</h4>
                <div className="flex items-center gap-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="GitHub Repository"
                    >
                      <Github className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {project.projectUrl && (
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Live Project URL"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-medium leading-relaxed">{project.description}</p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(project.technologies || []).map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-background text-foreground/80 text-[10px] font-bold border border-border"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
