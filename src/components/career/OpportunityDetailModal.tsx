import React, { useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  ShieldCheck, 
  Bookmark, 
  BookmarkCheck, 
  X, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { CareerListingDTO } from '@/types';

interface OpportunityDetailModalProps {
  listing: CareerListingDTO | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !listing) return null;

  const isInternship = listing.listingType === 'INTERNSHIP';
  const accentColorClass = isInternship ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-600 dark:text-indigo-400';
  const badgeBgClass = isInternship 
    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40' 
    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40';
  const applyButtonClass = isInternship
    ? 'bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-500'
    : 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500';

  const initials = listing.companyName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const applyUrl = listing.officialApplicationUrl || listing.officialApplyUrl;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-listing-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close opportunity details"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header: Logo, Company & Role */}
        <div className="flex items-start gap-4 pr-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {listing.companyLogoUrl ? (
              <img 
                src={listing.companyLogoUrl} 
                alt={listing.companyName} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className={`text-base font-black ${accentColorClass}`}>
                {initials || <Building2 className="w-8 h-8" />}
              </span>
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {listing.companyName}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeBgClass}`}>
                {isInternship ? 'Internship' : 'Full-Time Job'}
              </span>
              {listing.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>

            <h2 id="modal-listing-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {listing.title}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{listing.location}</span>
              {listing.workplaceType && (
                <>
                  <span>•</span>
                  <span>{listing.workplaceType}</span>
                </>
              )}
              {listing.postedDate && (
                <>
                  <span>•</span>
                  <span>Posted: {listing.postedDate}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/70 dark:border-slate-800">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              {isInternship ? 'Monthly Stipend' : 'Expected CTC / Salary'}
            </span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {listing.stipendOrSalaryFormatted || listing.stipendOrSalary || 'Disclosed in Interview'}
            </p>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              Experience Level
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {listing.experienceLevel || (isInternship ? 'Internship (Engineering)' : 'Entry Level / Fresher')}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              Application Deadline
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {listing.applicationDeadline || 'Rolling Admissions'}
            </p>
          </div>
        </div>

        {/* Eligible Branches */}
        {listing.eligibleBranches && listing.eligibleBranches.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-slate-400" /> Target Disciplines & Eligibility
            </h4>
            <div className="flex flex-wrap gap-2">
              {listing.eligibleBranches.map((branch, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60"
                >
                  {branch}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Role Overview & Responsibilities */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-slate-400" /> Role Overview & Responsibilities
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            {listing.description}
          </p>
        </div>

        {/* Required Skills & Technologies */}
        {listing.requiredSkills && listing.requiredSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Required Skills & Technologies
            </h4>
            <div className="flex flex-wrap gap-2">
              {listing.requiredSkills.map((skill, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Official Portal Notice & Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span className="leading-relaxed">
              <strong>Official Direct Application Notice:</strong> ShikshaSahayak redirects you directly to the verified corporate, public sector, or research career portal. We never charge application fees, screen privately, or ask for credentials.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {applyUrl ? (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 py-3 px-6 ${applyButtonClass} text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2`}
              >
                Apply on Official Portal <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                disabled
                className="flex-1 py-3 px-6 bg-slate-200 text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed"
              >
                Applications Closed
              </button>
            )}

            <button
              type="button"
              onClick={(e) => onToggleSave(listing.id, e)}
              className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-600" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" /> Save
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
