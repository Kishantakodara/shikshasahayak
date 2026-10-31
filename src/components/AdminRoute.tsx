import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, loading, logout } = useAuth();
  

  
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin" replace />;
  }

  // Unified Admin Role & Email Authorization Guard
  const allowedAdminEmails = [
    'contact@shikshasahayak.org',
    'tech@shikshasahayak.org',
    'team@shikshasahayak.org',
    'mentor@shikshasahayak.org',
    'support@shikshasahayak.org',
    'lead@shikshasahayak.org',
    'admin@shikshasahayak.org',
    'developer@shikshasahayak.org',
  ];

  const userEmail = (currentUser.email || '').toLowerCase().trim();
  const userRole = (currentUser.role || '').toLowerCase().trim();

  const isAuthorizedAdmin =
    userRole === 'admin' ||
    userRole === 'super_admin' ||
    allowedAdminEmails.includes(userEmail);

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-navy-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-navy-900 rounded-2xl shadow-xl overflow-hidden border border-red-100 dark:border-red-900/30 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">Unauthorized Access</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The account <strong>{currentUser.email || currentUser.uid}</strong> does not have administrator privileges.
          </p>
          <button
            onClick={() => logout()}
            className="w-full py-3 rounded-xl font-bold bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-all cursor-pointer"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
