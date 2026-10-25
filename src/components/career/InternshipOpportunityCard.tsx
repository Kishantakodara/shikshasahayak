import React from 'react';
import { 
  MapPin, 
  Wallet, 
  Calendar, 
  Clock, 
  ArrowRight, 
  GraduationCap, 
  ExternalLink,
  Wifi,
  Sparkles
} from 'lucide-react';
import { CareerListingDTO } from '@/types/prepZone';
import { CompanyIdentity, CompanyBadgeType } from './CompanyIdentity';
import { OpportunityFact } from './OpportunityFact';
import { VerificationIndicator, isDeadlineExpired, isValidHttpUrl } from './VerificationIndicator';
import { BookmarkButton } from './BookmarkButton';

export interface InternshipOpportunityCardProps {
  listing: CareerListingDTO;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => Promise<boolean | void> | void;
  onSelect: (listing: CareerListingDTO) => void;
  className?: string;
  variant?: 'compact' | 'standard' | 'featured';
}

export const InternshipOpportunityCard: React.FC<InternshipOpportunityCardProps> = ({
  listing,
  isSaved,
  onToggleSave,
  onSelect,
  className = '',
  variant = 'standard',
}) => {
  // Strict safety invariant: Do not render non-internship records in Internship Studio
  if (listing.listingType !== 'INTERNSHIP') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[InternshipOpportunityCard] Safety check: Skipped rendering item ${listing.id} because listingType is "${listing.listingType}". Internship card only accepts INTERNSHIP.`
      );
    }
    return null;
  }

  const isExpired = listing.isClosed || isDeadlineExpired(listing.applicationDeadline);
  const applyUrl = listing.officialApplicationUrl || listing.officialApplyUrl;
  const hasValidUrl = isValidHttpUrl(applyUrl);

  // Derive badge type if not explicitly set
  let badgeType: CompanyBadgeType | undefined = listing.badgeType;
  if (!badgeType) {
    if (listing.isVerified && listing.title.toLowerCase().includes('engineer')) {
      badgeType = 'featured';
    } else if (listing.stipendOrSalary && (listing.stipendOrSalary.includes('25,000') || listing.stipendOrSalary.includes('1,00,000') || listing.stipendOrSalary.includes('80,000'))) {
      badgeType = 'high-demand';
    } else if (listing.companyName.toLowerCase().includes('tcs') || listing.companyName.toLowerCase().includes('google')) {
      badgeType = 'popular';
    }
  }

  // Format stipend gracefully
  const stipendDisplay = 
    listing.stipendOrSalaryFormatted || 
    listing.stipendOrSalary || 
    'Stipend Disclosed in Interview';

  // Format duration gracefully
  const durationDisplay = listing.duration || (
    listing.experienceLevel?.includes('Sem') 
      ? 'Semester Project' 
      : '3 - 6 Months'
  );

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
      className={`group relative bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
        isExpired 
          ? 'border-slate-200/60 dark:border-slate-800 opacity-80' 
          : 'border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 dark:hover:border-orange-500/50'
      } p-3.5 ${className}`}
    >
      <div className="space-y-2">
        {/* Row 1: Company Identity + Bookmark Button */}
        <div className="flex items-start justify-between gap-2">
          <CompanyIdentity
            companyName={listing.companyName}
            companyLogoUrl={listing.companyLogoUrl}
            companyVerified={listing.companyVerified ?? listing.isVerified}
            isVerified={listing.isVerified}
            badgeType={badgeType}
            size="sm"
            className="flex-1 min-w-0"
          />

          <BookmarkButton
            itemId={listing.id}
            itemTitle={listing.title}
            itemType="internship"
            isSaved={isSaved}
            onToggle={onToggleSave}
            variant="icon-only"
            className="shrink-0 -mr-1 -mt-1 scale-90"
          />
        </div>

        {/* Row 2: Internship Role Title */}
        <div>
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 tracking-tight"
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

        {/* Row 4: Clean Stacked Facts matching mockup */}
        <div className="space-y-1 pt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{listing.location || 'Remote'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Wallet className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{stipendDisplay}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{durationDisplay}</span>
          </div>
        </div>
      </div>

      {/* Row 5: Bottom Action (Full-width Dark Navy Button matching mockup) */}
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
              : 'bg-[#0A1628] hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-700 text-white focus-visible:ring-slate-900 group-hover:bg-[#15253F]'
          }`}
        >
          <span>{isExpired ? 'Applications Closed' : 'Apply Now'}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
};

export default InternshipOpportunityCard;
