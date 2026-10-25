import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmailInBetaWhitelist } from '../utils/betaWhitelist';
import { BetaPortalAuth } from './BetaPortalAuth';
import { 
  ShieldCheck, 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  Phone,
  GraduationCap,
  School,
  Building,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { apiClient } from '../api/client';
import { SearchableCollegeSelect } from './SearchableCollegeSelect';
import { SearchableBranchSelect } from './SearchableBranchSelect';
import { SearchableUniversitySelect } from './SearchableUniversitySelect';

interface StudentRouteProps {
  children: React.ReactNode;
}



export const StudentRoute: React.FC<StudentRouteProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser, loading, loginWithGoogle, loginWithEmail, registerWithEmail, loginMockUser } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');
  
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1' ||
    window.location.hostname.endsWith('.localhost')
  );
  
  // Toggle between Sign In and Create Account (Register)
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('3');
  const [college, setCollege] = useState('L.D. College of Engineering');
  const [university, setUniversity] = useState('Gujarat Technological University (GTU)');

  // Profile completion flow
  const [profile, setProfile] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const isProfileIncomplete = false;

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (phoneNumber && !/^(?:\+91|91|0)?[6-9]\d{9}$/.test(phoneNumber.replace(/[\s\-()]/g, ''))) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setLoggingIn(true);
    setError('');
    try {
      const profileData = {
        userId: currentUser.uid,
        name: currentUser.displayName || profile?.name || 'Student',
        email: currentUser.email || profile?.email || '',
        phoneNumber: phoneNumber || undefined,
        branch,
        semester: semester ? parseInt(semester, 10) : undefined,
        college,
        university,
      };
      await apiClient.saveStudentProfile(profileData);
      setProfile(profileData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save profile details.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Fetch student profile if authenticated
  const [betaDenied, setBetaDenied] = useState(false);

  const isBetaHost = typeof window !== 'undefined' && (
    window.location.hostname === 'beta.shikshasahayak.org' ||
    window.location.hostname.startsWith('beta.') ||
    window.location.search.includes('beta=true')
  );

  // Fetch student profile & check Beta whitelist if authenticated
  useEffect(() => {
    let active = true;
    if (currentUser) {
      if (currentUser.uid === 'dev-mock-uid') {
        // Automatically skip profile checks for mock user
        setCheckingProfile(false);
        setProfile({ name: currentUser.displayName, email: currentUser.email });
        return;
      }
      setCheckingProfile(true);

      const checkAccessAndProfile = async () => {
        if (isBetaHost && currentUser.email) {
          const whitelisted = await isEmailInBetaWhitelist(currentUser.email);
          if (!whitelisted) {
            if (active) {
              setBetaDenied(true);
              setCheckingProfile(false);
            }
            return;
          }
        }

        try {
          const res = await apiClient.getStudentProfile(currentUser.uid);
          if (active) {
            if (res) {
              setProfile(res);
            } else if (!isBetaHost) {
              // Non-beta auto provision
              const profileData = {
                userId: currentUser.uid,
                name: currentUser.displayName || 'Google Student',
                email: currentUser.email || '',
                avatarUrl: currentUser.photoURL || undefined,
              };
              await apiClient.saveStudentProfile(profileData);
              setProfile(profileData);
            }
            setCheckingProfile(false);
          }
        } catch (err) {
          console.error("Failed to load student profile", err);
          if (active) {
            setCheckingProfile(false);
          }
        }
      };

      checkAccessAndProfile();
    } else {
      setProfile(null);
      setCheckingProfile(false);
    }
    return () => {
      active = false;
    };
  }, [currentUser, isBetaHost]);

  // Handle standard login
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Handle standard registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !branch || !semester || !college || !university) {
      setError('All required fields (Name, Email, Password, Department, Semester, College, University) must be filled.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (phoneNumber && !/^(?:\+91|91|0)?[6-9]\d{9}$/.test(phoneNumber.replace(/[\s\-()]/g, ''))) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setLoggingIn(true);
    setError('');
    try {
      const user = await registerWithEmail(email, password, name);
      const profileData = {
        userId: user.uid,
        name,
        email,
        phoneNumber: phoneNumber || undefined,
        branch,
        semester: semester ? parseInt(semester, 10) : undefined,
        college,
        university,
      };
      await apiClient.saveStudentProfile(profileData);
      setProfile(profileData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In error details:", err);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';

      if (import.meta.env.DEV) {
        console.warn("Dev mode fallback: signing in with mock student user due to Firebase error:", errCode || errMsg);
        loginMockUser('student@shikshasahayak.org', 'Student User', 'student');
        return;
      }

      if (errCode === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
        setError(`Unauthorized Domain: Please add "${window.location.hostname}" to authorized domains in Firebase console.`);
      } else if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        setError('Login Popup Blocked: Please allow popups for this site in your browser settings to continue with Google Sign-In.');
      } else if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        setError('Sign-in cancelled: The login popup was closed before completing authentication.');
      } else if (errCode === 'auth/invalid-api-key' || errCode === 'auth/api-key-not-valid' || errMsg.includes('API key')) {
        setError('Firebase API Key is invalid. Please update VITE_FIREBASE_API_KEY in environment settings.');
      } else {
        setError(`Google Sign-In error: ${err.message || 'Make sure your Firebase project supports Google Auth.'}`);
      }
    } finally {
      setLoggingIn(false);
    }
  };

  // Spinner State
  if (loading || checkingProfile) {
    console.log(`[StudentRoute] Rendering spinner: loading=${loading}, checkingProfile=${checkingProfile}`);
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-brand-orange" />
      </div>
    );
  }

  // Beta Whitelist Denied - Show Beta Portal Access Denied UI directly without redirect loop
  if (betaDenied) {
    console.log(`[StudentRoute] Rendering BetaPortalAuth (Access Denied for ${currentUser?.email})`);
    return <BetaPortalAuth />;
  }

  // Not Logged In - Redirect to Login
  if (!currentUser) {
    console.log(`[StudentRoute] REDIRECTING to /login: currentUser is null`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log(`[StudentRoute] Access GRANTED for: ${currentUser.uid} (${currentUser.email})`);
  return <>{children}</>;
};

export default StudentRoute;
