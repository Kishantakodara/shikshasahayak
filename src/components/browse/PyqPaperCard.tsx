import React from 'react';
import { Calendar, Download, Eye, FileQuestion, Sparkles, ExternalLink, CheckCircle2, Search } from 'lucide-react';
import { GtuExamSession, GTU_PAPERS_ARCHIVE_URL, getGtuLegacyCodes, getGtuPyqUrl, normalizeGtuPyqUrl } from '../../utils/gtuPyq';

interface PyqPaperCardProps {
  session: GtuExamSession;
  subjectName: string;
  subjectCode: string;
  courseCode: string;
  gtuUrl: string;
  onViewPdf: (url: string, title: string) => void;
  solutionUrl?: string;
}

export const PyqPaperCard: React.FC<PyqPaperCardProps> = ({
  session,
  subjectName,
  subjectCode,
  courseCode,
  gtuUrl: rawGtuUrl,
  onViewPdf,
  solutionUrl,
}) => {
  const gtuUrl = normalizeGtuPyqUrl(rawGtuUrl);
  const isWinter = session.season === 'Winter';
  const legacyCodes = getGtuLegacyCodes(subjectCode);
  const primaryLegacyCode = legacyCodes[0];
  const legacyGtuUrl = primaryLegacyCode ? getGtuPyqUrl(session.code, courseCode, primaryLegacyCode) : null;

  return (
    <div className="bg-white dark:bg-gradient-to-b dark:from-navy-900 dark:to-navy-950 border border-gray-200 dark:border-navy-800 hover:border-brand-orange/50 rounded-2xl p-5 transition-all duration-200 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              isWinter
                ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30'
                : 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {session.label}
          </span>
          <span className="bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-navy-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
            {courseCode}
          </span>
        </div>

        {/* Paper Info */}
        <h4 className="font-bold text-navy-900 dark:text-white text-base leading-snug group-hover:text-brand-orange transition-colors mb-1 line-clamp-2">
          {subjectName} ({session.label})
        </h4>

        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4 flex-wrap">
          <span className="flex items-center gap-1 font-mono font-medium">
            <FileQuestion className="h-3.5 w-3.5 text-brand-orange" />
            Code: {subjectCode}
          </span>
          {primaryLegacyCode && (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
              Legacy: {primaryLegacyCode}
            </span>
          )}
          <span className="text-gray-300 dark:text-navy-700">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> GTU Official Paper
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-navy-800/80">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onViewPdf(gtuUrl, `${subjectName} (${subjectCode}) - GTU ${session.label} Paper`)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white border border-brand-orange/30 hover:border-brand-orange font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>

          <a
            href={gtuUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-700 text-gray-800 dark:text-gray-200 hover:text-navy-900 dark:hover:text-white border border-gray-200 dark:border-navy-700 font-bold text-xs transition-all shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>

        {legacyGtuUrl && (
          <button
            type="button"
            onClick={() => onViewPdf(legacyGtuUrl, `${subjectName} (Legacy Code ${primaryLegacyCode}) - GTU ${session.label} Paper`)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-navy-800/70 hover:bg-amber-100 dark:hover:bg-navy-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" /> Try Legacy Code ({primaryLegacyCode}) PDF
          </button>
        )}

        {solutionUrl ? (
          <a
            href={solutionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" /> View Solution / Answer Key <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <a
            href={GTU_PAPERS_ARCHIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-orange transition-colors pt-1"
          >
            <Search className="h-3 w-3 text-brand-orange" /> Search GTU Paper Archives
          </a>
        )}
      </div>
    </div>
  );
};

export default PyqPaperCard;
