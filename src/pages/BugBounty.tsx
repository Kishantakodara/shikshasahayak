import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { compressImageToBase64 } from '../utils/imageCompressor';
import { 
  Bug, 
  ShieldAlert, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X, 
  Terminal,
  ChevronRight
} from 'lucide-react';

const BugBounty: React.FC = () => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [bugCategory, setBugCategory] = useState('ui');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-detect browser/device details
  const [browserInfo, setBrowserInfo] = useState('');

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ua = navigator.userAgent;
    setBrowserInfo(`Screen: ${width}x${height} | UA: ${ua}`);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload an image file (PNG, JPG, WEBP).');
        setSubmitStatus('error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be under 10MB.');
        setSubmitStatus('error');
        return;
      }
      setScreenshot(file);
      try {
        const compressedBase64 = await compressImageToBase64(file);
        setScreenshotPreview(compressedBase64);
        if (submitStatus === 'error') {
          setSubmitStatus('idle');
          setErrorMessage('');
        }
      } catch (err) {
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
        screenshot: screenshotPreview,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 to-navy-900 border border-navy-800 p-8 md:p-12 mb-10 shadow-lg text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-sm font-semibold mb-4">
            <Bug className="h-4 w-4" /> Bug Bounty Program
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight leading-tight">
            Help Us Improve <span className="text-brand-orange">ShikshaSahayak</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            Spot a visual issue, a broken download button, or a system bug? Report it here! We review all submissions and reward valuable findings to help make engineering study resources smoother for everyone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Rules & Rewards Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-navy-800 pb-3">
              <ShieldAlert className="h-5 w-5 text-brand-orange" /> Guidelines
            </h2>
            <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                <span>Provide clear steps to reproduce the bug.</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                <span>Attach a screenshot showing the issue.</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                <span>Avoid spamming duplicate reports.</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                <span>Be respectful and detailed in descriptions.</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-brand-orange/5 to-transparent border border-brand-orange/15 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-2 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-brand-orange" /> System Diagnostics
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              We automatically detect your platform specifications to debug issues faster:
            </p>
            <div className="bg-gray-50 dark:bg-navy-950 p-3 rounded-lg border border-gray-100 dark:border-navy-900 font-mono text-[10px] text-gray-600 dark:text-gray-400 break-all select-none">
              {browserInfo || 'Detecting system specs...'}
            </div>
          </div>
        </div>

        {/* Report Form */}
        <div className="md:col-span-2 bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-display font-bold text-navy-900 dark:text-white mb-6">Submit a Report</h2>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {submitStatus === 'success' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl flex items-start gap-3 border border-green-100 dark:border-green-900/30 animate-fade-in">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Thank you for your report!</h4>
                  <p className="text-sm mt-0.5">We have logged the issue in our database and forwarded it to our developer mail. We'll look into this immediately.</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-900/30 animate-fade-in">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Submission Failed</h4>
                  <p className="text-sm mt-0.5">{errorMessage || 'Something went wrong. Please check fields and try again.'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all" 
                  placeholder="you@example.com" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Issue Category</label>
                <select 
                  value={bugCategory}
                  onChange={(e) => setBugCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all cursor-pointer"
                >
                  <option value="ui">UI / Layout Issue</option>
                  <option value="broken">Broken Link / Download Error</option>
                  <option value="performance">Slow / Performance Glitch</option>
                  <option value="auth">Authentication / Login Issue</option>
                  <option value="content">Incorrect Study Material</option>
                  <option value="other">Other / Security Issue</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all resize-none" 
                placeholder="Explain the issue. What were you doing? What did you expect to happen, and what happened instead?" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Upload Screenshot</label>
              
              {screenshotPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-950 p-2 max-w-md">
                  <img src={screenshotPreview} alt="Screenshot preview" className="rounded-xl w-full h-auto max-h-60 object-contain" />
                  <button 
                    type="button"
                    onClick={removeScreenshot}
                    className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-md"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 dark:border-navy-800 hover:border-brand-orange dark:hover:border-brand-orange rounded-2xl p-8 text-center bg-gray-50 dark:bg-navy-950 cursor-pointer transition-all relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <UploadCloud className="h-10 w-10 text-gray-400 group-hover:text-brand-orange mx-auto mb-3 transition-colors" />
                  <p className="text-sm font-bold text-navy-800 dark:text-white group-hover:text-brand-orange transition-colors">
                    Click to upload or drag & drop image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, or WEBP up to 5MB</p>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-brand-orange text-white py-3.5 rounded-xl font-bold hover:bg-brand-hover transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-brand-orange/10 hover:shadow-brand-orange/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting Report...
                </>
              ) : (
                <>
                  <Bug className="h-5 w-5" /> Submit Bug Report
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BugBounty;
