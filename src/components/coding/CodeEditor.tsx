import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Save, 
  Code2, 
  AlertTriangle 
} from 'lucide-react';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'javascript' | 'python' | 'cpp' | 'java';
  onLanguageChange?: (language: 'javascript' | 'python' | 'cpp' | 'java') => void;
  onRun?: () => void;
  onSubmit?: () => void;
  onReset?: () => void;
  starterCode?: string;
  readOnly?: boolean;
  minHeight?: string;
  storageKey?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  onReset,
  starterCode,
  readOnly = false,
  minHeight = '360px',
  storageKey
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Update cursor line and column numbers
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = value.substring(0, pos);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  // Draft auto-save to localStorage
  useEffect(() => {
    if (!storageKey || !value) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, value);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDraftSavedTime(timeStr);
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [value, storageKey]);

  // Restore draft if available on initial mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && saved !== value && saved.trim().length > 0) {
        onChange(saved);
        setDraftSavedTime('Restored');
      }
    } catch {}
  }, [storageKey]);

  // Handle Tab, brackets, keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Run / Submit Shortcut: Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) onSubmit();
      else if (onRun) onRun();
      return;
    }

    // Save Draft Shortcut: Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (storageKey) {
        localStorage.setItem(storageKey, value);
        setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      return;
    }

    // Tab key indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = language === 'python' ? '    ' : '  ';

      if (!e.shiftKey) {
        const newValue = value.substring(0, start) + indent + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indent.length;
            updateCursorPosition();
          }
        });
      }
      return;
    }

    // Auto-closing brackets and quotes
    const openPairs: Record<string, string> = {
      '(': ')',
      '{': '}',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    if (openPairs[e.key] && !readOnly) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const closeChar = openPairs[e.key];

      // If user selected text, wrap it
      if (start !== end) {
        e.preventDefault();
        const selectedText = value.substring(start, end);
        const wrapped = e.key + selectedText + closeChar;
        const newValue = value.substring(0, start) + wrapped + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = end + 1;
          }
        });
        return;
      }

      // If inserting a single quote or bracket
      if (e.key === '{' || e.key === '(' || e.key === '[') {
        e.preventDefault();
        const newValue = value.substring(0, start) + e.key + closeChar + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
            updateCursorPosition();
          }
        });
        return;
      }
    }
  };

  // Copy code to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Confirm reset code
  const handleConfirmReset = () => {
    if (starterCode) {
      onChange(starterCode);
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }
    } else if (onReset) {
      onReset();
    }
    setShowResetConfirm(false);
  };

  const lineCount = Math.max(value.split('\n').length, 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div
      className={`flex flex-col bg-[#0b1329] border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl max-h-[calc(100vh-2rem)]' : 'w-full'
      }`}
    >
      {/* Top Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#070d1e] border-b border-slate-800/80 text-xs select-none">
        {/* Left: Language Selector */}
        <div className="flex items-center gap-2.5">
          <Code2 className="w-4 h-4 text-orange-500 shrink-0" />
          {onLanguageChange ? (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as any)}
              className="bg-[#0f172a] text-slate-200 font-semibold px-2.5 py-1 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer text-xs"
              aria-label="Select Programming Language"
            >
              <option value="javascript">JavaScript (ES2024)</option>
              <option value="python">Python 3.11</option>
              <option value="cpp">C++ 20 (GCC)</option>
              <option value="java">Java 21 (OpenJDK)</option>
            </select>
          ) : (
            <span className="font-bold text-slate-300 uppercase tracking-wider">{language}</span>
          )}

          {draftSavedTime && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 pl-2 border-l border-slate-800">
              <Save className="w-3 h-3 text-emerald-400" />
              <span>Draft {draftSavedTime}</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition font-medium text-xs"
            title="Copy code"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Reset Code Button */}
          {(starterCode || onReset) && !readOnly && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-orange-400 hover:bg-slate-800/60 rounded-lg transition font-medium text-xs"
              title="Reset to starter code"
              aria-label="Reset code to default starter template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen editor mode' : 'Enter fullscreen editor mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Overlay */}
      {showResetConfirm && (
        <div className="bg-amber-950/90 border-b border-amber-800 px-4 py-2 text-xs flex items-center justify-between text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Reset code to initial template? Your current edits will be cleared.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConfirmReset}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[11px] transition"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editor Body: Line Numbers + Textarea */}
      <div 
        className="relative flex flex-1 overflow-hidden" 
        style={{ minHeight: isFullscreen ? 'calc(100vh - 8rem)' : minHeight }}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-11 sm:w-12 py-3 px-1 bg-[#070d1e] text-slate-600 font-mono text-xs select-none text-right overflow-hidden shrink-0 border-r border-slate-800/70"
          style={{ lineHeight: '1.5rem' }}
        >
          {lineNumbers.map((num) => (
            <div 
              key={num} 
              className={`h-6 ${cursorPos.line === num ? 'text-orange-400 font-bold' : ''}`}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Code Input Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder="// Type your solution here..."
          className="flex-1 w-full py-3 px-3.5 bg-[#0b1329] text-emerald-300 font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none placeholder-slate-600 whitespace-pre overflow-auto scrollbar-thin"
          style={{ 
            lineHeight: '1.5rem',
            tabSize: language === 'python' ? 4 : 2
          }}
          aria-label="Code editor"
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#070d1e] border-t border-slate-800/80 text-[11px] text-slate-400 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">{lineCount} lines</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">{value.length} chars</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 hidden md:inline">Ctrl+Enter to Run</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300 uppercase font-semibold">
            UTF-8
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
