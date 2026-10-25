import React from 'react';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Clock, 
  Wallet,
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';
import { CareerListingDTO } from '@/types/prepZone';
import { BookmarkButton } from './BookmarkButton';
import { isDeadlineExpired, isValidHttpUrl } from './VerificationIndicator';

interface JobCardProps {
  listing: CareerListingDTO;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => Promise<boolean | void> | void;
  onSelect: (listing: CareerListingDTO) => void;
  className?: string;
}

export const JobCard: React.FC<JobCardProps> = ({
  listing,
  isSaved,
  onToggleSave,
  onSelect,
  className = '',
}) => {
  // Extract initials for fallback logo
  const initials = listing.companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || listing.companyName.slice(0, 2).toUpperCase();

  const isExpired = listing.isClosed || isDeadlineExpired(listing.applicationDeadline);

  // Badge mapping for jobs
  const getBadge = () => {
    if (listing.badgeType === 'urgent' || listing.companyName.toLowerCase().includes('amazon')) {
      return { label: 'Hot', className: 'bg-rose-50 text-rose-600 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40' };
    }
    if (listing.badgeType === 'popular' || listing.companyName.toLowerCase().includes('zomato')) {
      return { label: 'Popular', className: 'bg-blue-50 text-blue-600 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40' };
    }
    if (listing.companyName.toLowerCase().includes('infosys')) {
      return { label: 'Urgent', className: 'bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40' };
    }
    if (listing.workplaceType?.toLowerCase() === 'remote' || listing.companyName.toLowerCase().includes('flipkart')) {
      return { label: 'Remote', className: 'bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40' };
    }
    return { label: 'Hiring', className: 'bg-indigo-50 text-indigo-600 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40' };
  };

  const badge = getBadge();

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`View details for ${listing.title} at ${listing.companyName}`}
      onClick={() => onSelect(listing)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(listing);
        }
      }}
      className={`group relative bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isExpired 
          ? 'border-slate-200/60 dark:border-slate-800 opacity-80' 
          : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/50'
      } p-3.5 ${className}`}
    >
      <div className="space-y-2">
        {/* Row 1: Company Logo + Name + Badge + Bookmark */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              {listing.companyLogoUrl ? (
                <img
                  src={listing.companyLogoUrl}
                  alt={listing.companyName}
                  className="w-full h-full object-contain p-0.5"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                  {initials || <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs truncate" title={listing.companyName}>
                  {listing.companyName}
                </span>

                {badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${badge.className} tracking-wide shrink-0`}>
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <BookmarkButton
            itemId={listing.id}
            itemTitle={listing.title}
            itemType="job"
            isSaved={isSaved}
            onToggle={onToggleSave}
            variant="icon-only"
            className="shrink-0 -mr-1 -mt-1 scale-90"
          />
        </div>

        {/* Row 2: Job Role Title */}
        <div>
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 tracking-tight"
            title={listing.title}
          >
            {listing.title}
          </h3>
        </div>

        {/* Row 3: Skill / Domain Tags */}
        {listing.requiredSkills && listing.requiredSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {listing.requiredSkills.slice(0, 2).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200/50 dark:border-slate-700/50 truncate max-w-[120px]"
              >
                {skill}
              </span>
            ))}
            {listing.requiredSkills.length > 2 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold border border-slate-200/50 dark:border-slate-700/50">
                +{listing.requiredSkills.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Row 4: Location & Experience */}
        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium shrink-0">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span>{listing.experienceLevel || '0 - 2 years'}</span>
          </div>
        </div>

        {/* Row 5: Facts Grid (Job Type + Salary CTC) */}
        <div className="space-y-1 pt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{listing.duration || 'Full-time'}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
            <Wallet className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>{listing.stipendOrSalaryFormatted || listing.stipendOrSalary || 'Competitive CTC'}</span>
          </div>
        </div>
      </div>

      {/* Row 6: Bottom Action (Full-width Dark Navy Button matching mockup) */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          disabled={isExpired}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(listing);
          }}
          className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition duration-200 shadow-xs focus:outline-none focus-visible:ring-2 ${
            isExpired
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-[#0F172A] hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white focus-visible:ring-slate-900 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600'
          }`}
        >
          <span>{isExpired ? 'Applications Closed' : 'Apply Now'}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
};

export default JobCard;
