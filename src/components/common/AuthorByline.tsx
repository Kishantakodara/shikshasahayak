import React from 'react';
import { ShieldCheck, UserCheck, Calendar, Clock, Award } from 'lucide-react';

interface AuthorBylineProps {
  authorName?: string;
  authorRole?: string;
  reviewerName?: string;
  updatedDate?: string;
  readTime?: string;
}

export const AuthorByline: React.FC<AuthorBylineProps> = ({
  authorName = "ShikshaSahayak Editorial Team",
  authorRole = "Verified Senior Engineering Contributors & Faculty",
  reviewerName = "GTU Academic Moderator Panel",
  updatedDate = "Academic Session 2024-26",
  readTime = "5 min read",
}) => {
  return (
    <div className="bg-gray-50 dark:bg-navy-900/60 border border-gray-200/80 dark:border-navy-800 rounded-2xl p-4 sm:p-5 my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30 flex items-center justify-center font-extrabold text-sm shrink-0">
            PP
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-navy-900 dark:text-white">{authorName}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> E-E-A-T Verified
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{authorRole}</p>
          </div>
        </div>

        {/* Peer Reviewer & Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200 dark:border-navy-800 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5" title="Peer Reviewed by GTU Moderators">
            <UserCheck className="h-3.5 w-3.5 text-brand-orange" />
            <span>Reviewed by: <strong className="text-navy-800 dark:text-gray-200">{reviewerName}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>Updated: <strong className="text-navy-800 dark:text-gray-200">{updatedDate}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>{readTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorByline;
