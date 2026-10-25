import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, FileText, ChevronDown, SlidersHorizontal, Loader2, Download, Eye } from 'lucide-react';
import { apiClient } from '../api/client';
import { Branch, SubjectOffering, Material } from '../types';
import { SEMESTERS, formatSemester } from '../constants';

const PYQList: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subjects, setSubjects] = useState<SubjectOffering[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>('computer');
  const [selectedSemester, setSelectedSemester] = useState<number>(4);
  const [selectedCurriculum, setSelectedCurriculum] = useState<number>(2026);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await apiClient.getBranches();
        setBranches(data);
        if (data.length > 0 && !selectedBranch) {
          setSelectedBranch(data[0].code || '');
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  // 2. Fetch Catalog
  useEffect(() => {
    if (!selectedBranch || !selectedSemester) return;
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getCatalog(selectedBranch, selectedSemester, selectedCurriculum);
        setSubjects(data);
        setSelectedSubjectId('all');
        setMaterials([]);
      } catch (err) {
        console.error("Error fetching catalog:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, [selectedBranch, selectedSemester, selectedCurriculum]);

  // 3. Fetch Materials
  useEffect(() => {
    if (selectedSubjectId === 'all') {
      setMaterials([]);
      return;
    }
    const fetchMaterials = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getMaterials(selectedSubjectId);
        setMaterials(data);
      } catch (err) {
        console.error("Error fetching materials:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, [selectedSubjectId]);

  // Filter materials for 'pyq' type
  const filteredPYQs = useMemo(() => {
    return materials.filter(m => {
      const isPYQ = m.type === 'pyq';
      const isPublished = m.status === 'published';
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
      return isPYQ && isPublished && matchesSearch;
    });
  }, [materials, searchQuery]);

  const FilterSidebar = () => (
    <div className="h-fit sticky top-24 space-y-6">
      <div className="bg-white dark:bg-navy-900 rounded-xl shadow-sm border border-gray-100 dark:border-navy-800 p-5 transition-colors">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand-orange" /> Select Criteria
          </h3>
        </div>

        {/* Branch Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-2.5 text-sm text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-brand-orange focus:border-brand-orange outline-none appearance-none cursor-pointer"
            >
              {branches.map(branch => (
                <option key={branch.id} value={branch.code}>{branch.name}</option>
              ))}
              {branches.length === 0 && <option value="computer">Computer Engineering</option>}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Semester Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
          <div className="grid grid-cols-4 gap-2">
            {SEMESTERS.map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  selectedSemester === sem
                    ? 'bg-navy-900 text-white border-navy-900 dark:bg-brand-orange dark:border-brand-orange'
                    : 'bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-navy-700 hover:border-brand-orange hover:text-brand-orange dark:hover:text-brand-orange'
                }`}
              >
                Sem {formatSemester(sem)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Curriculum Year Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Curriculum Year</label>
          <div className="relative">
            <select
              value={selectedCurriculum}
              onChange={(e) => setSelectedCurriculum(Number(e.target.value))}
              className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-2.5 text-sm text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-brand-orange focus:border-brand-orange outline-none appearance-none cursor-pointer"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Subject Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
          <div className="relative">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-brand-orange/10 border border-brand-orange/30 rounded-lg p-2.5 text-sm text-brand-orange font-medium focus:ring-1 focus:ring-brand-orange outline-none appearance-none cursor-pointer"
            >
              <option value="all">-- Select a Subject --</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.subjectName} ({subject.subjectCode})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-brand-orange pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-8 animate-slide-up transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-navy-900 dark:text-white mb-2">Previous Year Papers</h1>
          <p className="text-gray-500 dark:text-gray-400">Select your branch and subject to find relevant PYQs.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:hidden mb-4">
            <button 
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="w-full bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 p-3 rounded-lg flex items-center justify-center gap-2 text-navy-900 dark:text-white font-medium shadow-sm"
            >
              <SlidersHorizontal className="h-5 w-5" />
              {isMobileFilterOpen ? 'Hide Selectors' : 'Select Branch & Subject'}
            </button>
          </div>

          <aside className={`w-full lg:w-64 flex-shrink-0 ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <FilterSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-navy-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-navy-800 mb-6 flex items-center gap-3 transition-colors">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search PYQs in this subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-navy-900 dark:text-white placeholder-gray-400 focus:ring-0"
                disabled={selectedSubjectId === 'all'}
              />
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 text-brand-orange animate-spin" />
              </div>
            ) : selectedSubjectId === 'all' ? (
              <div className="bg-white dark:bg-navy-900 rounded-xl shadow-sm border border-gray-100 dark:border-navy-800 p-12 text-center transition-colors">
                <FileText className="h-12 w-12 text-brand-orange/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Please select a subject</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Choose your branch, semester, and a subject from the sidebar to view PYQs.</p>
              </div>
            ) : filteredPYQs.length === 0 ? (
              <div className="bg-white dark:bg-navy-900 rounded-xl shadow-sm border border-gray-100 dark:border-navy-800 p-12 text-center transition-colors">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No PYQs found for this subject</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Check back later or contribute a paper yourself!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPYQs.map((pyq) => {
                  return (
                    <div key={pyq.id} className="bg-white dark:bg-navy-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-navy-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-brand-orange transition-colors group">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                            {pyq.year || 'N/A'}
                          </span>
                        </div>
                        <Link to={pyq.blog_id ? `/blogs/${pyq.blog_id}` : `/materials/${pyq.id}`} className="font-bold text-navy-900 dark:text-white hover:text-brand-orange transition-colors">
                          {pyq.title}
                        </Link>
                      </div>
                      
                      <Link 
                        to={pyq.blog_id ? `/blogs/${pyq.blog_id}` : `/materials/${pyq.id}`}
                        className="flex items-center gap-2 bg-gray-50 dark:bg-navy-800 text-navy-900 dark:text-white hover:bg-gray-100 dark:hover:bg-navy-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
                      >
                        <Eye className="h-4 w-4" /> View Paper
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
            
            {selectedSubjectId !== 'all' && !isLoading && (
              <div className="mt-6 text-center text-xs text-gray-400">
                Showing {filteredPYQs.length} results
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default PYQList;
