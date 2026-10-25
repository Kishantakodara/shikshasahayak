import React, { useState, useEffect } from "react";
import { Users, MessageSquare, Send, Share2, Award } from "lucide-react";
import { CommunityDiscussionSpec, StudentAmbassadorSpec } from "../../types/community-distribution";
import { fetchCommunityDiscussions, postDiscussion, fetchAmbassadorStats } from "../../api/communityDistributionClient";

interface BranchCommunityHubProps {
  communityId?: string;
  branchName?: string;
}

export const BranchCommunityHub: React.FC<BranchCommunityHubProps> = ({
  communityId = "gtu_cse_sem5",
  branchName = "Computer Engineering (Sem 5)",
}) => {
  const [discussions, setDiscussions] = useState<CommunityDiscussionSpec[]>([]);
  const [ambassador, setAmbassador] = useState<StudentAmbassadorSpec | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCommunityDiscussions(communityId),
      fetchAmbassadorStats(),
    ]).then(([discData, ambData]) => {
      setDiscussions(discData);
      setAmbassador(ambData);
      setLoading(false);
    });
  }, [communityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const ok = await postDiscussion(communityId, title, content);
    if (ok) {
      setTitle("");
      setContent("");
      const updated = await fetchCommunityDiscussions(communityId);
      setDiscussions(updated);
    }
  };

  if (loading) {
    return <div className="p-6 bg-slate-900 rounded-2xl text-slate-400 text-xs animate-pulse">Loading Branch Community...</div>;
  }

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 text-[#f97316] flex items-center justify-center font-bold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
              {branchName} Community
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Connect, ask doubts, and share study notes</p>
          </div>
        </div>

        {ambassador && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-indigo-400 text-xs font-bold">
            <Award className="h-4 w-4" />
            <span>Campus Referral Code: <strong className="text-white">{ambassador.referralCode}</strong> ({ambassador.studentReferralCount} Joined)</span>
          </div>
        )}
      </div>

      {/* Post Discussion Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300">Ask a Question or Share Note</h4>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Topic / Title (e.g. Mid-Sem DBMS Imp Questions)"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write details or doubt explanation..."
          rows={2}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Send className="h-3.5 w-3.5" /> Post Discussion
          </button>
        </div>
      </form>

      {/* Discussion List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Community Discussions</h4>
        {discussions.map((d) => (
          <div key={d.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#f97316]">{d.authorName}</span>
              <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
            </div>
            <h5 className="font-bold text-xs text-white leading-snug">{d.title}</h5>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">{d.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
