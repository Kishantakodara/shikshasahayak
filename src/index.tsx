console.log("[SHIKSHA_BOOT] React entry reached");
console.log("[BOOT] Initializing React entry");

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { apiClient } from './api/client';
import { auth } from './utils/firebase';
import { compressImageToBase64 } from './utils/imageCompressor';
import { 
  Bug, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Upload,
  X 
} from 'lucide-react';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// --- Stale Service Worker Unregistration ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.warn('Successfully unregistered stale Service Worker:', registration);
          }
        });
      }
    }
  }).catch((err) => {
    console.error('Error fetching Service Worker registrations:', err);
  });
}

// --- Throttled Reload Mechanism for Chunk / Asset Failures ---
const reloadPageWithThrottle = (reason: string) => {
  const reloadKey = 'shiksha_deployment_reload';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  
  if (!lastReload || now - parseInt(lastReload, 10) > 12000) { // 12s throttle
    sessionStorage.setItem(reloadKey, now.toString());
    console.warn(`Critical asset/chunk loading failure detected (${reason}). Reloading page...`);
    window.location.reload();
  } else {
    console.error(`Repeated asset/chunk loading failure detected (${reason}). Throttling reload to avoid infinite loops.`);
  }
};

// Listen for resource loading errors (like failed <script> or <link> tags)
window.addEventListener('error', (event) => {
  const target = event.target as HTMLElement;
  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
    const url = (target as any).src || (target as any).href;
    if (url && (url.includes('/assets/') || url.endsWith('.js') || url.endsWith('.css'))) {
      reloadPageWithThrottle(`Failed script/link resource load: ${url}`);
    }
  }
}, true);

// Listen for unhandled promise rejections (like failed dynamic import() calls)
window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason?.toString() || '';
  const errorStack = event.reason?.stack || '';
  if (
    errorMsg.includes('ChunkLoadError') ||
    errorMsg.includes('Failed to fetch dynamically imported module') ||
    errorMsg.includes('Loading chunk') ||
    errorStack.includes('ChunkLoadError') ||
    errorStack.includes('Failed to fetch dynamically imported module')
  ) {
    reloadPageWithThrottle('Failed dynamic chunk import');
  }
});

const ErrorBoundaryFallback: React.FC<{ error: Error }> = ({ error }) => {
  const [email, setEmail] = useState('');
  const [userComment, setUserComment] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    // Attempt to prefill email from active session
    if (auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      try {
        const compressedBase64 = await compressImageToBase64(file);
        setScreenshotPreview(compressedBase64);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshotPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const width = window.innerWidth;
    const height = window.innerHeight;
    const browserInfo = `Screen: ${width}x${height} | UA: ${navigator.userAgent}`;

    try {
      await apiClient.submitBugReport({
        user_email: email,
        description: `[CRASH REPORT] User Comment: ${userComment || 'No comment provided'}\n\nError Message: ${error.message}`,
        browser_info: browserInfo,
        screenshot: screenshotPreview // base64 screenshot preview string
      });
      setSubmitStatus('success');
      setUserComment('');
      setScreenshot(null);
      setScreenshotPreview(null);
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F172A] font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Top visual accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-orange to-orange-600" />

        <div className="flex items-center gap-4 mb-6">
          <div className="bg-orange-500/10 p-3.5 rounded-2xl text-brand-orange border border-orange-500/20 shrink-0">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white leading-tight">Something Went Wrong</h1>
            <p className="text-slate-400 text-sm mt-1">An unexpected error crashed the application.</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button 
            onClick={handleReload}
            className="flex items-center gap-2 bg-brand-orange hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-brand-orange/10 hover:shadow-brand-orange/20 cursor-pointer text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Reload Portal
          </button>
          <button 
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold transition-all text-sm border border-slate-700/50 cursor-pointer"
          >
            {showTechnicalDetails ? (
              <>Hide Details <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>View Details <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        </div>

        {showTechnicalDetails && (
          <div className="mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-red-400 max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
            <strong>Error:</strong> {error.message}
            {error.stack && `\n\n${error.stack}`}
          </div>
        )}

        {/* Bug Reporting Form inside the boundary */}
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Bug className="h-4 w-4 text-brand-orange" /> Help Us Fix It (Bug Bounty)
          </h3>

          {submitStatus === 'success' ? (
            <div className="p-4 bg-green-950/30 text-green-400 rounded-xl flex items-start gap-3 border border-green-500/10">
              <Check className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Error reported successfully!</h4>
                <p className="text-xs mt-0.5 text-slate-400">Our developer team has been notified. Thank you for making ShikshaSahayak better.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitStatus === 'error' && (
                <p className="text-xs text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-500/10">
                  Failed to report error. Please try again.
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email Address *</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent text-white outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">What were you trying to do?</label>
                <textarea 
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  rows={2}
                  className="w-full text-sm px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent text-white outline-none transition-all resize-none"
                  placeholder="Optional details (e.g. clicking on PYQ tab, opening syllabus)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Attach Screenshot (Optional)</label>
                {screenshotPreview ? (
                  <div className="relative mt-1 inline-block">
                    <img src={screenshotPreview} alt="Preview" className="h-16 w-auto rounded-lg object-cover border border-slate-800" />
                    <button 
                      type="button" 
                      onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-slate-800 hover:border-brand-orange/50 rounded-xl p-3 text-center bg-slate-900/50 cursor-pointer transition-all">
                    <input 
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Upload className="h-4 w-4 text-brand-orange" />
                      <span>Upload Screenshot</span>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full text-sm bg-brand-orange/10 border border-brand-orange/30 hover:bg-brand-orange text-brand-orange hover:text-white py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting Report...</>
                ) : (
                  'Submit Report & Help Fix'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    const errorMsg = error?.toString() || '';
    const errorStack = error?.stack || '';
    if (
      errorMsg.includes('ChunkLoadError') ||
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Loading chunk') ||
      errorStack.includes('ChunkLoadError') ||
      errorStack.includes('Failed to fetch dynamically imported module')
    ) {
      reloadPageWithThrottle('React ErrorBoundary caught chunk load error');
    }
  }
  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("[BOOT] Mounting React root to DOM");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
