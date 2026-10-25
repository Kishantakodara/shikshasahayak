import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  ScrollText, 
  Download, 
  Eye, 
  Clock, 
  ArrowRight,
  GraduationCap,
  Calendar,
  Sparkles
} from 'lucide-react';
import { downloadPdfFile } from '../../utils/downloadPdf';

export interface ResourceCardProps {
  id: string;
  type: 'note' | 'pyq' | 'syllabus' | 'blog' | string;
  title: string;
  subjectName?: string;
  subjectCode?: string;
  branchName?: string;
  semester?: number | string;
  year?: string | number;
  session?: string;
  downloads?: number;
  views?: number;
  fileUrl?: string;
  link?: string;
  updatedAt?: string;
  compact?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  id,
  type,
  title,
  subjectName,
  subjectCode,
  branchName,
  semester,
  year,
  session,
  downloads = 0,
  views,
  fileUrl,
  link = `/materials/${id}`,
  updatedAt,
  compact = false,
}) => {
  const normalizedType = (type || 'note').toLowerCase();

  // Distinct category styling based on design system
  const getTypeConfig = () => {
    switch (normalizedType) {
      case 'pyq':
      case 'paper':
        return {
          label: 'PYQ Paper',
          badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
          accentClass: 'text-purple-600 dark:text-purple-400',
          iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
          hoverBorder: 'hover:border-purple-400/60 dark:hover:border-purple-600/50',
          Icon: FileText,
        };
      case 'syllabus':
        return {
          label: 'Syllabus',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
          accentClass: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
          hoverBorder: 'hover:border-emerald-400/60 dark:hover:border-emerald-600/50',
          Icon: ScrollText,
        };
      case 'blog':
        return {
          label: 'Article',
          badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
          accentClass: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
          hoverBorder: 'hover:border-amber-400/60 dark:hover:border-amber-600/50',
          Icon: Sparkles,
        };
      case 'note':
      case 'study-material':
      default:
        return {
          label: 'Study Notes',
          badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
          accentClass: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
          hoverBorder: 'hover:border-blue-400/60 dark:hover:border-blue-600/50',
          Icon: BookOpen,
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.Icon;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileUrl) {
      downloadPdfFile(fileUrl, `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    } else {
      window.location.href = link;
    }
  };

  return (
    <div className={`group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-200 ${config.hoverBorder}`}>
      <div>
        {/* Top Badges & Meta Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${config.badgeClass}`}>
              <IconComponent className="w-3 h-3" />
              <span>{config.label}</span>
            </span>

            {semester !== undefined && semester !== null && semester !== '' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                Sem {semester}
              </span>
            )}

            {year && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                <span>{session ? `${session} ${year}` : year}</span>
              </span>
            )}
          </div>

          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
            <IconComponent className="w-4 h-4" />
          </div>
        </div>

        {/* Subject & Code */}
        {(subjectName || subjectCode) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <span className="truncate">{subjectName || 'Engineering Subject'}</span>
            {subjectCode && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                ({subjectCode})
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <Link to={link} className="block group/title">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover/title:text-brand-orange transition-colors">
            {title}
          </h3>
        </Link>

        {/* Branch meta if available */}
        {branchName && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
            {branchName}
          </p>
        )}
      </div>

      {/* Card Footer: Metrics & Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {downloads > 0 && (
            <span className="flex items-center gap-1" title={`${downloads} downloads`}>
              <Download className="w-3 h-3 text-slate-400" />
              <span>{downloads.toLocaleString()}</span>
            </span>
          )}
          {views !== undefined && views > 0 && (
            <span className="flex items-center gap-1" title={`${views} views`}>
              <Eye className="w-3 h-3 text-slate-400" />
              <span>{views.toLocaleString()}</span>
            </span>
          )}
          {updatedAt && (
            <span className="flex items-center gap-1 hidden sm:inline-flex">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{new Date(updatedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {fileUrl && (
            <button
              onClick={handleDownload}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Download PDF"
              aria-label="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          <Link
            to={link}
            className="px-3 py-1 rounded-lg bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all hover:scale-[1.02]"
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
