import { fetchWithAuth } from '../../../api/client';
import React, { useState, useEffect } from 'react';
import { X, FileText, Eye, ThumbsUp, Download, Calendar, BookOpen, ExternalLink, Link2, Plus, Loader2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documentId,
}) => {
  const [document, setDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument();
    }
  }, [isOpen, documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithAuth(`/api/admin/documents/${documentId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load document');
      setDocument(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Document Preview</h3>
              <p className="text-xs text-slate-400">ID: {documentId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
              <span className="text-sm">Loading document preview...</span>
            </div>
          ) : error || !document ? (
            <div className="text-center py-12 text-red-400 text-sm">
              {error || 'Document not found'}
            </div>
          ) : (
            <>
              {/* Document Master Header Card */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        {document.document_type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {document.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{document.title}</h2>
                    {document.description && (
                      <p className="text-sm text-slate-400 mt-1">{document.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>{document.subject_name} ({document.subject_code})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Sem {document.semester} • {document.branch_name}</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 text-slate-300 font-mono">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-400" /> {document.stats?.views || 0}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {document.stats?.likes || 0}</span>
                    <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5 text-orange-400" /> {document.stats?.downloads || 0}</span>
                  </div>
                </div>
              </div>

              {/* Type Metadata Card */}
              {document.pyq_metadata && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-sm">
                  <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">PYQ Metadata</h4>
                  <div className="grid grid-cols-3 gap-4 text-slate-300">
                    <div><span className="text-slate-500 text-xs block">Exam Year</span> {document.pyq_metadata.exam_year || 'N/A'}</div>
                    <div><span className="text-slate-500 text-xs block">Season</span> {document.pyq_metadata.season === 'S' ? 'Summer (S)' : 'Winter (W)'}</div>
                    <div><span className="text-slate-500 text-xs block">Exam Label</span> {document.pyq_metadata.exam_label || 'Standard'}</div>
                  </div>
                </div>
              )}

              {document.material_metadata && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-sm">
                  <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Material Metadata</h4>
                  <div className="grid grid-cols-3 gap-4 text-slate-300">
                    <div><span className="text-slate-500 text-xs block">Material Kind</span> <span className="capitalize">{document.material_metadata.material_kind}</span></div>
                    <div><span className="text-slate-500 text-xs block">Target Unit</span> {document.curriculum_node_title ? document.curriculum_node_title : `Unit ${document.unit_no || 'General'}`}</div>
                    <div><span className="text-slate-500 text-xs block">Author / Faculty</span> {document.material_metadata.author || 'Pahdaku Portal Team'}</div>
                  </div>
                </div>
              )}

              {/* Attached Files Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attached Files & Assets</h4>
                {(!document.files || document.files.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
                    No files attached to this document yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {document.files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 text-orange-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white flex items-center gap-2">
                              <span>{file.original_filename || 'document.pdf'}</span>
                              {file.is_primary === 1 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 uppercase">Primary</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                              <span className="uppercase">{file.file_type}</span>
                              <span>•</span>
                              <span>{file.mime_type}</span>
                              <span>•</span>
                              <span>{file.size_bytes ? `${(file.size_bytes / (1024 * 1024)).toFixed(2)} MB` : 'Size N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 text-xs font-medium transition-colors"
                        >
                          <span>Open File</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Relations */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Relations</h4>
                {(!document.relations || document.relations.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
                    No linked solution or related documents.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {document.relations.map((rel: any) => (
                      <div key={rel.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Link2 className="w-4 h-4 text-orange-400" />
                          <span className="capitalize font-semibold text-orange-400">[{rel.relation_type}]</span>
                          <span>{rel.target_title || rel.target_document_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
