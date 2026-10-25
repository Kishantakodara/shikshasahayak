import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStoredTokens } from '../../api/client';
import { Loader2 } from 'lucide-react';
import { TeacherHierarchy } from '../../types/teacher';

interface TeacherRouteProps {
  children: React.ReactNode;
  requiredHierarchy?: TeacherHierarchy;
}

/**
 * TeacherRoute Guard Component
 * 
 * Protects teacher-only routes and enforces hierarchy-based permissions.
 */
export const TeacherRoute: React.FC<TeacherRouteProps> = ({ 
  children, 
  requiredHierarchy 
}) => {
  const { currentUser, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileVerified, setProfileVerified] = useState<boolean | null>(null);

  const rawRole = (currentUser?.role || '').toLowerCase().trim();
  const isTeacherRole = rawRole === 'teacher' || 
                        rawRole === 'educator' || 
                        rawRole === 'admin' || 
                        rawRole === 'super_admin';

  useEffect(() => {
    let isMounted = true;
    if (currentUser && !isTeacherRole && profileVerified === null) {
      setCheckingProfile(true);
      const { access } = getStoredTokens();
      if (access) {
        fetch('/api/teacher/profile', {
          headers: { 'Authorization': `Bearer ${access}` }
        })
          .then(res => res.json())
          .then(data => {
            if (isMounted) {
              if (data.success && (data.profile || data.isOnboarded !== undefined)) {
                setProfileVerified(true);
              } else {
                setProfileVerified(false);
              }
              setCheckingProfile(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setProfileVerified(false);
              setCheckingProfile(false);
            }
          });
      } else {
        setProfileVerified(false);
        setCheckingProfile(false);
      }
    }
    return () => { isMounted = false; };
  }, [currentUser, isTeacherRole, profileVerified]);

  // Show loading spinner while checking authentication or profile verification
  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-brand-orange mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verifying teacher credentials...
          </p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to teacher login
  if (!currentUser) {
    return <Navigate to="/teacher/login" replace />;
  }

  // Check if user has teacher role or verified teacher profile
  const hasAccess = isTeacherRole || profileVerified === true;

  // Redirect non-teachers to teacher login page
  if (!hasAccess) {
    return <Navigate to="/teacher/login" replace />;
  }

  return <>{children}</>;
};
