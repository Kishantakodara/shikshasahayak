import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../api/client';
import html2canvas from 'html2canvas-pro';
import { compressCanvasToBase64, compressImageToBase64 } from '../utils/imageCompressor';
import { 
  Bug, 
  UploadCloud, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Camera
} from 'lucide-react';

const BugBountyWidget: React.FC = () => {
  const { currentUser } = useAuth();
  const { resolvedTheme } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [bugCategory, setBugCategory] = useState('ui');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [browserInfo, setBrowserInfo] = useState('');

  // Auto-detect browser/device details
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ua = navigator.userAgent;
    setBrowserInfo(`Screen: ${width}x${height} | UA: ${ua}`);
  }, []);

  // Pre-fill email when user logged in
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
      const fileName = file.name.toLowerCase();
      const hasAllowedExt = allowedExtensions.some(ext => fileName.endsWith(ext));
      const hasAllowedMime = allowedMimes.includes(file.type);

      if (!hasAllowedExt || !hasAllowedMime) {
        setErrorMessage('Please upload a valid JPG, PNG, or WEBP image file.');
        setSubmitStatus('error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be under 10MB.');
        setSubmitStatus('error');
        return;
      }
      
      const extension = fileName.endsWith('.png') ? '.png' : fileName.endsWith('.webp') ? '.webp' : '.jpg';
      const cleanFile = new File([file], `upload_screenshot${extension}`, { type: file.type });
      setScreenshot(cleanFile);

      try {
        const compressed = await compressImageToBase64(file, 1920, 1920, 0.90);
        setScreenshotPreview(compressed);
        if (submitStatus === 'error') {
          setSubmitStatus('idle');
          setErrorMessage('');
        }
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshotPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const captureScreenshot = async () => {
    setIsCapturing(true);
    // Allow state update and CSS layout changes to complete so modal is hidden cleanly
    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const canvas = await html2canvas(document.documentElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: resolvedTheme === 'dark' ? '#020617' : '#f9fafb',
        // Ignore the widget elements marked with ignore attribute
        ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore'),
        // Accurately capture the current viewport without scroll distortion
        scrollX,
        scrollY,
        x: scrollX,
        y: scrollY,
        width: viewportWidth,
        height: viewportHeight,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        scale: Math.max(window.devicePixelRatio || 1, 2),
        onclone: (clonedDoc) => {
          // Remove ignore elements from the cloned tree cleanly without breaking styles
          clonedDoc.querySelectorAll('[data-html2canvas-ignore]').forEach(el => {
            el.remove();
          });
        }
      });

      // Compress canvas to razor-sharp, lightweight WebP base64 (~30-80KB)
      const dataUrl = compressCanvasToBase64(canvas, 1920, 0.90);
      setScreenshotPreview(dataUrl);

      // Construct a File object from base64 string
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const extension = mime === 'image/webp' ? '.webp' : '.jpg';
      const file = new File([u8arr], `screenshot${extension}`, { type: mime });
      setScreenshot(file);

    } catch (err) {
      console.error("Auto screenshot capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !description.trim()) {
      setErrorMessage('Please fill in all required fields.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      await apiClient.submitBugReport({
        user_email: email,
        description: `[Category: ${bugCategory.toUpperCase()}] ${description}`,
        browser_info: browserInfo,
        screenshot: screenshotPreview
      });
      setSubmitStatus('success');
      setDescription('');
      removeScreenshot();
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset form states if it was not successful
    if (submitStatus !== 'success') {
      setDescription('');
      removeScreenshot();
      setSubmitStatus('idle');
      setErrorMessage('');
    } else {
      setSubmitStatus('idle');
    }
  };

  return (
    <>
      {/* Floating Action Button (Right Docked Half-Circle Tab) */}
      <div 
        data-html2canvas-ignore="true" 
        className={`fixed right-0 bottom-24 sm:bottom-28 z-[60] pointer-events-auto select-none transition-all duration-200 ${
          isCapturing || isOpen ? 'opacity-0 translate-x-full pointer-events-none' : 'opacity-100 translate-x-0'
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 pl-2.5 pr-1 py-1.5 sm:py-2 rounded-l-full bg-brand-orange hover:bg-brand-hover text-white shadow-lg shadow-brand-orange/25 transition-all duration-300 ease-in-out group max-w-[34px] hover:max-w-[105px] overflow-hidden outline-none cursor-pointer border-none active:scale-95"
          title="Report Bug / Bug Bounty"
          aria-label="Report Bug"
        >
          <Bug className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform group-hover:rotate-12" />
          <span className="text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pr-1">
            Bug
          </span>
        </button>
      </div>

      {/* Modal Popup Dialog */}
      {isOpen && (
        <div 
          data-html2canvas-ignore="true" 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto bg-navy-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto space-y-4">
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors cursor-pointer border-none"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {submitStatus === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy-900 dark:text-white">Bug Report Submitted!</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    Thank you for helping improve ShikshaSahayak. Our dev team has been notified and will review your submission shortly.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-brand-orange hover:bg-brand-hover text-white font-semibold rounded-xl transition-all shadow-md cursor-pointer border-none"
                >
                  Back to Portal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                    <Bug className="h-6 w-6 text-brand-orange" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white">Help Us Fix It (Bug Bounty)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Spot a bug, layout issue, or broken link? Let us know!</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  {submitStatus === 'error' && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start gap-2 border border-red-200 dark:border-red-950/40">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-700 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all font-sans"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">
                      Bug Category
                    </label>
                    <select
                      value={bugCategory}
                      onChange={(e) => setBugCategory(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-700 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all cursor-pointer font-sans"
                    >
                      <option value="ui">UI / Layout Issue</option>
                      <option value="broken">Broken Link / Download Error</option>
                      <option value="performance">Slow / Performance Glitch</option>
                      <option value="auth">Authentication / Login Issue</option>
                      <option value="content">Incorrect Study Material</option>
                      <option value="other">Other Feedback / Vulnerability</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-700 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all resize-none font-sans"
                      placeholder="Describe the issue. What happens, and what did you expect to happen?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">
                      Attach Screenshot
                    </label>
                    {screenshotPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-250 dark:border-navy-800 bg-gray-50 dark:bg-navy-950 p-1.5 max-w-sm">
                        <img src={screenshotPreview} alt="Screenshot preview" className="rounded-lg w-full h-auto max-h-40 object-contain" />
                        <button 
                          type="button"
                          onClick={removeScreenshot}
                          className="absolute top-3 right-3 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors shadow-md cursor-pointer border-none"
                          title="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={captureScreenshot}
                          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-brand-orange hover:border-brand-hover text-brand-orange hover:text-brand-hover bg-brand-orange/5 hover:bg-brand-orange/10 font-bold text-xs transition-all cursor-pointer outline-none"
                        >
                          <Camera className="h-4.5 w-4.5 shrink-0" />
                          <span>Auto-Capture Page</span>
                        </button>

                        <div className="border border-dashed border-gray-200 dark:border-navy-700 hover:border-brand-orange dark:hover:border-brand-orange rounded-xl p-3 text-center bg-gray-50 dark:bg-navy-950/50 cursor-pointer transition-all relative group flex items-center justify-center gap-2">
                          <input 
                            type="file" 
                            onChange={handleFileChange}
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          />
                          <UploadCloud className="h-4.5 w-4.5 text-gray-400 group-hover:text-brand-orange transition-colors shrink-0" />
                          <span className="text-xs font-bold text-navy-850 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                            Upload File
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-orange text-white py-3 rounded-xl font-bold hover:bg-brand-hover transition-all disabled:opacity-75 flex items-center justify-center gap-2 shadow-md shadow-brand-orange/10 hover:shadow-brand-orange/20 cursor-pointer mt-2 text-sm border-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Bug className="h-4.5 w-4.5" /> Submit Bug Report
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BugBountyWidget;
