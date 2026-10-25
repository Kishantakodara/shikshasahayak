import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Share2, FileText, Calendar, Database, Download } from 'lucide-react';
import { PYQ } from '../types';

// On mobile, use Google Docs Viewer so PDF renders inside the iframe
const getPdfSrc = (url: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobile
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}&page=1`
    : `${url}#toolbar=0&page=1`;
};
import { DEPARTMENTS } from '../constants';

interface PYQModalProps {
  isOpen: boolean;
  onClose: () => void;
  pyq: PYQ;
  onShare: () => void;
}

const PYQModal: React.FC<PYQModalProps> = ({ isOpen, onClose, pyq, onShare }) => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const infoBoxRef = useRef<HTMLDivElement>(null);

  const handleStartPreview = () => {
    // Scroll page to top so the fullscreen overlay is anchored correctly
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsPreviewing(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isOpen && !isPreviewing && infoBoxRef.current) {
      // Small timeout ensures the modal is fully rendered before focusing
      timer = setTimeout(() => {
        infoBoxRef.current?.focus();
      }, 50);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, isPreviewing]);

  if (!isOpen) return null;

  const dept = DEPARTMENTS.find(d => d.id === pyq.departmentId);
  const rawDocumentUrl = (pyq as any).pdfUrl || pyq.downloadUrl;

  // Clean the document URL to ensure same-origin behavior for /api/storage/ URLs
  const cleanDocumentUrl = rawDocumentUrl && rawDocumentUrl.includes('/api/storage/')
    ? '/api/storage/' + rawDocumentUrl.split('/api/storage/')[1]
    : rawDocumentUrl;

  const documentUrl = cleanDocumentUrl && cleanDocumentUrl.startsWith('/')
    ? window.location.origin + cleanDocumentUrl
    : cleanDocumentUrl;

  const handleClose = () => {
    setIsPreviewing(false);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isPreviewing ? 'p-0' : 'p-4'} animate-fade-in`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className={`relative bg-white dark:bg-navy-900 shadow-2xl w-full ${isPreviewing ? 'h-full max-w-none rounded-none p-0 flex flex-col' : 'max-w-lg rounded-3xl p-6 border border-gray-100 dark:border-navy-700'} transform transition-all duration-300 scale-100 overflow-hidden`}>
        
        {/* Header Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-red-500 z-20" />

        <button 
          onClick={handleClose}
          className={`absolute ${isPreviewing ? 'top-3 right-4' : 'top-4 right-4'} text-gray-400 hover:text-navy-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors z-20`}
        >
          <X className="h-5 w-5" />
        </button>

        {isPreviewing ? (
          <div className="flex flex-col h-full w-full bg-gray-100 dark:bg-navy-950">
            <div className="bg-white dark:bg-navy-900 flex items-center justify-between p-4 pr-16 border-b border-gray-200 dark:border-navy-700 z-10 shadow-sm relative">
              <h3 className="text-xl font-bold text-navy-900 dark:text-white truncate">{pyq.title}</h3>
              <div className="flex items-center gap-2 shrink-0">
                {documentUrl && (
                  <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500 dark:text-navy-600 dark:hover:text-gray-400 p-1 opacity-30 hover:opacity-100 transition-all" title="Source">
                    <Download className="h-3 w-3" />
                  </a>
                )}
                <button 
                  onClick={() => setIsPreviewing(false)}
                  className="text-sm font-bold text-brand-orange hover:bg-orange-50 dark:hover:bg-navy-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Back to Details
                </button>
              </div>
            </div>
            <div className="flex-1 w-full overflow-hidden bg-slate-950 relative">
              {documentUrl ? (
                <object
                  data={`${documentUrl}#toolbar=0`}
                  type="application/pdf"
                  className="w-full h-full border-0"
                >
                  <iframe
                    src={getPdfSrc(documentUrl)}
                    className="w-full h-full border-0"
                    title={pyq.title}
                    allow="autoplay"
                  />
                </object>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Document is not available for preview.</div>
              )}
            </div>
          </div>
        ) : (
          <div ref={infoBoxRef} tabIndex={-1} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 rounded-xl">
            <div className="flex flex-col items-center text-center mb-8 mt-4">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg ${dept?.color || 'bg-gray-100'} bg-opacity-20`}>
                    <FileText className={`h-10 w-10 ${dept?.color.split(' ')[1] || 'text-gray-600'}`} />
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-3">
                     <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${dept?.color || 'bg-gray-100 text-gray-600'}`}>
                        {dept?.code}
                     </span>
                     <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300">
                        {pyq.year}
                     </span>
                </div>
                
                <h3 className="text-2xl font-display font-bold text-navy-900 dark:text-white leading-tight mb-2 px-4">
                    {pyq.title}
                </h3>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {dept?.name} • Semester {pyq.semester}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-navy-950/50 p-4 rounded-2xl border border-gray-100 dark:border-navy-800 flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">File Size</span>
                    <span className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                        <Database className="h-4 w-4 text-brand-orange" /> {pyq.size}
                    </span>
                </div>
                <div className="bg-gray-50 dark:bg-navy-950/50 p-4 rounded-2xl border border-gray-100 dark:border-navy-800 flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Exam Type</span>
                    <span className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-orange" /> {pyq.type}
                    </span>
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={handleStartPreview}
                    className="flex-1 py-3.5 bg-brand-orange hover:bg-brand-hover text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transform duration-200"
                >
                    <Eye className="h-5 w-5" /> Preview Document
                </button>
                <button 
                    onClick={onShare}
                    className="flex-1 py-3.5 text-navy-900 dark:text-white hover:bg-gray-50 dark:hover:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <Share2 className="h-5 w-5" /> Share
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PYQModal;