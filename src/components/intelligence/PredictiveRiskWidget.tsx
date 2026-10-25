import React from "react";
import { TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { PredictiveLearningScore } from "../../types/education-intelligence";

interface Props {
  scores: PredictiveLearningScore[];
}

export const PredictiveRiskWidget: React.FC<Props> = ({ scores }) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
            Predictive Learning Analytics &amp; Risk Insights
          </h3>
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="p-6 bg-muted/30 rounded-2xl border border-border text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">No Risk Alerts</p>
          <p>Complete learning activities and mock tests to generate predictive syllabus completion and risk projections.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score) => (
            <div
              key={score.subjectId}
              className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-foreground text-sm">{score.subjectName}</h4>
                {score.failureRiskScore > 20 ? (
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Risk: {score.failureRiskScore}%
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Safe: {score.completionProbability}%
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                  <span>Syllabus Completion Confidence</span>
                  <span className="text-emerald-500">{(score.confidenceScore * 100).toFixed(0)}% Confidence</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full"
                    style={{ width: `${score.completionProbability}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1">
                <strong className="text-foreground/80">Factor:</strong> {score.explanation.primaryFactor} •{" "}
                <strong className="text-foreground/80">Suggested:</strong> {score.explanation.recommendedEffort}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
