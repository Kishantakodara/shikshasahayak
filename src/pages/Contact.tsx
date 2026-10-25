import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, MessageSquare, HelpCircle, Send, ShieldCheck, Clock } from 'lucide-react';
import { usePageMeta } from '../utils/seo';

const Contact: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  usePageMeta({
    title: 'Contact Us — ShikshaSahayak Support & Feedback',
    description: 'Get in touch with the ShikshaSahayak team for academic corrections, material removal requests, or general inquiries.',
    path: '/contact',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);
    formData.append('access_key', '510341b5-dde2-41cf-9465-a2f7f6fee02c');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const data: any = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        (e.target as HTMLFormElement).reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-12 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-brand-orange border border-orange-500/20 text-xs font-bold uppercase tracking-wider mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Student & Faculty Support</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white mb-4 font-display">
            We're Here to Help
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
            Have questions about syllabus updates, material corrections, copyright queries, or feature suggestions? Reach out directly.
          </p>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Contact Information & FAQs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Email Card */}
            <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">Direct Email</h3>
                <a
                  href="mailto:team@shikshasahayak.org"
                  className="text-brand-orange font-bold text-sm hover:underline block mt-1"
                >
                  team@shikshasahayak.org
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-navy-800">
                <Clock className="w-4 h-4 text-brand-orange" />
                <span>Typical response time: Within 24 hours</span>
              </div>
            </div>

            {/* Quick Guideline Card */}
            <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white">
                <HelpCircle className="w-4 h-4 text-brand-orange" />
                <span>Before Submitting</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange font-bold">•</span>
                  <span><strong>For broken links or incorrect notes:</strong> Include the specific material URL and page number if possible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange font-bold">•</span>
                  <span><strong>For DMCA / Content Removal:</strong> Specify your affiliation or copyright ownership and link to the item.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange font-bold">•</span>
                  <span><strong>For security or bug reports:</strong> Visit our dedicated <a href="/bug-bounty" className="text-brand-orange hover:underline font-bold">Bug Bounty</a> program.</span>
                </li>
              </ul>
            </div>

            {/* Privacy Promise */}
            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-navy-900/40 border border-gray-200 dark:border-navy-800 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>We never share your email with third parties or use it for spam.</span>
            </div>

          </div>

          {/* Right Side: Contact Form */}
          <div className="lg:col-span-7 bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 sm:p-8 shadow-xs">
            
            <h2 className="text-xl font-bold text-navy-900 dark:text-white font-display mb-2">
              Send us a Message
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Fill out the form below and our team will get back to you promptly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {submitStatus === 'success' && (
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Your message has been sent successfully! We'll reply within 24 hours.</span>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>Unable to send message. Please check your internet connection or email team@shikshasahayak.org directly.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                  Subject / Topic *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="e.g. Material Correction in Semester 4 OS Notes"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                  Detailed Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Explain your inquiry, suggestion, or correction with details..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-brand-orange hover:bg-brand-hover text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
