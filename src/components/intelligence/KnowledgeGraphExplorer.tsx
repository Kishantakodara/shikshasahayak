import React, { useState, useEffect } from "react";
import { GitGraph, ArrowRight, Share2, Sparkles } from "lucide-react";
import { getKnowledgeGraph } from "../../api/educationIntelligenceClient";
import { KnowledgeGraphNode, KnowledgeGraphEdge } from "../../types/education-intelligence";

export const KnowledgeGraphExplorer: React.FC = () => {
  const [nodes, setNodes] = useState<KnowledgeGraphNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeGraphEdge[]>([]);

  useEffect(() => {
    getKnowledgeGraph().then((res) => {
      setNodes(res.nodes);
      setEdges(res.edges);
    });
  }, []);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitGraph className="h-5 w-5 text-purple-500" />
          <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
            Unified Knowledge Graph Topology
          </h3>
        </div>
        <span className="text-[10px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Graph Connected
        </span>
      </div>

      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
        Visualizing multi-entity relationships connecting GTU Universities, Branches, Subjects, Topics, Skills, and Placement Careers.
      </p>

      {/* Graph Visual Representation */}
      {nodes.length === 0 ? (
        <div className="p-8 bg-muted/30 rounded-2xl border border-border text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Knowledge Graph Building</p>
          <p>Explore your subjects and complete practice modules to expand your personalized knowledge graph topology.</p>
        </div>
      ) : (
        <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-3">
          <div className="flex flex-wrap gap-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-bold text-foreground flex items-center gap-1.5 shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>{node.name}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-black px-1 rounded bg-muted">
                  {node.entityType}
                </span>
              </div>
            ))}
          </div>

          {edges.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <h4 className="text-[11px] font-black text-muted-foreground uppercase">Knowledge Relationships ({edges.length})</h4>
              {edges.map((edge) => (
                <div key={edge.id} className="text-xs text-foreground/80 font-medium flex items-center gap-2">
                  <span className="font-bold text-purple-500">{edge.sourceId}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {edge.relationType}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-bold text-cyan-500">{edge.targetId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
