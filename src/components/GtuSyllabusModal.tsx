import React, { useState } from 'react';
import { X, Download, Maximize2, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { getGtuOfficialSyllabusUrl, getCurrentAcademicYear } from '../utils/gtuSyllabus';

interface GtuSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectCode: string;
  subjectName: string;
}

export const GtuSyllabusModal: React.FC<GtuSyllabusModalProps> = ({
  isOpen,
  onClose,
  subjectCode,
  subjectName,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !subjectCode) return null;

  const pdfUrl = getGtuOfficialSyllabusUrl(subjectCode);
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const embedSrc = isMobile
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}&page=1`
    : `${pdfUrl}#toolbar=0&page=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
          isFullscreen ? 'fixed inset-2 sm:inset-4 z-50' : 'w-full max-w-5xl h-[85vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-navy-800 bg-gray-50 dark:bg-navy-950 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9.5 h-9.5 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-gradient-to-r from-brand-orange to-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Latest Academic Year {getCurrentAcademicYear()} (NEP Scheme)
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono font-bold">
                  Code: {subjectCode}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-navy-900 dark:text-white truncate mt-0.5">
                {subjectName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:text-navy-900 dark:hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <a
              href="https://syllabus.gtu.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-navy-800 text-gray-300 hover:text-white font-bold text-xs transition-colors border border-navy-700"
            >
              <ExternalLink className="h-3 w-3" /> GTU Syllabus Portal
            </a>
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-navy-800 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tip Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <span>
            💡 <strong>Syllabus Note:</strong> If the GTU preview says <em>"The resource you are looking for has been removed..."</em>, search the official GTU Syllabus Directory for revised teaching scheme PDF files.
          </span>
          <a
            href="https://syllabus.gtu.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:text-amber-200 underline font-bold whitespace-nowrap flex items-center gap-1"
          >
            Open Syllabus Portal <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Embedded Viewer Body */}
        <div className="flex-1 w-full bg-slate-900 relative rounded-b-2xl overflow-hidden">
          <object
            data={`${pdfUrl}#toolbar=0`}
            type="application/pdf"
            className="w-full h-full border-0"
          >
            <iframe
              src={embedSrc}
              className="w-full h-full border-0"
              title={`${subjectName} GTU Syllabus`}
              allow="autoplay"
            />
          </object>
        </div>
      </div>
    </div>
  );
};

export default GtuSyllabusModal;
