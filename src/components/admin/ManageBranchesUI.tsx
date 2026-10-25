import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Branch } from '../../types';
import { 
  Building, PlusCircle, Trash2, Loader2, RefreshCw, Layers
} from 'lucide-react';

const ManageBranchesUI: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form State
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortName, setShortName] = useState('');

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getBranches();
      setBranches(data || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim() || !slug.trim()) {
      alert('Branch ID, Name, and Slug are required.');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.addBranch({
        id: id.trim(),
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        short_name: shortName.trim() || undefined
      });
      setId('');
      setName('');
      setSlug('');
      setShortName('');
      await loadBranches();
    } catch (err: any) {
      alert(err.message || 'Failed to create branch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch? All subjects and documents under this branch will be permanently deleted!')) {
      return;
    }

    try {
      setIsDeleting(branchId);
      await apiClient.deleteBranch(branchId);
      await loadBranches();
    } catch (err: any) {
      alert(err.message || 'Failed to delete branch');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          <Building className="h-6 w-6 text-primary" /> Branch Management
        </h2>
        <p className="text-sm text-muted mt-1 font-semibold">
          Add, edit, or delete departments/branches in the university database catalog.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" /> Add Branch
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Branch ID / Key</label>
              <input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="e.g. computer"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                required
              />
              <span className="text-[10px] text-muted font-bold block">Internal unique database key. Prefixed with "branch_" automatically.</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Branch Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Computer Engineering"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. computer"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                required
              />
              <span className="text-[10px] text-muted font-bold block">Used in route paths (e.g. /browse/computer/sem-3). Keep lowercase.</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Short Code / Abbreviation</label>
              <input
                type="text"
                value={shortName}
                onChange={e => setShortName(e.target.value)}
                placeholder="e.g. CSE"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
              />
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
                  <PlusCircle className="h-4.5 w-4.5" /> Create Branch
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: List of branches */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center justify-between">
            <span>Configured Branches</span>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              {isLoading ? '...' : branches.length}
            </span>
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <span className="text-sm text-muted font-bold">Loading branches...</span>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-24 px-4 border border-dashed border-border rounded-xl">
              <Layers className="h-12 w-12 text-muted mx-auto mb-4" />
              <h4 className="font-bold text-text text-md">No Branches Available</h4>
              <p className="text-sm text-muted mt-1 max-w-sm mx-auto font-medium">
                Add your first branch using the creation form to build up your catalog.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {branches.map((b) => (
                <div 
                  key={b.id}
                  className="p-4 rounded-xl border border-border bg-surface-secondary/50 flex items-start justify-between gap-4 hover:bg-surface-secondary transition-all"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      {b.short_name || b.id.replace('branch_', '').toUpperCase()}
                    </span>
                    <h4 className="font-bold text-text text-sm truncate mt-2">{b.name}</h4>
                    <p className="text-[11px] text-muted font-bold mt-1">Slug: {b.slug} • ID: {b.id}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={isDeleting === b.id}
                    title="Delete Branch"
                    className="p-2 text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isDeleting === b.id ? (
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
  );
};

export default ManageBranchesUI;
