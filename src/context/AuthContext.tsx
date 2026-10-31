import React, { createContext, useContext, useState, useEffect } from 'react';
import { env } from '../config/env';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from '../api/client';
import { auth, googleProvider } from '../utils/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const ALLOWED_ADMIN_EMAILS = [
  'contact@shikshasahayak.org',
  'tech@shikshasahayak.org',
  'team@shikshasahayak.org',
  'mentor@shikshasahayak.org',
  
  'support@shikshasahayak.org',
  'lead@shikshasahayak.org',
  'admin@shikshasahayak.org',
  'developer@shikshasahayak.org',
];

export interface CustomUser {
  uid: string;
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  role: string;
  photoURL?: string;
}

interface AuthContextType {
  currentUser: CustomUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<any>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, role?: string) => Promise<any>;
  loginMockUser: (email: string, name: string, role?: string) => void;
  loginAsStudentA: () => void;
  loginAsStudentB: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  loading: true,
  loginWithGoogle: async () => null,
  loginWithEmail: async () => {},
  registerWithEmail: async () => null,
  loginMockUser: () => {},
  loginAsStudentA: () => {},
  loginAsStudentB: () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("[AUTH_PROVIDER] AuthProvider mounted");
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const mapUser = (backendUser: any): CustomUser => {
    // Map backend role to corresponding frontend roles
    let role = 'student';
    const raw = (backendUser.role || backendUser.userType || '').toLowerCase().trim();
    if (raw === 'admin' || raw === 'super_admin') role = 'admin';
    else if (raw === 'educator' || raw === 'teacher') role = 'teacher';

    return {
      uid: backendUser.id,
      id: backendUser.id,
      email: backendUser.email,
      displayName: backendUser.fullName || backendUser.email.split('@')[0],
      fullName: backendUser.fullName || backendUser.email.split('@')[0],
      role,
      photoURL: backendUser.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    };
  };

  // Restore session from JWT on mount and listen to Firebase auth state
  const fetchUserRole = async (email: string, token: string): Promise<string> => {
    const lowerEmail = (email || '').toLowerCase().trim();
    if (ALLOWED_ADMIN_EMAILS.includes(lowerEmail)) {
      console.log(`[AuthContext] Admin whitelist matched for: ${email}`);
      return 'admin';
    }
    try {
      const apiBase = env.VITE_API_URL || env.apiBaseUrl || '/api';
      console.log(`[AuthContext] BEFORE /api/auth/profile for ${email}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s fallback timeout

      const res = await fetch(`${apiBase}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log(`[AuthContext] AFTER /api/auth/profile HTTP STATUS: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        if (text && !text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          console.log(`[AuthContext] RESPONSE RECEIVED: role=${data?.role || data?.userType}`);
          if (data && (data.role || data.userType)) {
            const rawRole = String(data.role || data.userType || '').toLowerCase().trim();
            if (rawRole === 'admin' || rawRole === 'super_admin') return 'admin';
            if (rawRole === 'teacher' || rawRole === 'educator') return 'teacher';
          }
        }
      }

      // Additional verification: check if teacher profile exists
      try {
        const teacherRes = await fetch(`${apiBase}/teacher/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (teacherRes.ok) {
          const tData = await teacherRes.json().catch(() => ({}));
          if (tData.success && (tData.profile || tData.isOnboarded !== undefined)) {
            console.log(`[AuthContext] Teacher profile confirmed for: ${email}`);
            return 'teacher';
          }
        }
      } catch {}
    } catch (err) {
      console.warn("[AuthContext] Notice: /api/auth/profile lookup fallback to student:", err);
    }
    return 'student';
  };

  useEffect(() => {
    // 0. Handle redirect result if returning from signInWithRedirect
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const token = await result.user.getIdToken();
        setStoredTokens(token, '');
        
        const role = await fetchUserRole(result.user.email || '', token);
        
        setCurrentUser({
          uid: result.user.uid,
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || result.user.email?.split('@')[0] || '',
          fullName: result.user.displayName || result.user.email?.split('@')[0] || '',
          role,
          photoURL: result.user.photoURL || undefined,
        });
      }
    }).catch((err) => {
      console.error("Error processing Firebase Google redirect sign-in:", err);
    });

    // 1. Setup Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(`[AuthContext] onAuthStateChanged fired. User: ${user ? `${user.uid} (${user.email})` : 'null'}`);
      if (user) {
        try {
          const token = await user.getIdToken();
          setStoredTokens(token, '');
          console.log(`[AuthContext] Got ID Token for ${user.email}, fetching role...`);
          
          const role = await fetchUserRole(user.email || '', token);
          console.log(`[AuthContext] Resolved role for ${user.email}: ${role}`);
          
          setCurrentUser({
            uid: user.uid,
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || '',
            fullName: user.displayName || user.email?.split('@')[0] || '',
            role,
            photoURL: user.photoURL || undefined,
          });
          console.log(`[AuthContext] currentUser state successfully updated for ${user.email} (${role})`);
        } catch (error) {
          console.error("[AuthContext] Error setting Firebase user session:", error);
        }
      } else {
        const { access } = getStoredTokens();
        const isDevOrLocal = import.meta.env.DEV || (typeof window !== 'undefined' && (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === '::1'
        ));

        // Check for verified session via /api/auth/profile (Cloudflare Access JWT / HTTP-only session)
        let resolvedFromProfile = false;
        try {
          const profileRes = await fetch('/api/auth/profile', {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData && profileData.success && profileData.email && profileData.role && profileData.role !== 'guest') {
              console.log(`[AuthContext] Session verified via /api/auth/profile for ${profileData.email} (${profileData.role})`);
              setCurrentUser({
                uid: profileData.uid || profileData.id || profileData.email,
                id: profileData.id || profileData.uid || profileData.email,
                email: profileData.email,
                displayName: profileData.displayName || profileData.email.split('@')[0],
                fullName: profileData.displayName || profileData.email.split('@')[0],
                role: profileData.role,
                photoURL: undefined,
              });
              resolvedFromProfile = true;
            }
          }
        } catch (profileErr) {
          // Non-blocking fallback failure
        }

        if (!resolvedFromProfile) {
          if (access && (!access.startsWith('mock-token-') || !isDevOrLocal)) {
            console.log("[AuthContext] User is null, clearing session.");
            setCurrentUser(null);
            clearStoredTokens();
          } else if (!access) {
            setCurrentUser(null);
          }
        }
      }
      setLoading(false);
    });

    // 2. Fallback restoration for Mock Tokens if Firebase hasn't loaded a user (localhost/dev only)
    const restoreMockSession = () => {
      const isDevOrLocal = import.meta.env.DEV || (typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '::1'
      ));

      const { access } = getStoredTokens();
      if (!isDevOrLocal) {
        if (access && access.startsWith('mock-token-')) {
          console.warn('[AuthContext] Purging dev mock token on production/beta environment');
          clearStoredTokens();
        }
        return;
      }

      if (access && access.startsWith('mock-token-')) {
        const parts = access.substring('mock-token-'.length).split('-');
        const rawRole = parts[0]?.toLowerCase() || 'student';
        const role = rawRole === 'admin' || rawRole === 'super_admin' ? 'admin' : rawRole === 'teacher' || rawRole === 'educator' ? 'teacher' : 'student';
        const uid = parts.slice(1).join('-') || 'dev-mock-uid';
        
        setCurrentUser({
          uid,
          id: uid,
          email: role === 'teacher' ? 'teacher@shikshasahayak.org' : 
                 role === 'admin' ? 'admin@shikshasahayak.org' :
                 'developer@shikshasahayak.org',
          displayName: role === 'teacher' ? 'Mock Teacher' : 
                      role === 'admin' ? 'Mock Admin' :
                      'Mock Student',
          fullName: role === 'teacher' ? 'Mock Teacher' : 
                   role === 'admin' ? 'Mock Admin' :
                   'Mock Student',
          role: role,
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        });
      }
    };
    restoreMockSession();

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    console.log("[AuthContext] loginWithGoogle invoked.");
    setLoading(true);
    try {
      let result;
      try {
        console.log("[AuthContext] Calling signInWithPopup...");
        result = await signInWithPopup(auth, googleProvider);
        console.log(`[AuthContext] Popup resolved. User present: ${Boolean(result?.user)}, UID: ${result?.user?.uid}`);
      } catch (popupError: any) {
        console.warn("[AuthContext] Popup authentication notice:", popupError);
        const code = popupError?.code || '';
        const msg = popupError?.message || '';
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          return null;
        }
        if (code === 'auth/popup-blocked') {
          console.warn("[AuthContext] Popup blocked by browser, attempting redirect fallback...");
          await signInWithRedirect(auth, googleProvider);
          return null;
        }

        throw popupError;
      }

      if (result?.user) {
        const token = await result.user.getIdToken();
        setStoredTokens(token, '');
        
        console.log(`[AuthContext] loginWithGoogle fetching role for: ${result.user.email}...`);
        const role = await fetchUserRole(result.user.email || '', token);
        console.log(`[AuthContext] loginWithGoogle resolved role: ${role}`);
        
        const userObj: CustomUser = {
          uid: result.user.uid,
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || result.user.email?.split('@')[0] || '',
          fullName: result.user.displayName || result.user.email?.split('@')[0] || '',
          role,
          photoURL: result.user.photoURL || undefined
        };
        setCurrentUser(userObj);
        console.log("[AuthContext] loginWithGoogle returning customUser & role");
        return { ...result, role, customUser: userObj };
      }
      return null;
    } catch (error: any) {
      console.error("[AuthContext] Firebase Google login failed", error);
      const code = error?.code || '';
      const msg = error?.message || '';
      if (code === 'auth/internal-error' || code === 'auth/unauthorized-domain' || msg.includes('internal-error') || msg.includes('unauthorized-domain')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'deployed domain';
        throw new Error(
          `Google Login Error (${code || 'auth/unauthorized-domain'}): The domain "${currentHost}" must be added to Firebase Authorized Domains (Firebase Console -> Authentication -> Settings -> Authorized domains).`
        );
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setStoredTokens(token, '');
      
      const role = await fetchUserRole(result.user.email || '', token);
      
      setCurrentUser({
        uid: result.user.uid,
        id: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || result.user.email?.split('@')[0] || '',
        fullName: result.user.displayName || result.user.email?.split('@')[0] || '',
        role,
        photoURL: result.user.photoURL || undefined
      });
    } catch (error) {
      console.error("Firebase Email login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string, role: string = 'student') => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      const token = await result.user.getIdToken();
      setStoredTokens(token, '');

      // Initialize D1 profile securely via authenticated Bearer token if student
      if (role === 'student') {
        try {
          await fetch("/api/student/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: result.user.uid,
              profile: {
                userId: result.user.uid,
                displayName: name,
                email: result.user.email || email,
                isProfileComplete: false
              }
            })
          });
        } catch (profileApiErr) {
          console.warn("D1 student profile creation notice:", profileApiErr);
        }
      }
      
      const resolvedRole = await fetchUserRole(result.user.email || '', token);
      const finalRole = resolvedRole !== 'student' ? resolvedRole : role;
      
      const mappedUser = {
        uid: result.user.uid,
        id: result.user.uid,
        email: result.user.email || '',
        displayName: name,
        fullName: name,
        role: finalRole,
        photoURL: result.user.photoURL || undefined
      };
      setCurrentUser(mappedUser);
      return { user: result.user, ...mappedUser };
    } catch (error) {
      console.error("Firebase Email registration failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginMockUser = (email: string, name: string, role: string = 'student') => {
    const rawRole = (role || '').toLowerCase().trim();
    const userRole = email.toLowerCase().includes('teacher') ? 'teacher' : 
                     email.toLowerCase().includes('admin') ? 'admin' :
                     rawRole === 'admin' || rawRole === 'super_admin' ? 'admin' :
                     rawRole === 'teacher' || rawRole === 'educator' ? 'teacher' : 'student';
    
    const mockToken = `mock-token-${userRole}-dev-mock-uid`;
    
    setStoredTokens(mockToken, 'mock-refresh-token');
    setCurrentUser({
      uid: 'dev-mock-uid',
      id: 'dev-mock-uid',
      email,
      displayName: name,
      fullName: name,
      role: userRole,
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    });
    setLoading(false);
  };

  const loginAsStudentA = () => {
    const mockToken = `mock-token-student-student-a-cse-sem5`;
    setStoredTokens(mockToken, 'mock-refresh-token');
    setCurrentUser({
      uid: 'student-a-cse-sem5',
      id: 'student-a-cse-sem5',
      email: 'studentA@shikshasahayak.org',
      displayName: 'Student A (Computer Eng)',
      fullName: 'Student A (Computer Engineering, Sem 5)',
      role: 'student',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    });
    setLoading(false);
  };

  const loginAsStudentB = () => {
    const mockToken = `mock-token-student-student-b-mech-sem5`;
    setStoredTokens(mockToken, 'mock-refresh-token');
    setCurrentUser({
      uid: 'student-b-mech-sem5',
      id: 'student-b-mech-sem5',
      email: 'studentB@shikshasahayak.org',
      displayName: 'Student B (Mechanical Eng)',
      fullName: 'Student B (Mechanical Engineering, Sem 5)',
      role: 'student',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    });
    setLoading(false);
  };
  
  const logout = async () => {
    setLoading(true);
    try {
      const { access } = getStoredTokens();
      if (access && !access.startsWith('mock-token-')) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      clearStoredTokens();
      setCurrentUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, loginWithGoogle, loginWithEmail, registerWithEmail, loginMockUser, loginAsStudentA, loginAsStudentB, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
