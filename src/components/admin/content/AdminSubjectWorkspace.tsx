import { fetchWithAuth } from '../../../api/client';
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, BookOpen, Layers, FileText, Cpu, Plus, Search, Filter, 
  Trash2, Edit3, Eye, CheckCircle2, AlertCircle, RefreshCw, ChevronRight,
  FolderTree, FileSpreadsheet, Loader2, Link2, Download, ThumbsUp
} from 'lucide-react';
import { UniversalDocumentModal } from './UniversalDocumentModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface AdminSubjectWorkspaceProps {
  subjectId: string;
  onBack?: () => void;
}

export const AdminSubjectWorkspace: React.FC<AdminSubjectWorkspaceProps> = ({
  subjectId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'documents' | 'content-factory'>('overview');
  
  const [subject, setSubject] = useState<any | null>(null);
  const [curriculumTree, setCurriculumTree] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for documents tab
  const [docFilterType, setDocFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);

  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  // Curriculum Node Modal State
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [nodeParentId, setNodeParentId] = useState<string | null>(null);
  const [nodeType, setNodeType] = useState<'unit' | 'topic' | 'subtopic'>('unit');
  const [nodeNumber, setNodeNumber] = useState<number>(1);
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  const [savingNode, setSavingNode] = useState(false);

  useEffect(() => {
    if (subjectId) {
      loadWorkspaceData();
    }
  }, [subjectId]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Load Subject Detail
      const subRes = await fetchWithAuth(`/api/admin/academic/subjects/${subjectId}`);
      const subJson = await subRes.json();
      if (!subJson.success) throw new Error(subJson.error || 'Failed to load subject details');
      setSubject(subJson.data);

      // 2. Load Curriculum Tree
      const currRes = await fetchWithAuth(`/api/admin/academic/subjects/${subjectId}/curriculum`);
      const currJson = await currRes.json();
      if (currJson.success) {
        setCurriculumTree(currJson.data || []);
      }

      // 3. Load Subject Documents
      const docRes = await fetchWithAuth(`/api/admin/documents?subject_id=${subjectId}&limit=100`);
      const docJson = await docRes.json();
      if (docJson.success) {
        setDocuments(docJson.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeTitle.trim()) return;

    try {
      setSavingNode(true);
      const res = await fetchWithAuth(`/api/admin/academic/subjects/${subjectId}/curriculum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: nodeParentId,
          node_type: nodeType,
          node_number: nodeNumber,
          title: nodeTitle.trim(),
          description: nodeDesc.trim() || null,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create curriculum node');

      setIsNodeModalOpen(false);
      setNodeTitle('');
      setNodeDesc('');
      loadWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingNode(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to delete this curriculum node? Any attached documents will be unlinked.')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/academic/subjects/${subjectId}/curriculum?node_id=${nodeId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete curriculum node');
      loadWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/documents/${docId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete document');
      loadWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (docFilterType !== 'all' && doc.document_type !== docFilterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (doc.title || '').toLowerCase().includes(q) || (doc.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        <span className="text-sm font-medium">Loading Subject Workspace...</span>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-semibold text-white">Subject Workspace Error</h3>
        <p className="text-sm text-slate-400">{error || 'Subject not found'}</p>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium">
            Return to Academic List
          </button>
        )}
      </div>
    );
  }

  const pyqCount = documents.filter(d => d.document_type === 'pyq').length;
  const notesCount = documents.filter(d => d.document_type === 'study-material').length;
  const syllabusCount = documents.filter(d => d.document_type === 'syllabus').length;

  return (
    <div className="space-y-6">
      
      {/* Subject Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Back to Subjects"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20">
                  CODE: {subject.code || 'N/A'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Semester {subject.semester}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  {subject.branch_short || subject.branch_name || 'Department'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{subject.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingDoc(null); setIsDocModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">Curriculum Units</span>
            <span className="text-base font-bold text-white">{curriculumTree.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">PYQ Papers</span>
            <span className="text-base font-bold text-orange-400">{pyqCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">Study Materials</span>
            <span className="text-base font-bold text-emerald-400">{notesCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">Syllabi</span>
            <span className="text-base font-bold text-blue-400">{syllabusCount}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'curriculum'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Curriculum Tree ({curriculumTree.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'documents'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents Repository ({documents.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              <span>Unit & Coverage Breakdown</span>
            </h3>
            
            {curriculumTree.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                No units defined yet for {subject.name}. Switch to the Curriculum tab to add units.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {curriculumTree.map((unit) => (
                  <div key={unit.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        Unit {unit.node_number}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {unit.documents_count || 0} Documents Attached
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{unit.title}</h4>
                    {unit.description && <p className="text-xs text-slate-400">{unit.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM TREE */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Curriculum Tree Hierarchy</h3>
              <p className="text-xs text-slate-400">Manage Units, Topics, and Subtopics with infinite nesting support</p>
            </div>
            <button
              onClick={() => {
                setNodeParentId(null);
                setNodeType('unit');
                setNodeNumber(curriculumTree.length + 1);
                setNodeTitle('');
                setNodeDesc('');
                setIsNodeModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Top-Level Unit</span>
            </button>
          </div>

          {/* Nested Tree List */}
          <div className="space-y-3">
            {curriculumTree.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
                No curriculum nodes added. Click "Add Top-Level Unit" to start structuring this subject.
              </div>
            ) : (
              curriculumTree.map((unit) => (
                <div key={unit.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        UNIT {unit.node_number}
                      </span>
                      <h4 className="text-base font-bold text-white">{unit.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNodeParentId(unit.id);
                          setNodeType('topic');
                          setNodeNumber(Number(`${unit.node_number}.${(unit.children || []).length + 1}`));
                          setNodeTitle('');
                          setNodeDesc('');
                          setIsNodeModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Topic</span>
                      </button>
                      <button
                        onClick={() => handleDeleteNode(unit.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Topics List */}
                  {(unit.children || []).length > 0 && (
                    <div className="pl-6 space-y-2 border-l-2 border-slate-800 mt-2">
                      {unit.children.map((topic: any) => (
                        <div key={topic.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                              Topic {topic.node_number}
                            </span>
                            <span className="text-sm font-medium text-slate-200">{topic.title}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteNode(topic.id)}
                            className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS REPOSITORY */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDocFilterType('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  docFilterType === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({documents.length})
              </button>
              <button
                onClick={() => setDocFilterType('pyq')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  docFilterType === 'pyq' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                PYQ Papers ({pyqCount})
              </button>
              <button
                onClick={() => setDocFilterType('study-material')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  docFilterType === 'study-material' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Study Materials ({notesCount})
              </button>
              <button
                onClick={() => setDocFilterType('syllabus')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  docFilterType === 'syllabus' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Syllabus ({syllabusCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Document Table / List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {filteredDocs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No documents match the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-slate-950/40 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/20">
                            {doc.document_type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            {doc.status}
                          </span>
                          {doc.curriculum_unit_no && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                              Unit {doc.curriculum_unit_no}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPreviewDocId(doc.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => { setEditingDoc(doc); setIsDocModalOpen(true); }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Document Universal Modal */}
      <UniversalDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => { setIsDocModalOpen(false); setEditingDoc(null); }}
        onSuccess={loadWorkspaceData}
        subjectId={subjectId}
        curriculumNodes={curriculumTree}
        editingDocument={editingDoc}
      />

      {/* Preview Modal */}
      {previewDocId && (
        <DocumentPreviewModal
          isOpen={!!previewDocId}
          onClose={() => setPreviewDocId(null)}
          documentId={previewDocId}
        />
      )}

      {/* Add Curriculum Node Modal */}
      {isNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Add Curriculum Node</h3>
            <form onSubmit={handleCreateNode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Node Title *</label>
                <input
                  type="text"
                  required
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  placeholder="e.g. Network Models & Protocol Stack"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Node Number</label>
                <input
                  type="number"
                  step="0.1"
                  value={nodeNumber}
                  onChange={(e) => setNodeNumber(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNode}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 disabled:opacity-50"
                >
                  {savingNode ? 'Saving...' : 'Save Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
