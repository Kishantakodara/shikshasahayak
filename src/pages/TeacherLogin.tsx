// ============================================================
// SHIKSHA SAHAYAK OS - TEACHER AUTHENTICATION & PORTAL ENTRY
// Real Firebase Authentication & D1 Educator Identity Verification
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStoredTokens } from '../api/client';
import { Loader2, GraduationCap, Mail, Lock, User, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function TeacherLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const { loginWithEmail, loginWithGoogle, registerWithEmail, currentUser, loading: authLoading, loginMockUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if authenticated teacher
  useEffect(() => {
    if (currentUser && !authLoading) {
      const rawRole = (currentUser.role || '').toLowerCase().trim();
      const isTeacher = rawRole === 'teacher' || 
                        rawRole === 'educator' || 
                        rawRole === 'admin' ||
                        rawRole === 'super_admin';
      if (isTeacher) {
        // Check if teacher profile exists in D1
        const { access } = getStoredTokens();
        fetch('/api/teacher/profile', {
          headers: { 'Authorization': `Bearer ${access}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.isOnboarded) {
              navigate('/teacher', { replace: true });
            } else {
              navigate('/teacher/onboarding', { replace: true });
            }
          })
          .catch(() => {
            navigate('/teacher', { replace: true });
          });
      }
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        const { access } = getStoredTokens();
        try {
          const profileRes = await fetch('/api/teacher/profile', {
            headers: { 'Authorization': `Bearer ${access}` }
          });
          const data = await profileRes.json().catch(() => ({}));
          if (data.isOnboarded) {
            navigate('/teacher', { replace: true });
          } else {
            navigate('/teacher/onboarding', { replace: true });
          }
        } catch {
          navigate('/teacher', { replace: true });
        }
      } else {
        if (!fullName.trim()) {
          throw new Error('Full Name is required for educator registration');
        }
        // 1. Create Firebase Auth user with teacher role
        await registerWithEmail(email.trim(), password, fullName.trim(), 'teacher');
        
        // 2. Obtain ID token and create D1 teacher identity
        const { access } = getStoredTokens();
        const profileRes = await fetch('/api/teacher/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            department: 'Computer Engineering',
            institution: 'Gujarat Technological University',
            designation: 'Assistant Professor',
            subjects: ['General Academic'],
            branches: ['computer-engineering'],
            semesters: [1, 2, 3, 4, 5, 6, 7, 8]
          })
        });

        if (!profileRes.ok) {
          const errData = await profileRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create teacher identity in D1 database');
        }

        navigate('/teacher/onboarding', { replace: true });
      }
    } catch (err: any) {
      console.error('Teacher Auth Error:', err);
      let msg = err.message || 'Authentication failed';
      if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
        msg = 'Invalid email or password. Please verify your credentials.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const userCred = await loginWithGoogle();
      if (!userCred || !userCred.user) return;

      const { access } = getStoredTokens();
      // Verify/ensure teacher profile in D1
      const profileRes = await fetch('/api/teacher/profile', {
        headers: { 'Authorization': `Bearer ${access}` }
      });
      const data = await profileRes.json().catch(() => ({}));

      if (!data.profile) {
        // Initialize basic teacher profile
        await fetch('/api/teacher/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`
          },
          body: JSON.stringify({
            fullName: userCred.user.displayName || 'Educator',
            department: 'Engineering',
            institution: 'Gujarat Technological University',
            designation: 'Faculty',
            subjects: ['General Academic'],
            branches: ['engineering'],
            semesters: [1, 2, 3, 4, 5, 6, 7, 8]
          })
        });
        navigate('/teacher/onboarding', { replace: true });
      } else if (data.isOnboarded) {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/teacher/onboarding', { replace: true });
      }
    } catch (err: any) {
      console.error("Google Educator Sign-In error:", err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      setErrorMsg(msg || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070d19]">
        <Loader2 className="h-12 w-12 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#070d19] overflow-hidden font-sans p-4">
      {/* Ambient backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 dark:bg-navy-900/70 backdrop-blur-xl border border-gray-100 dark:border-navy-800/80 rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-200/20 dark:border-orange-500/10 text-brand-orange text-[10px] font-bold tracking-wider uppercase mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>ShikshaSahayak Educator Portal</span>
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
              {mode === 'login' ? 'Welcome Back, Educator' : 'Register Educator Account'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mode === 'login' 
                ? 'Sign in with your Firebase account to manage classes & assessments.' 
                : 'Create a new faculty account connected to Cloudflare D1.'}
            </p>
          </div>

                    {/* 🏆 Hackathon Evaluator Instant Mode */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1.5 text-center">
            <p className="text-[11px] text-blue-300 font-medium">🇮🇳 Hack for Social Cause (VBYLD 2027) Access:</p>
            <button
              type="button"
              onClick={() => {
                loginMockUser('teacher@shikshasahayak.org', 'Prof. R. Sharma (Faculty)', 'teacher');
                navigate('/teacher', { replace: true });
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
            >
              👨‍🏫 Instant Demo Faculty Sign-In
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-navy-950/60 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === 'login' 
                  ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === 'register' 
                  ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Prof. Rajesh Sharma"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teacher@institution.edu.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/40 text-navy-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 text-sm font-bold bg-brand-orange hover:bg-orange-600 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying credentials...</span>
                </div>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Educator Dashboard' : 'Register & Setup Profile'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Social Google Login for Teachers */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-navy-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-gray-400 uppercase font-bold tracking-wider">Or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-navy-800"></div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            variant="outline"
            className="w-full py-5 font-bold border-2 border-gray-200 dark:border-navy-800 text-slate-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-navy-800 transition-all flex items-center justify-center gap-2.5 text-xs rounded-xl cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </Button>

          <Button
            type="button"
            onClick={() => loginMockUser('teacher@shikshasahayak.org', 'Prof. Educator', 'teacher')}
            variant="outline"
            className="w-full py-4 font-bold border-2 border-dashed border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-navy-800 transition-all flex items-center justify-center gap-2 text-xs rounded-xl cursor-pointer"
          >
            <span>⚡ [Demo / Evaluator] Instant Faculty Login</span>
          </Button>

          {/* Footer note */}
          <div className="text-center pt-2 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Are you a student?{' '}
              <a href="/register/student" className="text-brand-orange font-bold hover:underline">
                Register as Student
              </a>
            </p>
            <div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                Secured by Firebase Authentication & Cloudflare D1
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
