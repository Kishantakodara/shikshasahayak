import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Eye, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  FolderOpen, 
  Info, 
  X 
} from 'lucide-react';
import { CanonicalSubjectCodeGroup, CanonicalQuestionPaper } from '../../api/gtuPyqClient';

interface CanonicalPyqBrowserProps {
  canonicalName: string;
  subjectCodes: CanonicalSubjectCodeGroup[];
  totalPapers: number;
  initialSelectedCode?: string;
}

export const CanonicalPyqBrowser: React.FC<CanonicalPyqBrowserProps> = ({
  canonicalName,
  subjectCodes,
  totalPapers,
  initialSelectedCode,
}) => {
  const defaultCode = (subjectCodes.find(c => c.subjectCode === initialSelectedCode) || subjectCodes[0])?.subjectCode || '';
  const [activeCode, setActiveCode] = useState<string>(defaultCode);
  const [previewPaper, setPreviewPaper] = useState<CanonicalQuestionPaper | null>(null);

  const totalVerifiedPapers = useMemo(() => {
    return subjectCodes.reduce((sum, c) => sum + (c.papers?.filter(p => p.verificationStatus === 'verified').length || 0), 0);
  }, [subjectCodes]);

  const currentCodeGroup = subjectCodes.find((c) => c.subjectCode === activeCode) || subjectCodes[0];

  // Group papers by academic year
  const papersByYear = useMemo(() => {
    if (!currentCodeGroup) return new Map<number, CanonicalQuestionPaper[]>();
    const map = new Map<number, CanonicalQuestionPaper[]>();
    for (const paper of currentCodeGroup.papers) {
      if (!map.has(paper.examYear)) {
        map.set(paper.examYear, []);
      }
      map.get(paper.examYear)!.push(paper);
    }
    return map;
  }, [currentCodeGroup]);

  const sortedYears: number[] = Array.from(papersByYear.keys()).sort((a: number, b: number) => b - a);

  return (
    <div className="space-y-6 text-left">
      {/* Subject Header & Canonical Hierarchy Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="bg-orange-500/10 text-brand-orange text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-orange-500/20 uppercase tracking-wider">
                Canonical Subject Archive
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {subjectCodes.length} GTU Subject Code{subjectCodes.length !== 1 ? 's' : ''} • {totalVerifiedPapers} Verified Available Paper{totalVerifiedPapers !== 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">
              {canonicalName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Official past year exam papers indexed directly from Gujarat Technological University (GTU).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-slate-50 dark:bg-navy-950/60 p-3 rounded-xl border border-slate-200 dark:border-navy-800 text-xs">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">100% Direct GTU Links</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Never mirrored or altered</p>
            </div>
          </div>
        </div>

        {/* Multi-Code Selector Tabs */}
        {subjectCodes.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-navy-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand-orange" />
              Select GTU Subject Code / Syllabus Scheme:
            </p>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {subjectCodes.map((codeGroup) => {
                const isSelected = codeGroup.subjectCode === activeCode;
                const verifiedInCode = codeGroup.papers?.filter(p => p.verificationStatus === 'verified').length || 0;
                return (
                  <button
                    key={codeGroup.subjectCode}
                    onClick={() => setActiveCode(codeGroup.subjectCode)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-brand-orange text-white border-brand-orange shadow-sm scale-100'
                        : 'bg-slate-50 dark:bg-navy-800/80 hover:bg-slate-100 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-navy-700'
                    }`}
                  >
                    <FolderOpen className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>Code: {codeGroup.subjectCode}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {codeGroup.syllabusVersion || 'GTU'}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold ${
                        isSelected ? 'text-white' : 'text-brand-orange'
                      }`}
                    >
                      ({verifiedInCode} verified)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Code Details & Papers Hierarchy */}
      {currentCodeGroup ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white">
                Exam Papers for Subject Code: <span className="text-brand-orange font-mono">{currentCodeGroup.subjectCode}</span>
              </h3>
              <span className="text-xs bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                {currentCodeGroup.officialSubjectName}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              Sorted Chronologically (Newest First)
            </span>
          </div>

          {sortedYears.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No question papers synced yet for this subject code.</p>
              <p className="text-xs text-slate-500 mt-1">Official GTU papers for this code will appear here once verified.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedYears.map((year) => {
                const yearPapers = papersByYear.get(year) || [];
                return (
                  <div
                    key={year}
                    className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 sm:p-5 shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-navy-800">
                      <Calendar className="h-4 w-4 text-brand-orange" />
                      <h4 className="font-bold text-sm text-navy-900 dark:text-white font-mono">
                        Academic Year {year}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({yearPapers.length} session paper{yearPapers.length !== 1 ? 's' : ''})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {yearPapers.map((paper: CanonicalQuestionPaper) => {
                        const isVerified = paper.verificationStatus === 'verified';
                        const isBroken = paper.verificationStatus === 'broken';

                        return (
                          <div
                            key={paper.id}
                            className={`bg-slate-50 dark:bg-navy-950/60 border rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all ${
                              isVerified
                                ? 'border-slate-200/80 dark:border-navy-800 hover:border-brand-orange/40'
                                : isBroken
                                ? 'border-rose-200 dark:border-rose-950/50 opacity-60'
                                : 'border-slate-200 dark:border-navy-800/80'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                                    paper.examSession === 'SUMMER'
                                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                                      : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                                  }`}
                                >
                                  {paper.sessionLabel}
                                </span>
                                {isVerified ? (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Verified</span>
                                  </span>
                                ) : isBroken ? (
                                  <span className="text-[10px] font-bold text-rose-500">
                                    Unavailable on GTU
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    Verification pending
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                                {paper.title}
                              </h5>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isVerified ? (
                                <>
                                  <button
                                    onClick={() => setPreviewPaper(paper)}
                                    className="p-2 rounded-lg bg-navy-900 dark:bg-navy-800 text-white hover:bg-brand-orange transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold shadow-xs"
                                    title="Preview Paper"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">View</span>
                                  </button>
                                  <a
                                    href={paper.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-brand-orange hover:text-white transition-colors cursor-pointer"
                                    title="Open original PDF directly on official GTU site"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </>
                              ) : isBroken ? (
                                <span className="text-xs text-slate-400 px-2 py-1 bg-slate-100 dark:bg-navy-900 rounded-md font-mono">
                                  Not Found
                                </span>
                              ) : (
                                <a
                                  href={paper.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-brand-orange flex items-center gap-1 underline font-medium"
                                  title="Check URL on GTU server"
                                >
                                  <span>Check on GTU</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Official Source Attribution Notice */}
      <div className="bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            <strong>Source Attribution:</strong> Gujarat Technological University (GTU). Documents are linked directly to official university repositories.
          </span>
        </div>
        <a
          href="https://www.gtu.ac.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-orange hover:underline font-bold shrink-0 flex items-center gap-1"
        >
          <span>Official GTU Portal</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* PDF Preview Modal */}
      {previewPaper && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-200 dark:border-navy-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between bg-slate-50 dark:bg-navy-950/80">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-orange text-white px-2 py-0.5 rounded font-mono font-bold">
                    {previewPaper.sessionLabel}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Code: {previewPaper.subjectCode || activeCode}</span>
                </div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white truncate mt-1">
                  {previewPaper.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewPaper.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-bold flex items-center gap-1.5 hover:bg-orange-600 transition-colors shadow-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open on GTU</span>
                </a>
                <button
                  onClick={() => setPreviewPaper(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF Iframe with Fallback */}
            <div className="flex-1 bg-slate-100 dark:bg-navy-950 relative">
              <iframe
                src={`${previewPaper.sourceUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={previewPaper.title}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-navy-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-2 pointer-events-auto">
                <span>If the GTU PDF doesn't display due to browser restrictions:</span>
                <a
                  href={previewPaper.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange font-bold hover:underline flex items-center gap-1"
                >
                  <span>Click here to open directly</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
