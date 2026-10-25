import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmailInBetaWhitelist } from '../utils/betaWhitelist';
import { fetchD1StudentProfile } from '../api/studentIdentityClient';
import { ShieldCheck, Sparkles, AlertCircle, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface BetaPortalAuthProps {
  onSuccessRedirect?: string;
}

export const BetaPortalAuth: React.FC<BetaPortalAuthProps> = ({ onSuccessRedirect = '/student' }) => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, loginWithGoogle, logout } = useAuth();

  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNotWhitelisted, setIsNotWhitelisted] = useState(false);
  const [unapprovedEmail, setUnapprovedEmail] = useState('');

  console.log(`[BETA_PORTAL_AUTH] BetaPortalAuth rendered: verifying=${verifying}, isNotWhitelisted=${isNotWhitelisted}, user=${currentUser?.email || 'null'}`);

  // Process logged-in user: whitelist check -> student_profile check -> redirect or error
  const processBetaUser = async (user: any) => {
    if (!user) return;
    setVerifying(true);
    setErrorMsg('');
    setIsNotWhitelisted(false);

    try {
      const email = user.email || '';
      const uid = user.uid;

      if (!email) {
        setErrorMsg('Unable to retrieve a verified email address from Google authentication.');
        setVerifying(false);
        return;
      }

      // 1. Check user email against Firestore collection `beta_whitelist`
      const whitelisted = await isEmailInBetaWhitelist(email);
      if (!whitelisted) {
        setIsNotWhitelisted(true);
        setUnapprovedEmail(email);
        setVerifying(false);
        return;
      }

      // 2. Email IS whitelisted: Check D1 database `padhaku-assessment-db` (student_profiles / student_profile) using Firebase UID
      let hasProfile = false;
      try {
        // Try server-side Bearer API check first
        const token = await user.getIdToken();
        const apiRes = await fetch('/api/beta/check-access', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (apiRes.ok) {
          const accessData = await apiRes.json();
          hasProfile = Boolean(accessData.hasProfile);
        } else {
          // Fallback to student profile client fetch
          const profile = await fetchD1StudentProfile(uid, email);
          const hasBranch = Boolean(profile?.branch || profile?.branch_id || profile?.branchName || profile?.branch_name);
          const hasSem = Boolean(profile?.semester && Number(profile?.semester) > 0);
          hasProfile = Boolean(profile && (hasBranch || hasSem));
        }
      } catch (checkErr) {
        console.warn("Notice: Beta check-access API fallback:", checkErr);
        const profile = await fetchD1StudentProfile(uid, email);
        const hasBranch = Boolean(profile?.branch || profile?.branch_id || profile?.branchName || profile?.branch_name);
        const hasSem = Boolean(profile?.semester && Number(profile?.semester) > 0);
        hasProfile = Boolean(profile && (hasBranch || hasSem));
      }

      // 3. Route user to student dashboard if profile complete, else to /register
      navigate(hasProfile ? (onSuccessRedirect || '/student') : '/register', { replace: true });
    } catch (err: any) {
      console.error("Beta Portal authentication processing error:", err);
      setErrorMsg(err?.message || 'An error occurred during beta access verification. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Automatically check access if Firebase session restores an authenticated user
  useEffect(() => {
    if (currentUser && !authLoading && !verifying && !isNotWhitelisted) {
      processBetaUser(currentUser);
    }
  }, [currentUser, authLoading]);

  const handleGoogleSignIn = async () => {
    setVerifying(true);
    setErrorMsg('');
    setIsNotWhitelisted(false);
    try {
      const userCred = await loginWithGoogle();
      if (userCred?.user) {
        await processBetaUser(userCred.user);
      }
    } catch (err: any) {
      console.error("Google Sign-In failed for Beta Portal:", err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain';
        setErrorMsg(`Domain "${currentHost}" must be authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setErrorMsg('Sign-in popup blocked by browser. Please enable popups or try again.');
      } else {
        setErrorMsg(msg || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setIsNotWhitelisted(false);
    setUnapprovedEmail('');
    setErrorMsg('');
  };

  if (authLoading || verifying) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950 px-4 py-12 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-gray-150 dark:border-navy-800 p-8 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-orange animate-spin mx-auto" />
          <h2 className="text-lg font-extrabold text-navy-900 dark:text-white font-display">
            Verifying Beta Entitlement...
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Checking Firebase session, whitelist authorization, and profile records.
          </p>
        </div>
      </div>
    );
  }

  // State: User email is NOT whitelisted
  if (isNotWhitelisted) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 dark:bg-navy-950 px-4 py-12 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-navy-900 rounded-3xl shadow-xl overflow-hidden border border-red-200 dark:border-red-900/40 p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center mx-auto text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30">
              <AlertCircle className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-extrabold text-[11px] uppercase tracking-wider">
              Access Denied
            </span>
            <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">
              Beta Access Not Approved
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              You are not currently approved for the ShikshaSahayak Beta. The Google account <strong className="text-navy-900 dark:text-white font-mono">{unapprovedEmail}</strong> is not whitelisted.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-xs text-gray-600 dark:text-gray-300 space-y-2">
            <p className="font-bold text-navy-900 dark:text-white">Need access?</p>
            <p>
              Please contact the ShikshaSahayak team at <a href="mailto:team@shikshasahayak.org" className="text-brand-orange font-bold hover:underline">team@shikshasahayak.org</a> to request whitelist approval.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSignOut}
            className="w-full py-5 font-extrabold bg-navy-900 dark:bg-navy-800 text-white hover:bg-navy-800 dark:hover:bg-navy-700 transition-all flex items-center justify-center gap-2 text-xs rounded-xl cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Try Another Account</span>
          </Button>

        </div>
      </div>
    );
  }

  // State: Simple "Sign in with Google" card landing as seen in ambassador gateway
  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#F8FAFC] dark:bg-navy-950 px-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-navy-900 rounded-[32px] shadow-xl border border-slate-200/80 dark:border-navy-800 p-8 sm:p-10 text-center space-y-6">
        
        {/* Top Rounded Icon Box */}
        <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-[#2563EB] dark:text-blue-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-[#2563EB] dark:text-blue-400" />
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            ShikshaSahayak Beta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-xs mx-auto">
            Sign in with your authorized Google account to access your dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/30 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Solid Blue Sign in with Google Button */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={verifying}
            className="w-full py-3.5 px-6 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            {verifying ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
