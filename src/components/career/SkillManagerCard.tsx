import React from "react";
import { Code, CheckCircle, Sparkles } from "lucide-react";
import { SkillItem } from "../../types/student-success-career";

interface Props {
  skills: SkillItem[];
}

export const SkillManagerCard: React.FC<Props> = ({ skills }) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-cyan-500" />
          <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
            Verified Skills &amp; Proficiencies ({skills.length})
          </h3>
        </div>
        <span className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Career Ready
        </span>
      </div>

      {skills.length === 0 ? (
        <div className="p-6 bg-muted/30 rounded-2xl border border-border text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">No Skills Tracked Yet</p>
          <p>Add programming languages, technical competencies, and coursework skills to enhance your placement readiness.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                  <Code className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground leading-snug">{skill.name}</h4>
                  <span className="text-[10px] text-muted-foreground capitalize">{skill.category.replace("_", " ")}</span>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> {skill.proficiencyLevel || "Intermediate"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
