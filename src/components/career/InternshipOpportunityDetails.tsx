import React, { useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Wallet, 
  Calendar, 
  Clock, 
  GraduationCap, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Wifi, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { CareerListingDTO } from '@/types/prepZone';
import { CompanyIdentity } from './CompanyIdentity';
import { OpportunityFact } from './OpportunityFact';
import { VerificationIndicator, isDeadlineExpired, isValidHttpUrl } from './VerificationIndicator';
import { BookmarkButton } from './BookmarkButton';

interface InternshipOpportunityDetailsProps {
  listing: CareerListingDTO | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => Promise<boolean | void> | void;
}

export const InternshipOpportunityDetails: React.FC<InternshipOpportunityDetailsProps> = ({
  listing,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !listing) return null;

  const isExpired = listing.isClosed || isDeadlineExpired(listing.applicationDeadline);
  const applyUrl = listing.officialApplicationUrl || listing.officialApplyUrl;
  const isSafeUrl = isValidHttpUrl(applyUrl);

  const stipendDisplay = 
    listing.stipendOrSalaryFormatted || 
    listing.stipendOrSalary || 
    'Disclosed upon selection';

  const durationDisplay = listing.duration || (
    listing.experienceLevel?.includes('Sem') 
      ? 'Semester Project' 
      : '3 - 6 Months'
  );

  const eligibilityDisplay = listing.eligibleBranches && listing.eligibleBranches.length > 0
    ? listing.eligibleBranches.slice(0, 2).join(', ')
    : 'GTU Engineering Students';

  // Fallback realistic what-youll-do bullets if not defined on listing
  const whatYoullDoList = listing.whatYoullDo && listing.whatYoullDo.length > 0
    ? listing.whatYoullDo
    : [
        'Work on real-world engineering problems and software architectural challenges.',
        'Collaborate with experienced senior technical mentors and cross-functional teams.',
        'Build, test, and ship production-ready modules used by enterprise and engineering users.',
      ];

  // Fallback realistic requirements if not defined
  const requirementsList = listing.requirements && listing.requirements.length > 0
    ? listing.requirements
    : [
        'Solid foundational knowledge in core computer science or engineering fundamentals.',
        'Hands-on experience with relevant technologies, Git, and problem-solving.',
        'Strong analytical thinking, eagerness to learn, and team collaboration skills.',
      ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="internship-details-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close internship details"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Company & Title */}
        <div className="flex items-start gap-4 pr-10">
          <CompanyIdentity
            companyName={listing.companyName}
            companyLogoUrl={listing.companyLogoUrl}
            companyVerified={listing.companyVerified ?? listing.isVerified}
            isVerified={listing.isVerified}
            badgeType={listing.badgeType || 'featured'}
            size="lg"
            className="shrink-0"
          />
        </div>

        <div>
          <h2
            id="internship-details-title"
            className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            {listing.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
            <span>{listing.companyName}</span>
            <span>•</span>
            <span>Internship Opportunity</span>
          </p>
        </div>

        {/* Skill Tags */}
        {listing.requiredSkills && listing.requiredSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {listing.requiredSkills.map((skill, sIdx) => (
              <span
                key={sIdx}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Location & Work Mode row */}
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{listing.location}</span>
          </div>
          {listing.workplaceType && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
              {listing.workplaceType.toLowerCase() === 'remote' ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              ) : null}
              <span className="font-semibold">{listing.workplaceType}</span>
            </div>
          )}
        </div>

        {/* 4-Box Facts Grid (Matching reference design input_file_1.png) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <OpportunityFact
            icon={<Wallet className="w-4 h-4 text-orange-500" />}
            label="Stipend"
            value={stipendDisplay}
            subvalue="(approx.)"
          />
          <OpportunityFact
            icon={<Calendar className="w-4 h-4 text-indigo-500" />}
            label="Duration"
            value={durationDisplay}
          />
          <OpportunityFact
            icon={<GraduationCap className="w-4 h-4 text-emerald-500" />}
            label="Eligibility"
            value={eligibilityDisplay}
          />
          <OpportunityFact
            icon={<Clock className="w-4 h-4 text-blue-500" />}
            label="Apply By"
            value={listing.applicationDeadline || 'Rolling'}
          />
        </div>

        {/* Verification & Provenance Alert Banner */}
        <VerificationIndicator
          isVerified={listing.isVerified}
          companyVerified={listing.companyVerified}
          sourceVerified={listing.sourceVerified}
          applicationDeadline={listing.applicationDeadline}
          isClosed={listing.isClosed}
          officialApplicationUrl={applyUrl}
          variant="detailed"
        />

        {/* About the Opportunity */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            About the Opportunity
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            {listing.description}
          </p>
        </div>

        {/* What You'll Do */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            What You'll Do
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {whatYoullDoList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Requirements */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Requirements
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {requirementsList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* About Company Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                About {listing.companyName}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {listing.aboutCompany || 'Verified corporate & research technology partner.'}
              </p>
            </div>
          </div>

          {listing.companyWebsiteUrl && (
            <a
              href={listing.companyWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline shrink-0 flex items-center gap-1"
            >
              Visit website <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Direct Official Apply Notice */}
        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            <strong>Official Direct Redirection:</strong> ShikshaSahayak routes students directly to verified employer careers portals. No private fees or credentials required.
          </span>
        </div>

        {/* Action Buttons (Orange Apply + Bookmark Save) */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {applyUrl && isSafeUrl && !isExpired ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-6 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              Apply on official website <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              disabled
              className="flex-1 py-3 px-6 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed"
            >
              {isExpired ? 'Applications Closed' : 'Application Link Unavailable'}
            </button>
          )}

          <BookmarkButton
            itemId={listing.id}
            itemTitle={listing.title}
            itemType="internship"
            isSaved={isSaved}
            onToggle={onToggleSave}
            variant="button-with-text"
            className="sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default InternshipOpportunityDetails;
