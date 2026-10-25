import { fetchWithAuth } from '../../../api/client';
import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { DocumentType, DocumentStatus, MaterialKind } from '../../../../functions/lib/keydocs/types';

interface UniversalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjectId: string;
  curriculumNodes?: any[];
  editingDocument?: any; // If editing
}

export const UniversalDocumentModal: React.FC<UniversalDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subjectId,
  curriculumNodes = [],
  editingDocument,
}) => {
  const [docType, setDocType] = useState<DocumentType>('pyq');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<DocumentStatus>('published');
  const [curriculumNodeId, setCurriculumNodeId] = useState<string>('');

  // PYQ metadata fields
  const [paperYear, setPaperYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState<'S' | 'W'>('S');
  const [examLabel, setExamLabel] = useState('');

  // Syllabus metadata fields
  const [syllabusYear, setSyllabusYear] = useState<number>(new Date().getFullYear());
  const [regulation, setRegulation] = useState('');
  const [versionLabel, setVersionLabel] = useState('');

  // Material metadata fields
  const [materialKind, setMaterialKind] = useState<MaterialKind>('notes');
  const [author, setAuthor] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingDocument) {
      setDocType(editingDocument.document_type || 'pyq');
      setTitle(editingDocument.title || '');
      setDescription(editingDocument.description || '');
      setStatus(editingDocument.status || 'published');
      setCurriculumNodeId(editingDocument.curriculum_node_id || '');

      setPaperYear(editingDocument.paper_year || new Date().getFullYear());
      setSeason(editingDocument.season || 'S');
      setExamLabel(editingDocument.exam_label || '');

      setSyllabusYear(editingDocument.syllabus_year || new Date().getFullYear());
      setRegulation(editingDocument.regulation || '');
      setVersionLabel(editingDocument.version_label || '');

      setMaterialKind(editingDocument.material_kind || 'notes');
      setAuthor(editingDocument.author || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('published');
      setCurriculumNodeId('');
      setExamLabel('');
      setRegulation('');
      setVersionLabel('');
      setAuthor('');
      setSelectedFile(null);
      setError(null);
    }
  }, [editingDocument, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        document_type: docType,
        subject_id: subjectId,
        curriculum_node_id: curriculumNodeId || null,
        status,

        pyq_metadata: docType === 'pyq' ? {
          exam_year: paperYear,
          season,
          exam_label: examLabel.trim() || `GTU Regular ${season === 'S' ? 'Summer' : 'Winter'} ${paperYear}`,
        } : undefined,

        syllabus_metadata: docType === 'syllabus' ? {
          effective_year: syllabusYear,
          regulation: regulation.trim() || null,
          version_label: versionLabel.trim() || null,
        } : undefined,

        material_metadata: docType === 'study-material' ? {
          material_kind: materialKind,
          author: author.trim() || null,
        } : undefined,
      };

      const url = editingDocument 
        ? `/api/admin/documents/${editingDocument.id}` 
        : `/api/admin/documents`;
      
      const res = await fetchWithAuth(url, {
        method: editingDocument ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save document');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {editingDocument ? 'Edit Document' : 'Create New Document'}
              </h3>
              <p className="text-xs text-slate-400">Context-Aware Universal Document Shell</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Type Selector (Disabled if Editing) */}
          {!editingDocument && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Document Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setDocType('pyq'); setTitle(''); }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    docType === 'pyq'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  📄 PYQ Paper
                </button>
                <button
                  type="button"
                  onClick={() => { setDocType('study-material'); setTitle(''); }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    docType === 'study-material'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  📚 Study Material
                </button>
                <button
                  type="button"
                  onClick={() => { setDocType('syllabus'); setTitle(''); }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    docType === 'syllabus'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  📋 Syllabus
                </button>
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Document Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  docType === 'pyq' ? 'e.g., Computer Networks Summer 2024 Question Paper' :
                  docType === 'syllabus' ? 'e.g., GTU Computer Engineering Semester 5 Syllabus' :
                  'e.g., Unit 1 - Introduction to OSI Reference Model Notes'
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description or overview notes..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Status Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Publication Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="published">Published (Live to Students)</option>
                  <option value="draft">Draft (Private)</option>
                  <option value="review">Pending Review</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Curriculum Node Assignment */}
              {docType === 'study-material' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Curriculum Unit / Topic</label>
                  <select
                    value={curriculumNodeId}
                    onChange={(e) => setCurriculumNodeId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">General Subject Level (No Unit Assigned)</option>
                    {curriculumNodes.map((unit: any) => (
                      <React.Fragment key={unit.id}>
                        <option value={unit.id}>Unit {unit.node_number}: {unit.title}</option>
                        {(unit.children || []).map((topic: any) => (
                          <option key={topic.id} value={topic.id}>
                            └─ Topic {topic.node_number}: {topic.title}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Drag & Drop File Upload Container */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Document File (PDF / Asset)</label>
            {!selectedFile ? (
              <label 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
                className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-orange-500/50 transition-colors cursor-pointer text-center group"
              >
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-orange-400 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-300">Drag & drop PDF here, or click to browse</span>
                <span className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, PNG (Max 50MB)</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">{selectedFile.name}</span>
                    <span className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Context-Specific Fields */}
          {docType === 'pyq' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">PYQ Specific Metadata</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Exam Year</label>
                  <input
                    type="number"
                    value={paperYear}
                    onChange={(e) => setPaperYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Exam Season</label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value as 'S' | 'W')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                  >
                    <option value="S">Summer (S)</option>
                    <option value="W">Winter (W)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exam Custom Label</label>
                <input
                  type="text"
                  value={examLabel}
                  onChange={(e) => setExamLabel(e.target.value)}
                  placeholder={`GTU Regular ${season === 'S' ? 'Summer' : 'Winter'} ${paperYear}`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          )}

          {docType === 'study-material' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Study Material Metadata</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Material Kind</label>
                  <select
                    value={materialKind}
                    onChange={(e) => setMaterialKind(e.target.value as MaterialKind)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                  >
                    <option value="notes">Notes</option>
                    <option value="book">Reference Book</option>
                    <option value="assignment">Assignment</option>
                    <option value="practical">Practical / Lab Manual</option>
                    <option value="question_bank">Question Bank</option>
                    <option value="video">Video Lecture</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Author / Faculty</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Prof. R. K. Sharma"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {docType === 'syllabus' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Syllabus Metadata</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Effective Year</label>
                  <input
                    type="number"
                    value={syllabusYear}
                    onChange={(e) => setSyllabusYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Regulation</label>
                  <input
                    type="text"
                    value={regulation}
                    onChange={(e) => setRegulation(e.target.value)}
                    placeholder="e.g. 2021-22"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Version</label>
                  <input
                    type="text"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    placeholder="v1.0"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700/50 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingDocument ? 'Update Document' : 'Publish Document'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
