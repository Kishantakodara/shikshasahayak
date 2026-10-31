import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('shiksha_cookie_consent');
    const bannerSeen = localStorage.getItem('shiksha_cookie_banner_seen');
    if (!consent && !bannerSeen) {
      // Small delay before showing banner for smoother UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Mark as seen immediately so it doesn't show on subsequent pages/refreshes
        localStorage.setItem('shiksha_cookie_banner_seen', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem('shiksha_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('shiksha_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 animate-slide-up">
      <div className="bg-navy-900/95 dark:bg-navy-950/95 backdrop-blur-md text-white border border-brand-orange/30 rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center shrink-0">
              <Cookie className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Cookie & Privacy Preference <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </h4>
              <p className="text-[11px] text-gray-300">Google AdSense & Essential Analytics</p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          ShikshaSahayak uses cookies to personalize academic content, optimize site speed, analyze engineering study trends, and display relevant Google AdSense advertisements. Read our{' '}
          <Link to="/privacy-policy" className="text-brand-orange underline font-semibold hover:text-orange-400">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link to="/terms-and-conditions" className="text-brand-orange underline font-semibold hover:text-orange-400">
            Terms of Use
          </Link>.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 px-3 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-sm hover:shadow-orange-500/20 cursor-pointer"
          >
            Accept All Cookies
          </button>
          <button
            onClick={handleDecline}
            className="py-2 px-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-gray-300 hover:text-white font-semibold text-xs border border-navy-700 transition-all cursor-pointer"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
