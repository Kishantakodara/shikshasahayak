import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchD1StudentProfile } from '../api/studentIdentityClient';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { usePageMeta } from '../utils/seo';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithEmail, loginWithGoogle, currentUser, loginMockUser } = useAuth();

  usePageMeta({
    title: 'Student Login — ShikshaSahayak',
    description: 'Sign in to ShikshaSahayak to access your semester notes, GTU previous year question papers, and personalized study resources.',
    path: '/login',
    robots: 'noindex,follow',
  });

  const urlJoinCode = searchParams.get('joinCode') || searchParams.get('code') || searchParams.get('joincode') || '';
  const [joinCode, setJoinCode] = useState(urlJoinCode ? urlJoinCode.trim().toUpperCase() : '');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  // Persist pending join code into sessionStorage so it survives redirects/auth flow
  useEffect(() => {
    if (urlJoinCode) {
      const cleanCode = urlJoinCode.trim().toUpperCase();
      setJoinCode(cleanCode);
      try {
        sessionStorage.setItem('pending_join_code', cleanCode);
      } catch {}
    } else {
      const stored = sessionStorage.getItem('pending_join_code');
      if (stored) {
        setJoinCode(stored.trim().toUpperCase());
      }
    }
  }, [urlJoinCode]);

  console.log(`[LOGIN] Login component rendered: currentUser=${currentUser?.email || 'null'}, joinCode=${joinCode}`);

  useEffect(() => {
    let isMounted = true;
    if (currentUser) {
      const role = (currentUser.role || '').toLowerCase().trim();
      console.log(`[LoginPage useEffect] currentUser detected: uid=${currentUser.uid}, role=${role}`);
      if (role === 'teacher' || role === 'educator') {
        console.log('[LoginPage useEffect] Navigating to /teacher');
        navigate('/teacher', { replace: true });
      } else if (role === 'admin' || role === 'super_admin') {
        console.log('[LoginPage useEffect] Navigating to /AyushAn0607/dashboard');
        navigate('/AyushAn0607/dashboard', { replace: true });
      } else {
        const fromPath = (location.state as any)?.from?.pathname;
        const activeJoinCode = joinCode || sessionStorage.getItem('pending_join_code') || '';
        fetchD1StudentProfile(currentUser.uid, currentUser.email || undefined)
          .then((profile) => {
            if (!isMounted) return;
            const hasBranch = Boolean(profile?.branch || profile?.branch_id || profile?.branchName || profile?.branch_name);
            const hasSem = Boolean(profile?.semester && Number(profile?.semester) > 0);
            if (profile && (hasBranch || hasSem)) {
              const destination = activeJoinCode ? `/student?joinCode=${encodeURIComponent(activeJoinCode)}` : (fromPath || '/student');
              navigate(destination, { replace: true });
            } else {
              const destination = activeJoinCode ? `/register?joinCode=${encodeURIComponent(activeJoinCode)}` : '/register';
              navigate(destination, { replace: true });
            }
          })
          .catch(() => {
            if (!isMounted) return;
            const destination = activeJoinCode ? `/student?joinCode=${encodeURIComponent(activeJoinCode)}` : (fromPath || '/student');
            navigate(destination, { replace: true });
          });
      }
    }
    return () => { isMounted = false; };
  }, [currentUser, navigate, location, joinCode]);

    const handleDemoLogin = (role: 'student' | 'teacher' | 'admin') => {
    if (role === 'student') {
      const mockProfile = {
        userId: 'dev-mock-uid',
        fullName: 'Aarav Patel',
        email: 'student@shikshasahayak.org',
        collegeName: 'Government Engineering College (GEC)',
        branchId: 'computer-engineering',
        branchName: 'Computer Engineering',
        semester: 4,
        enrollmentNumber: '210101001',
        isProfileComplete: true,
        completedSubjects: ['3110014', '3110003', '3110015'],
        bookmarkedMaterials: ['pyq-dbms-2024', 'notes-os-unit2'],
        targetExam: 'GTU Summer 2026',
        updatedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('shiksha_student_academic_profile_dev-mock-uid', JSON.stringify(mockProfile));
        localStorage.setItem('padhaku_student_academic_profile_dev-mock-uid', JSON.stringify(mockProfile));
        localStorage.setItem('padhaku_student_academic_profile_student@shikshasahayak.org', JSON.stringify(mockProfile));
      } catch {}
      loginMockUser('student@shikshasahayak.org', 'Aarav Patel (Student)', 'student');
      navigate('/student', { replace: true });
    } else if (role === 'teacher') {
      loginMockUser('teacher@shikshasahayak.org', 'Prof. R. Sharma (Educator)', 'teacher');
      navigate('/teacher', { replace: true });
    } else {
      loginMockUser('admin@shikshasahayak.org', 'Lead Evaluator (Admin)', 'admin');
      navigate('/AyushAn0607/dashboard', { replace: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoggingIn(true);
    setError('');
    try {
      await loginWithEmail(email, password);
      // useEffect handles role-based redirect to /student with joinCode preserved
    } catch (err: any) {
      console.error("[LoginPage] Email login failed:", err);
      setError(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGoogleLogin = async (e?: React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    console.log("[GOOGLE_LOGIN_CLICKED]");
    console.log("[GOOGLE_LOGIN_HANDLER_STARTED]");
    setLoggingIn(true);
    setError('');

    try {
      console.log("[BEFORE loginWithGoogle()]");
      const userCred = await loginWithGoogle();
      console.log("[AFTER loginWithGoogle()]");
      console.log("[RESULT RECEIVED]", userCred ? "yes" : "null/undefined");

      if (!userCred || !userCred.user) {
        console.warn("[GOOGLE_LOGIN] No user returned from loginWithGoogle()");
        return;
      }

      console.log(`[FIREBASE USER UID EXISTS?] ${userCred.user.uid} (${userCred.user.email})`);
      const rawRole = String(userCred.role || currentUser?.role || 'student').toLowerCase().trim();
      console.log(`[ROLE RECEIVED] ${rawRole}`);
      console.log(`[AUTH CONTEXT USER EXISTS?] ${Boolean(currentUser)}`);

      let targetDestination = '/student';
      if (rawRole === 'teacher' || rawRole === 'educator') {
        targetDestination = '/teacher';
      } else if (rawRole === 'admin' || rawRole === 'super_admin') {
        targetDestination = '/AyushAn0607/dashboard';
      } else {
        const fromPath = (location.state as any)?.from?.pathname;
        const activeJoinCode = joinCode || sessionStorage.getItem('pending_join_code') || '';
        try {
          const profile = await fetchD1StudentProfile(userCred.user.uid, userCred.user.email || undefined);
          const hasBranch = Boolean(profile?.branch || profile?.branch_id || profile?.branchName || profile?.branch_name);
          const hasSem = Boolean(profile?.semester && Number(profile?.semester) > 0);
          if (profile && (hasBranch || hasSem)) {
            if (activeJoinCode) {
              targetDestination = `/student?joinCode=${encodeURIComponent(activeJoinCode)}`;
            } else if (fromPath && fromPath !== '/login') {
              targetDestination = fromPath;
            } else {
              targetDestination = '/student';
            }
          } else {
            targetDestination = activeJoinCode ? `/register?joinCode=${encodeURIComponent(activeJoinCode)}` : '/register';
          }
        } catch {
          if (activeJoinCode) {
            targetDestination = `/student?joinCode=${encodeURIComponent(activeJoinCode)}`;
          } else if (fromPath && fromPath !== '/login') {
            targetDestination = fromPath;
          }
        }
      }

      console.log(`[NAVIGATION STARTED] Navigating to: ${targetDestination}`);
      navigate(targetDestination, { replace: true });
      console.log(`[NAVIGATION COMPLETED] navigate('${targetDestination}') called`);
    } catch (err: any) {
      console.error("[GOOGLE_LOGIN_REJECTED] Error:", err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.log("[GOOGLE_LOGIN] Popup was closed by user.");
        return;
      }
      if (code === 'auth/internal-error' || msg.includes('internal-error') || code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        setError(`Firebase Auth Error: Domain "${host}" is not authorized. Please add "${host}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else {
        setError(msg || 'Google sign-in failed. Please try again.');
      }
    } finally {
      console.log("[GOOGLE_LOGIN_FINALLY_REACHED]");
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 dark:bg-navy-950 px-4 py-12 transition-colors relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/5 dark:bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-xl overflow-hidden border border-gray-150 dark:border-navy-800 p-6 sm:p-8 space-y-6">
          
          {/* Class Join Invite Banner */}
          {joinCode && (
            <div className="bg-orange-50 dark:bg-orange-950/40 border border-brand-orange/30 rounded-2xl p-4 flex items-center gap-3 animate-pulse-subtle">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left space-y-0.5">
                <div className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                  <span>Class Invitation Detected</span>
                  <span className="px-2 py-0.5 rounded bg-brand-orange text-white font-mono text-[11px] font-extrabold">{joinCode}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                  Sign in to automatically connect to your teacher's study group!
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-2 text-brand-orange shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display">
              Student Sign In
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
              Access your saved semester notes, GTU PYQ papers, and AI Tutor.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 flex items-start gap-2">
              <span className="shrink-0 text-sm">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

                    {/* 🏆 Hackathon Evaluator Instant Mode */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-orange animate-spin-slow" />
                <span className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Hackathon Evaluation Access
                </span>
              </div>
              <span className="text-[10px] bg-brand-orange/20 text-brand-orange font-bold px-2 py-0.5 rounded-full">
                Offline Local DB
              </span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-300">
              Instant 1-click test login with pre-loaded academic data (no password or cloud signup needed):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-navy-800 text-brand-orange hover:bg-orange-50 dark:hover:bg-navy-700 rounded-xl border border-brand-orange/30 shadow-sm transition-all cursor-pointer"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('teacher')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-navy-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-navy-700 rounded-xl border border-blue-500/30 shadow-sm transition-all cursor-pointer"
              >
                👨‍🏫 Teacher
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-navy-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-navy-700 rounded-xl border border-purple-500/30 shadow-sm transition-all cursor-pointer"
              >
                🛠️ Admin
              </button>
            </div>
          </div>

          {/* Single-Click Google Login Button (First) */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loggingIn}
            variant="outline"
            className="w-full py-5 font-bold border-2 border-gray-200 dark:border-navy-800 text-slate-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-navy-800 transition-all flex items-center justify-center gap-2.5 text-xs rounded-xl cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-100 dark:border-navy-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-gray-400 uppercase font-extrabold tracking-widest">Or with email</span>
            <div className="flex-grow border-t border-gray-100 dark:border-navy-800"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-900 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loggingIn}
              className="w-full py-5 font-bold bg-brand-orange text-white hover:bg-brand-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm rounded-xl shadow-md shadow-brand-orange/20 cursor-pointer mt-2"
            >
              {loggingIn ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Registration CTAs */}
          <div className="pt-3 border-t border-gray-100 dark:border-navy-800 text-center space-y-2.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">New to ShikshaSahayak?</p>
            <Link
              to={joinCode ? `/register/student?joinCode=${encodeURIComponent(joinCode)}` : "/register/student"}
              className="block w-full py-2.5 px-4 rounded-xl bg-orange-500/10 text-brand-orange hover:bg-orange-500/15 text-xs font-bold transition-all text-center border border-orange-500/20"
            >
              Create Free Student Account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
