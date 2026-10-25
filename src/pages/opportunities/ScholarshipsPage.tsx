import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Calendar, 
  FileCheck2, 
  Sparkles, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  ShieldCheck, 
  AlertCircle, 
  IndianRupee,
  Building,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { ScholarshipDTO } from '@/types';
import { fetchWithAuth } from '../../api/client';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';

export const ScholarshipsPage: React.FC = () => {
  const [scholarships, setScholarships] = useState<ScholarshipDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedScholarship, setSelectedScholarship] = useState<ScholarshipDTO | null>(null);
  const { bookmarks, addBookmark, removeBookmark } = useLearningEcosystem();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Load saved bookmarks
  useEffect(() => {
    try {
      const stored = localStorage.getItem('padhaku_saved_scholarships');
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      const fromEcosystem = bookmarks.filter(b => b.itemType === 'scholarship').map(b => b.targetId);
      const merged = Array.from(new Set([...parsed, ...fromEcosystem]));
      setSavedIds(merged);
    } catch {}
  }, [bookmarks]);

  const toggleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const willBeSaved = !savedIds.includes(id);
    let updated: string[];
    if (willBeSaved) {
      updated = [...savedIds, id];
    } else {
      updated = savedIds.filter(item => item !== id);
    }
    setSavedIds(updated);
    try {
      localStorage.setItem('padhaku_saved_scholarships', JSON.stringify(updated));
    } catch {}

    const item = scholarships.find(s => s.id === id);
    if (willBeSaved) {
      addBookmark({
        targetId: id,
        title: item?.title || 'Scholarship Opportunity',
        url: `/opportunities/scholarships`,
        itemType: 'scholarship',
        subjectCode: item?.provider || item?.category
      });
    } else {
      removeBookmark(id);
    }

    try {
      await fetchWithAuth('/api/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarshipId: id })
      });
    } catch (err) {
      console.warn('Backend bookmark toggle notice:', err);
    }
  };

  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      const res = await fetchWithAuth(`/api/scholarships?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load scholarships');
      const data = await res.json() as { success: boolean; scholarships: ScholarshipDTO[]; savedIds?: string[] };
      if (data.success) {
        setScholarships(data.scholarships || []);
        if (data.savedIds && data.savedIds.length > 0) {
          setSavedIds(prev => Array.from(new Set([...prev, ...(data.savedIds || [])])));
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, [selectedCategory]);

  const filtered = scholarships.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.provider.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Opportunities' },
          { label: 'Scholarships Directory' }
        ]}
        fallbackPath="/student"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 border border-navy-800 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Gujarat & National Financial Aid Directory
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Verified Engineering <span className="text-brand-orange">Scholarships & Grants</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Discover verified state government, central AICTE, and premier corporate scholarships. Check step-by-step document checklists and apply directly on official government portals.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Vetted Official Application Links
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-brand-orange" /> Complete Document Checklists
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by scheme name, provider, or keyword (e.g. MYSY, Pragati, Reliance)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Category:</span>
          {['all', 'State Govt', 'National', 'Corporate / Foundation', 'Engineering Merit'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Schemes' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="animate-pulse bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 p-6 rounded-2xl h-56" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-navy-900 border border-dashed border-slate-200 dark:border-navy-700 rounded-3xl space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-navy-950 dark:text-white">No Scholarships Match Your Query</h3>
          <p className="text-xs text-slate-500">Try changing your filters or searching for general keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => {
            const isSaved = savedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedScholarship(item)}
                className="group bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 hover:border-brand-orange/60 dark:hover:border-brand-orange/60 transition-all p-6 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-brand-orange uppercase tracking-wider block">
                        {item.provider}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-navy-950 dark:text-white group-hover:text-brand-orange transition line-clamp-2">
                        {item.title}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => toggleSave(item.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-navy-800 transition"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-5 h-5 text-brand-orange fill-brand-orange/20" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200/50">
                      {item.amountFormatted}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-navy-800 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                      {item.category}
                    </span>
                    {item.maxFamilyIncomeLpa && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 text-[11px]">
                        Income &lt; ₹{item.maxFamilyIncomeLpa} LPA
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Key Criteria Preview */}
                  <div className="space-y-1 pt-1">
                    {item.eligibilityCriteria.slice(0, 2).map((crit, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{crit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Deadline: {item.applicationDeadline || 'Rolling'}
                  </span>
                  <span className="text-brand-orange font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Eligibility & Documents <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Document Checklist Modal */}
      {selectedScholarship && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedScholarship(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 hover:text-navy-950 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-orange uppercase tracking-wider block">
                {selectedScholarship.provider}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white">
                {selectedScholarship.title}
              </h2>
              <div className="pt-1">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm border border-emerald-200/50 inline-block">
                  {selectedScholarship.amountFormatted}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedScholarship.description}
            </p>

            {/* Eligibility Criteria Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Eligibility Requirements
              </h4>
              <div className="space-y-2">
                {selectedScholarship.eligibilityCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-navy-950 p-3 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Documents Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Required Verification Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedScholarship.requiredDocuments.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-100 dark:border-navy-800 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <FileCheck2 className="w-4 h-4 text-brand-orange shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer & Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Official Application Notice:</strong> You will be directed to the official government / foundation portal. Keep all scanned PDF documents ready before applying.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={selectedScholarship.officialApplicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-6 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  Apply on Official Portal <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedScholarship(null)}
                  className="py-3 px-6 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipsPage;
