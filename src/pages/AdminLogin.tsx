import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLogin: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, currentUser, loginMockUser } = useAuth();

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1' ||
    window.location.hostname.endsWith('.localhost')
  );

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      // The useEffect will handle redirect once currentUser is set
    } catch (err: any) {
      console.error("Google Login Error details:", err);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';

      if (import.meta.env.DEV) {
        console.warn("Dev mode fallback: signing in with mock admin user due to Firebase error:", errCode || errMsg);
        loginMockUser('admin@shikshasahayak.org', 'Admin User', 'Admin');
        return;
      }

      if (errCode === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
        setError(`Unauthorized Domain: Please add "${window.location.hostname}" to your Firebase project's "Authorized domains" list (Firebase Console -> Authentication -> Settings -> Authorized domains tab).`);
      } else if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        setError('Login Popup Blocked: Please allow popups for this site in your browser settings to continue with Google Sign-In.');
      } else if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        setError('Sign-in cancelled: The login popup was closed before completing authentication.');
      } else {
        setError(`Google Sign-In failed: ${err.message || 'Make sure your Firebase project allows Google authentication.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-navy-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-navy-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-navy-800">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-brand-orange" />
            </div>
            <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-3">Admin Portal</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to manage ShikshaSahayak.</p>
          </div>

          {/* Admin-only notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4 flex items-start gap-3 mb-8">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Admin access only.</span> This login page is exclusively for site administrators. If you are a student, you do not need to log in to use ShikshaSahayak.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 mb-8 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 dark:text-white mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all"
                placeholder="admin@shikshasahayak.org"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-navy-900 dark:text-white mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md active:scale-[0.98] mt-2 ${
                isLoading 
                  ? 'bg-brand-orange/70 cursor-not-allowed' 
                  : 'bg-brand-orange hover:bg-orange-600 shadow-orange-500/20'
              }`}
            >
              {isLoading ? 'Authenticating...' : 'Sign in to Dashboard'}
            </button>
          </form>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-navy-700"></div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">OR</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-navy-700"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
            className={`w-full flex items-center justify-center gap-3 py-3.5 border border-gray-300 dark:border-navy-700 rounded-xl font-medium text-navy-900 dark:text-white transition-all shadow-sm active:scale-[0.98] ${
              isLoading ? 'bg-gray-100 dark:bg-navy-800 cursor-not-allowed' : 'bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            Google login is restricted to authorised admins only.
          </p>

          {isLocalhost && (
            <button
              type="button"
              onClick={() => loginMockUser('team@shikshasahayak.org', 'Dev Admin')}
              id="dev-admin-login-btn"
              className="w-full mt-4 py-2.5 border-2 border-dashed border-brand-orange text-brand-orange hover:bg-brand-orange/10 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              ⚡ [Localhost Only] Instant Admin Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
