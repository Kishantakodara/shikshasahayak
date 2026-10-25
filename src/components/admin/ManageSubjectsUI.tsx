import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Branch } from '../../types';
import { 
  BookOpen, PlusCircle, Trash2, Loader2, Search, Filter, Book
} from 'lucide-react';

const ManageSubjectsUI: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subjectsData, branchesData] = await Promise.all([
        apiClient.getSubjects(),
        apiClient.getBranches()
      ]);
      setSubjects(subjectsData || []);
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Failed to load subjects data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !branchId || !semester) {
      alert('Subject Name, Branch, and Semester are required.');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.addSubject({
        name: name.trim(),
        code: code.trim() || undefined,
        branch_id: branchId,
        semester: Number(semester)
      });
      setName('');
      setCode('');
      // Keep selected branch and semester for ease of adding multiple subjects
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (offeringId: string) => {
    if (!confirm('Are you sure you want to delete this subject? All documents linked to this subject will be permanently orphaned or deleted!')) {
      return;
    }

    try {
      setIsDeleting(offeringId);
      await apiClient.deleteSubject(offeringId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject');
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter subjects based on query, branch, and semester
  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (sub.code && sub.code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBranch = !filterBranch || sub.branch_id === filterBranch;
    const matchesSemester = !filterSemester || String(sub.semester_no) === filterSemester;

    return matchesSearch && matchesBranch && matchesSemester;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Subject Management
        </h2>
        <p className="text-sm text-muted mt-1 font-semibold">
          Add, list, or delete course subjects cataloged by branch and semester.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" /> Add Subject
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Subject Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Database Management System"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Subject Code (Optional)</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. CE-302"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Branch / Department</label>
              <div className="relative">
                <select
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Semester</label>
              <div className="relative">
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none"
                  required
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={String(num)}>Semester {num}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 border border-primary/20 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4.5 w-4.5" /> Create Subject
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Search, Filters, and List */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col h-[650px]">
          <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center justify-between shrink-0">
            <span>Course Catalog Subjects</span>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              {isLoading ? '...' : filteredSubjects.length} of {subjects.length}
            </span>
          </h3>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
            {/* Search */}
            <div className="flex items-center bg-background border border-border rounded-xl px-3.5 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <Search className="h-4.5 w-4.5 text-muted mr-2 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search subjects..."
                className="bg-transparent border-none outline-none text-sm text-text placeholder-muted w-full"
              />
            </div>

            {/* Branch Filter */}
            <div className="relative flex items-center bg-background border border-border rounded-xl px-3 py-2.5 focus-within:border-primary">
              <Filter className="h-4 w-4 text-muted mr-2 shrink-0" />
              <select
                value={filterBranch}
                onChange={e => setFilterBranch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-text w-full appearance-none pr-4 font-bold"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.short_name || b.name}</option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-muted text-[10px]">▼</div>
            </div>

            {/* Semester Filter */}
            <div className="relative flex items-center bg-background border border-border rounded-xl px-3 py-2.5 focus-within:border-primary">
              <Filter className="h-4 w-4 text-muted mr-2 shrink-0" />
              <select
                value={filterSemester}
                onChange={e => setFilterSemester(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-text w-full appearance-none pr-4 font-bold"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={String(num)}>Semester {num}</option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-muted text-[10px]">▼</div>
            </div>
          </div>

          {/* Subjects Scrollable Container */}
          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <span className="text-sm text-muted font-bold">Loading course catalog...</span>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-24 px-4 border border-dashed border-border rounded-xl h-full flex flex-col items-center justify-center">
                <Book className="h-12 w-12 text-muted mb-4" />
                <h4 className="font-bold text-text text-md">No Subjects Found</h4>
                <p className="text-sm text-muted mt-1 max-w-sm font-medium">
                  Try adjusting your search query or filters, or add a new subject to populate this catalog list.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSubjects.map((sub) => (
                  <div 
                    key={sub.id}
                    className="p-3.5 rounded-xl border border-border bg-surface-secondary/50 flex items-center justify-between gap-4 hover:bg-surface-secondary transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {sub.code && (
                          <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
                            {sub.code}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted uppercase">
                          Sem {sub.semester_no} • {sub.branch_name || sub.branches}
                        </span>
                      </div>
                      <h4 className="font-bold text-text text-sm mt-1.5 break-words">{sub.name}</h4>
                    </div>

                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={isDeleting === sub.id}
                      title="Delete Subject"
                      className="p-2 text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isDeleting === sub.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSubjectsUI;
