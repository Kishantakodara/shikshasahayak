import React, { useEffect, useState, useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Loader2,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Compass,
  GraduationCap,
  Layers,
  ChevronRight,
  FileText,
  Filter,
  CheckCircle2,
  Cpu,
  Monitor,
  Zap,
  Radio,
  Cog,
  Building2,
  FlaskConical,
  ScrollText,
} from 'lucide-react';
import BrowseShell from '../../components/browse/BrowseShell';
import { apiClient } from '../../api/client';
import { Branch } from '../../types';
import { isMaterialType, normalizeMaterialType, MATERIAL_TYPES, MaterialTypeKey } from '../../content/browse';
import { browsePaths } from '../../utils/browsePaths';
import { getCanonicalBranchSlug, getCanonicalBranchName } from '../../utils/branchUtils';
import AdBlock from '../../components/ads/AdBlock';
import SeoContentBlock from '../../components/ads/SeoContentBlock';
import { useAuth } from '../../context/AuthContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';

const BRANCH_ICONS: Record<string, React.ElementType> = {
  'computer-engineering': Monitor,
  'information-technology': Cpu,
  'electrical-engineering': Zap,
  'electronics-and-communication': Radio,
  'mechanical-engineering': Cog,
  'civil-engineering': Building2,
  'chemical-engineering': FlaskConical,
};

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const TypeAboutPage: React.FC = () => {
  const { type = 'study-material' } = useParams<{ type: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { academicProfile, isExploreMode, setExploreMode, isLoading: isProfileLoading } = useStudentAcademic();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchIndexItems, setSearchIndexItems] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingSearchIndex, setLoadingSearchIndex] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state to track if user clicked "Explore all" on this page
  // By default, if the student has a profile, we do NOT show explore mode unless ?explore=all is in URL
  const isExploreFromUrl = searchParams.get('explore') === 'all' || searchParams.get('explore') === 'true';
  const [exploreAllActive, setExploreAllActive] = useState<boolean>(isExploreFromUrl);

  useEffect(() => {
    if (isExploreFromUrl) {
      setExploreAllActive(true);
    }
  }, [isExploreFromUrl]);

  // Filters for instant subject finder
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedSemFilter, setSelectedSemFilter] = useState<number | 'all'>('all');

  const materialTypeKey: MaterialTypeKey = normalizeMaterialType(type);
  const config = MATERIAL_TYPES[materialTypeKey];

  // 1. Fetch department branches
  useEffect(() => {
    setLoadingBranches(true);
    apiClient
      .getBranches()
      .then((data) => {
        const clean = data.filter(
          (b) => b.slug !== 'first-year' && !b.name.toLowerCase().includes('1st year')
        );
        setBranches(clean);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingBranches(false));
  }, []);

  // 2. Fetch search index for instant subject lookup
  useEffect(() => {
    setLoadingSearchIndex(true);
    apiClient
      .getSearchIndex()
      .then((res) => {
        let items: any[] = [];
        if (materialTypeKey === 'study-material') items = res.studyMaterials || [];
        else if (materialTypeKey === 'pyq') items = res.pyqs || [];
        else if (materialTypeKey === 'syllabus') items = res.syllabuses || [];
        else items = [...(res.studyMaterials || []), ...(res.pyqs || []), ...(res.syllabuses || [])];
        setSearchIndexItems(items);
      })
      .catch(() => {
        setSearchIndexItems([]);
      })
      .finally(() => setLoadingSearchIndex(false));
  }, [materialTypeKey]);

  const hasProfile = Boolean(
    currentUser &&
    academicProfile &&
    (academicProfile.branchId || academicProfile.branchName) &&
    Number(academicProfile.semester) > 0
  );

  const userBranchSlug = getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName) || 'computer-engineering';
  const userSem = Number(academicProfile?.semester) || 1;

  const userBranchObj = useMemo(() => {
    if (!userBranchSlug) return null;
    return (
      branches.find((b) => getCanonicalBranchSlug(b.slug || b.id) === userBranchSlug) ||
      branches.find((b) => (b.slug || '').toLowerCase() === userBranchSlug.toLowerCase()) ||
      null
    );
  }, [branches, userBranchSlug]);

  const userBranchName =
    academicProfile?.branchName ||
    userBranchObj?.name ||
    getCanonicalBranchName(userBranchSlug);

  const UserBranchIcon = BRANCH_ICONS[userBranchSlug] || Layers;

  // Determine whether to show personalized single-branch view
  const isPersonalized = hasProfile && !exploreAllActive;
  const navigate = useNavigate();

  const handleEnableExplore = () => {
    setExploreAllActive(true);
    setExploreMode(true);
    setSearchParams({ explore: 'all' }, { replace: true });
  };

  const handleDisableExplore = () => {
    setExploreAllActive(false);
    setExploreMode(false);
    navigate(browsePaths.semester(materialTypeKey, userBranchSlug, userSem));
  };

  // Filtered search results (used when in explore mode)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && selectedBranchFilter === 'all' && selectedSemFilter === 'all') {
      return [];
    }

    const q = searchQuery.toLowerCase().trim();

    return searchIndexItems
      .filter((item) => {
        // Query match
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const subjectNameMatch = (item.subjectName || '').toLowerCase().includes(q);
        const subjectCodeMatch = (item.subjectCode || '').toLowerCase().includes(q);
        const textMatches = !q || titleMatch || subjectNameMatch || subjectCodeMatch;

        // Branch match
        const branchMatches =
          selectedBranchFilter === 'all' ||
          item.departmentId === selectedBranchFilter ||
          (item.departmentId || '').toLowerCase().includes(selectedBranchFilter.toLowerCase());

        // Semester match
        const semMatches =
          selectedSemFilter === 'all' || Number(item.semester) === Number(selectedSemFilter);

        return textMatches && branchMatches && semMatches;
      })
      .slice(0, 24);
  }, [searchIndexItems, searchQuery, selectedBranchFilter, selectedSemFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedBranchFilter !== 'all' || selectedSemFilter !== 'all';

  const typeBadgeLabel = useMemo(() => {
    if (materialTypeKey === 'pyq') return 'GTU PYQ Papers';
    if (materialTypeKey === 'study-material') return 'GTU Study Notes';
    return 'GTU Official Syllabus';
  }, [materialTypeKey]);

  const typeSubtitle = useMemo(() => {
    if (materialTypeKey === 'pyq') {
      return 'Direct access to previous year question papers and solution archives for your enrolled department and semester.';
    }
    if (materialTypeKey === 'study-material') {
      return 'Direct access to unit-wise lecture notes, formula sheets, and study materials for your enrolled department and semester.';
    }
    return 'Direct access to official GTU syllabus, credit structures, and teaching schemes for your enrolled department and semester.';
  }, [materialTypeKey]);

  const typeDescription = useMemo(() => {
    if (materialTypeKey === 'pyq') {
      return 'Access verified GTU previous year question papers, exam papers, and question archives organized semester-wise for all GTU engineering branches.';
    }
    if (materialTypeKey === 'study-material') {
      return 'Access verified GTU unit notes, chapter summaries, handwritten formula sheets, and study materials organized semester-wise for all GTU engineering branches.';
    }
    return 'Access verified GTU teaching schemes, lab credits, and official university syllabus outlines organized semester-wise for all GTU engineering branches.';
  }, [materialTypeKey]);

  const TypeIcon = useMemo(() => {
    if (materialTypeKey === 'pyq') return FileText;
    if (materialTypeKey === 'study-material') return BookOpen;
    return ScrollText;
  }, [materialTypeKey]);

  // 1. While user profile is loading for a logged-in user, display loader until profile status is known
  if (currentUser && isProfileLoading) {
    return (
      <BrowseShell
        crumbs={[{ label: config.folderLabel }]}
        eyebrow={`GTU Official ${config.folderLabel}`}
        title={config.title}
        description={typeDescription}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </div>
      </BrowseShell>
    );
  }

  // 2. Direct open enrolled branch & semester for logged-in user (unless explicitly in explore mode)
  if (currentUser && hasProfile && !exploreAllActive && !isExploreFromUrl) {
    return <Navigate to={browsePaths.semester(materialTypeKey, userBranchSlug, userSem)} replace />;
  }

  return (
    <BrowseShell
      crumbs={[{ label: config.folderLabel }]}
      eyebrow={`GTU Official ${config.folderLabel}`}
      title={config.title}
      description={typeDescription}
    >
      {/* Loading state while checking user profile */}
      {currentUser && isProfileLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </div>
      ) : isPersonalized ? (
        /* PERSONALIZED VIEW: DIRECT SHOW USER'S BRANCH & SEMESTER */
        <div className="mb-10 animate-fade-in">
          {/* Section Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized For Your Profile</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              {userBranchName}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {typeSubtitle}
            </p>
          </div>

          {/* Student Branch & Semester Primary Card */}
          <div className="p-6 sm:p-7 bg-white dark:bg-navy-800 rounded-2xl border border-brand-orange/40 dark:border-brand-orange/40 ring-1 ring-brand-orange/20 shadow-md">
            {/* Header row with branch icon and primary CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center shrink-0 shadow-sm">
                  <UserBranchIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {userBranchObj?.code && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-300">
                        Code {userBranchObj.code}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Your Branch
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange flex items-center gap-1">
                      <TypeIcon className="w-3 h-3" />
                      {typeBadgeLabel}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white mt-1">
                    {academicProfile?.degreeName || userBranchObj?.program_name || 'GTU Bachelor of Engineering'}
                  </h3>
                </div>
              </div>

              {/* Direct Primary Semester Button */}
              <Link
                to={browsePaths.semester(materialTypeKey, userBranchSlug, userSem)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 shrink-0 group"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Semester {userSem} {config.folderLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Quick 1-Click Semester Selector for User's Branch */}
            <div className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <p className="text-xs font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                  Jump to Any Semester in {userBranchObj?.short_name || 'Your Branch'}:
                </p>
                <span className="text-[11px] text-gray-400">
                  Click any semester to view its {config.folderLabel.toLowerCase()} catalog
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {SEMESTERS.map((sem) => {
                  const isCurrent = sem === userSem;
                  return (
                    <Link
                      key={sem}
                      to={browsePaths.semester(materialTypeKey, userBranchSlug, sem)}
                      className={`relative px-3 py-3 rounded-xl text-center font-bold text-xs transition-all border flex flex-col items-center justify-center gap-1 ${
                        isCurrent
                          ? 'bg-brand-orange text-white border-brand-orange shadow-md ring-2 ring-brand-orange/30'
                          : 'bg-gray-50 dark:bg-navy-900 text-navy-900 dark:text-gray-200 border-gray-100 dark:border-navy-700/60 hover:bg-orange-50 dark:hover:bg-navy-700 hover:border-brand-orange/40 hover:text-brand-orange'
                      }`}
                    >
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-full bg-white/20 text-white leading-none">
                          Current
                        </span>
                      )}
                      <span>Sem {sem}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Branch Full Page Link */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Link
                  to={`${browsePaths.branch(materialTypeKey, userBranchSlug)}?explore=true`}
                  className="text-xs font-bold text-brand-orange hover:text-orange-600 transition-colors flex items-center gap-1.5 group"
                >
                  <span>Browse all {userBranchName} subjects & folders</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-semibold transition"
                >
                  Change enrolled branch / semester
                </Link>
              </div>
            </div>
          </div>

          {/* Explore All Departments & Finder Trigger */}
          <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-dashed border-gray-200 dark:border-navy-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                  Looking for other engineering departments or {config.folderLabel.toLowerCase()}?
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Search across all GTU subjects, codes, or browse other branch catalogs.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnableExplore}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-navy-800 hover:bg-gray-100 dark:hover:bg-navy-700 text-navy-900 dark:text-white border border-gray-200 dark:border-navy-700 font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-brand-orange" />
              <span>Explore All Departments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* EXPLORE MODE / GUEST VIEW: SHOW INSTANT FINDER & ALL DEPARTMENTS */
        <div className="animate-fade-in">
          {/* Explore Mode Active Notice (if user has profile) */}
          {hasProfile && exploreAllActive && (
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                <Compass className="w-4 h-4 text-purple-500 shrink-0" />
                <span>
                  Explore Mode Active: Browsing all engineering departments and semesters freely.
                </span>
              </div>
              <button
                onClick={handleDisableExplore}
                className="w-full sm:w-auto px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold transition shrink-0 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Back to My {userBranchObj?.short_name || 'Branch'}</span>
              </button>
            </div>
          )}

          {/* Guest Tip (if user has no profile set) */}
          {!hasProfile && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-navy-900 dark:text-gray-200">
                <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                <span>
                  <strong>Tip:</strong> Log in or set your engineering branch to directly view your own {config.folderLabel.toLowerCase()} and semester schemes.
                </span>
              </div>
              <Link
                to="/register"
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs shrink-0 text-center"
              >
                Set Profile
              </Link>
            </div>
          )}

          {/* Instant Subject & Document Finder */}
          <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-brand-orange" />
                  <span>Instant Subject & Document Finder</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Search across {config.folderLabel.toLowerCase()} by subject name, code, or filter by semester.
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBranchFilter('all');
                    setSelectedSemFilter('all');
                  }}
                  className="text-xs text-gray-400 hover:text-brand-orange font-bold transition flex items-center gap-1 self-start md:self-auto cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Type subject name or code (e.g. "DBMS", "3110014", "Mathematics", "Python")...`}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-xl text-sm font-medium text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Semester Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-navy-700/60">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Semester:
              </span>
              <button
                onClick={() => setSelectedSemFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSemFilter === 'all'
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700'
                }`}
              >
                All
              </button>
              {SEMESTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSemFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSemFilter === s
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700'
                  }`}
                >
                  Sem {s}
                </button>
              ))}
            </div>

            {/* Instant Search Results Dropdown/Grid */}
            {hasActiveFilters && (
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-navy-700/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Found {searchResults.length} matching {config.folderLabel.toLowerCase()}
                  </span>
                </div>

                {loadingSearchIndex ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      No direct matches found. Try searching by subject code (e.g. 3110014) or select your department below.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {searchResults.map((item) => {
                      const itemBranchSlug = getCanonicalBranchSlug(item.departmentId || userBranchSlug);
                      const itemSem = item.semester || 1;
                      const itemSubjectCode = item.subjectCode || item.code || '';
                      const itemSubjectSlug = itemSubjectCode.toLowerCase() || 'subject';

                      return (
                        <Link
                          key={item.id}
                          to={browsePaths.subject(materialTypeKey, itemBranchSlug, itemSem, itemSubjectSlug)}
                          className="p-4 bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-brand-orange dark:hover:border-brand-orange rounded-2xl transition-all flex flex-col justify-between group shadow-xs hover:shadow-md card-interactive"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-orange-500/10 text-brand-orange text-[10px] font-extrabold uppercase">
                                Sem {item.semester}
                              </span>
                              {item.subjectCode && (
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  {item.subjectCode}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-orange transition-colors line-clamp-2">
                              {item.subjectName || item.title}
                            </h5>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-brand-orange">
                            <span>Open {config.folderLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Choose Your Engineering Department */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-orange" />
                  <span>Choose Your Engineering Department</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Select your department below, or click any semester pill directly to open that semester catalog.
                </p>
              </div>
            </div>

            {loadingBranches ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-10 w-10 text-brand-orange animate-spin" />
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-8">{error}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {branches.map((branch) => {
                  const Icon = BRANCH_ICONS[branch.slug] || Layers;
                  const isUserBranch = currentUser && academicProfile?.branchId === branch.slug;

                  return (
                    <div
                      key={branch.id}
                      className={`relative p-5 sm:p-6 bg-white dark:bg-navy-800 rounded-2xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                        isUserBranch
                          ? 'border-brand-orange/60 dark:border-brand-orange/60 ring-1 ring-brand-orange/30'
                          : 'border-gray-200 dark:border-navy-700 hover:border-brand-orange/50 dark:hover:border-brand-orange/50'
                      }`}
                    >
                      {isUserBranch && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-extrabold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Your Branch</span>
                        </div>
                      )}

                      {/* Branch Header */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                Code {branch.code}
                              </span>
                              {branch.short_name && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-300">
                                  {branch.short_name}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-navy-900 dark:text-white leading-tight mt-0.5">
                              {branch.name}
                            </h4>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                          {branch.program_name || 'GTU Bachelor of Engineering'}
                        </p>

                        {/* Direct 1-Click Semester Navigation Pills */}
                        <div className="mb-4">
                          <p className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider mb-2">
                            Quick Semester Jump:
                          </p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {SEMESTERS.map((sem) => {
                              const canonicalSlug = getCanonicalBranchSlug(branch.slug || branch.id);
                              return (
                                <Link
                                  key={sem}
                                  to={browsePaths.semester(materialTypeKey, canonicalSlug, sem)}
                                  className="px-2 py-1.5 text-center bg-gray-50 dark:bg-navy-900 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange text-navy-900 dark:text-gray-200 rounded-lg text-xs font-bold transition-all border border-gray-100 dark:border-navy-700/60"
                                >
                                  Sem {sem}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Branch Full Page Link */}
                      <Link
                        to={browsePaths.branch(materialTypeKey, getCanonicalBranchSlug(branch.slug || branch.id))}
                        className="pt-3 border-t border-gray-100 dark:border-navy-700 flex items-center justify-between text-xs font-bold text-brand-orange hover:text-orange-600 transition-colors group"
                      >
                        <span>Browse All {branch.short_name || 'Branch'} Folders</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <AdBlock />

      {/* Informational & SEO Content */}
      <div className="my-8">
        <SeoContentBlock title={`Why use our GTU ${config.folderLabel}?`}>
          {config.aboutBody.map((paragraph, idx) => (
            <p key={idx} className="mb-3">
              {paragraph}
            </p>
          ))}
        </SeoContentBlock>
      </div>

      <AdBlock />
    </BrowseShell>
  );
};

export default TypeAboutPage;
