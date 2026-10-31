import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Wallet, 
  Calendar, 
  Clock, 
  GraduationCap, 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Check, 
  AlertCircle,
  Briefcase,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { CareerListingDTO } from '@/types/prepZone';
import { CompanyIdentity } from '../../components/career/CompanyIdentity';
import { isValidHttpUrl, isDeadlineExpired } from '../../components/career/VerificationIndicator';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';

export const CareerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [listing, setListing] = useState<CareerListingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark } = useLearningEcosystem();
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedListings, setRelatedListings] = useState<CareerListingDTO[]>([]);

  // Fetch opportunity details
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/career/listings?id=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error('Failed to load opportunity details');
        const data = await res.json() as { success: boolean; listing?: CareerListingDTO; listings?: CareerListingDTO[] };
        
        if (!isMounted) return;

        const found = data.listing || (data.listings && data.listings[0]);
        if (found) {
          setListing(found);
          // Update dynamic SEO page title
          document.title = `${found.title} at ${found.companyName} | ShikshaSahayak Career Hub`;
        } else {
          setError('Opportunity not found or may have been unlisted.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Unable to connect to career service');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [id]);

  // Fetch 3 related listings for recommendations
  useEffect(() => {
    if (!listing) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/career/listings?type=${listing.listingType}`);
        if (res.ok) {
          const data = await res.json() as { success: boolean; listings?: CareerListingDTO[] };
          if (data.listings) {
            const others = data.listings.filter(l => l.id !== listing.id).slice(0, 3);
            setRelatedListings(others);
          }
        }
      } catch {}
    };
    fetchRelated();
  }, [listing]);

  // Check and sync bookmark state
  useEffect(() => {
    if (!id) return;
    try {
      const stored = localStorage.getItem('shiksha_saved_jobs');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setIsSaved(parsed.includes(id));
      }
    } catch {}
  }, [id]);

  const toggleSave = async () => {
    if (!id || !listing) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      const stored = localStorage.getItem('shiksha_saved_jobs');
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      const updated = nextSaved ? Array.from(new Set([...parsed, id])) : parsed.filter(i => i !== id);
      localStorage.setItem('shiksha_saved_jobs', JSON.stringify(updated));

      if (nextSaved) {
        addBookmark({
          targetId: id,
          title: listing.title,
          url: location.pathname,
          itemType: listing.listingType === 'JOB' ? 'job' : 'internship',
          subjectCode: listing.companyName,
        });

        await fetch('/api/student/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceId: id,
            resourceType: listing.listingType === 'JOB' ? 'job' : 'internship',
            title: listing.title,
            url: location.pathname,
          }),
        });
      } else {
        removeBookmark(id);
        await fetch(`/api/student/bookmarks?resourceId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      }
    } catch {}
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-44 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
            <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
          </div>
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Opportunity Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          {error || 'This listing might have expired, closed, or moved to another link.'}
        </p>
        <button
          onClick={() => navigate('/career/internships')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunities</span>
        </button>
      </div>
    );
  }

  const isExpired = listing.isClosed || isDeadlineExpired(listing.applicationDeadline);
  const applyUrl = listing.officialApplicationUrl;
  const isSafeUrl = isValidHttpUrl(applyUrl);

  const stipendDisplay = listing.stipendOrSalaryFormatted || listing.stipendOrSalary || 'Disclosed during interview';
  const durationDisplay = listing.duration || (listing.listingType === 'INTERNSHIP' ? '3 - 6 Months' : 'Full-time');
  const isInternship = listing.listingType === 'INTERNSHIP';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6 pb-20">
      {/* Top Breadcrumb & Back Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/career/internships" className="hover:text-orange-600 transition flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Career Hub</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link 
            to={isInternship ? '/career/internships' : '/career/jobs'} 
            className="hover:text-orange-600 transition font-medium"
          >
            {isInternship ? 'Internships' : 'Jobs'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-bold truncate max-w-[180px] sm:max-w-xs">
            {listing.title}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied Link' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={toggleSave}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs ${
              isSaved 
                ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/40 dark:border-orange-900/50' 
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-orange-500" /> : <Bookmark className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <header className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <CompanyIdentity
              companyName={listing.companyName}
              companyLogoUrl={listing.companyLogoUrl}
              companyVerified={listing.companyVerified ?? listing.isVerified}
              isVerified={listing.isVerified}
              badgeType={listing.badgeType}
              size="lg"
            />

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                <span>Posted {listing.postedDate || 'recently'}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% Verified Opportunity
                </span>
              </div>
            </div>
          </div>

          {/* Quick Apply Button on Desktop */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <a
              href={isSafeUrl && !isExpired ? applyUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
                isExpired
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20 shadow-md'
              }`}
            >
              <span>{isExpired ? 'Applications Closed' : 'Apply on Official Portal'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            {listing.applicationDeadline && (
              <span className="text-[11px] text-center text-slate-500 font-medium">
                Deadline: {listing.applicationDeadline}
              </span>
            )}
          </div>
        </div>

        {/* 4 Quick Spec Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {listing.location}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>{isInternship ? 'Stipend' : 'Package (CTC)'}</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {stipendDisplay}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Duration / Type</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {durationDisplay}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Eligibility</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {listing.eligibleBranches && listing.eligibleBranches.length > 0 ? listing.eligibleBranches[0] : 'Engineering'}
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Overview */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-2xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-orange-500" />
              <span>Role Overview</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {listing.description}
            </p>
          </section>

          {/* Section 2: Key Responsibilities (What You'll Do) */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3.5 shadow-2xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>What You'll Do</span>
            </h2>
            <div className="space-y-2.5">
              {(listing.whatYoullDo && listing.whatYoullDo.length > 0
                ? listing.whatYoullDo
                : [
                    'Develop high-quality, production-ready modules collaborating with core team engineers.',
                    'Participate in code reviews, technical architecture sessions, and sprint meetings.',
                    'Solve real-world scalability and performance challenges in a high-growth environment.',
                  ]
              ).map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="leading-snug">{bullet}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Required Skills & Tech Stack */}
          {listing.requiredSkills && listing.requiredSkills.length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3.5 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Required Skills & Tech Stack</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {listing.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Eligibility Criteria */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3.5 shadow-2xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <span>Eligibility & Target Audience</span>
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">Target Branches:</span>
                <span>{listing.eligibleBranches ? listing.eligibleBranches.join(', ') : 'All Engineering Branches'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">Experience Level:</span>
                <span>{listing.experienceLevel || 'Intern / Entry Level'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">Workplace Model:</span>
                <span>{listing.workplaceType}</span>
              </div>
            </div>
          </section>

          {/* Section 5: Trust & Fraud Protection Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-slate-800 border border-blue-200/80 dark:border-blue-900/40 p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                ShikshaSahayak Student Safety Guarantee
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ShikshaSahayak strictly verifies all job and internship listings. We never charge students application fees or redirect to unverified test portals.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Sticky Application Box & Company Card */}
        <aside className="space-y-5 lg:sticky lg:top-20">
          {/* Quick Apply Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                OFFICIAL HIRING APPLICATION
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ready to take the next step?
              </h3>
              <p className="text-xs text-slate-500">
                Submit your CV directly to {listing.companyName}'s official applicant portal.
              </p>
            </div>

            <a
              href={isSafeUrl && !isExpired ? applyUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition ${
                isExpired
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20 shadow-md'
              }`}
            >
              <span>{isExpired ? 'Applications Closed' : 'Apply on Official Site'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={toggleSave}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition border flex items-center justify-center gap-2 ${
                isSaved
                  ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/40'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-orange-500" /> : <Bookmark className="w-4 h-4" />}
              <span>{isSaved ? 'Saved in My Bookmarks' : 'Save Opportunity for Later'}</span>
            </button>
          </div>

          {/* About Company Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ABOUT THE EMPLOYER
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {listing.aboutCompany || `${listing.companyName} is a verified employer hiring engineering talent via ShikshaSahayak.`}
            </div>
            {listing.companyWebsiteUrl && (
              <a
                href={listing.companyWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-orange-600 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Visit Company Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Similar Opportunities */}
          {relatedListings.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                RELATED OPPORTUNITIES
              </h3>
              <div className="space-y-2.5">
                {relatedListings.map(rel => (
                  <Link
                    key={rel.id}
                    to={rel.listingType === 'INTERNSHIP' ? `/career/internships/${rel.id}` : `/career/jobs/${rel.id}`}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-orange-500/40 block transition group"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 truncate">
                      {rel.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {rel.companyName} • {rel.location}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CareerDetailPage;
