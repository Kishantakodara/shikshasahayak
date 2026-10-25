import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isEmailInBetaWhitelist } from '../utils/betaWhitelist';
import { BetaPortalAuth } from './BetaPortalAuth';
import { Loader2 } from 'lucide-react';

export const isBetaHost = typeof window !== 'undefined' && (
  window.location.hostname === 'beta.shikshasahayak.org' ||
  window.location.hostname.startsWith('beta.') ||
  window.location.search.includes('beta=true')
);

interface BetaHostGateProps {
  children: React.ReactNode;
}

export const BetaHostGate: React.FC<BetaHostGateProps> = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [verifying, setVerifying] = useState<boolean>(isBetaHost);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);

  console.log(`[BETA_HOST_GATE] Gate evaluated: isBetaHost=${isBetaHost}, authLoading=${authLoading}, verifying=${verifying}, isWhitelisted=${isWhitelisted}, user=${currentUser?.email || 'null'}`);

  useEffect(() => {
    let isMounted = true;

    if (!isBetaHost) {
      setVerifying(false);
      setIsWhitelisted(true);
      return;
    }

    if (authLoading) {
      return;
    }

    if (!currentUser || !currentUser.email) {
      if (isMounted) {
        setIsWhitelisted(false);
        setVerifying(false);
      }
      return;
    }

    const checkWhitelist = async () => {
      setVerifying(true);
      try {
        const whitelisted = await isEmailInBetaWhitelist(currentUser.email);
        if (isMounted) {
          setIsWhitelisted(whitelisted);
        }
      } catch (err) {
        console.error("Error verifying beta whitelist in BetaHostGate:", err);
        if (isMounted) {
          setIsWhitelisted(false);
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    checkWhitelist();

    return () => {
      isMounted = false;
    };
  }, [currentUser, authLoading]);

  // Non-beta domain: allow normal site access
  if (!isBetaHost) {
    return <>{children}</>;
  }

  // Auth loading or Whitelist verification loading
  if (authLoading || verifying) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950 px-4 py-12 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-gray-150 dark:border-navy-800 p-8 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-orange animate-spin mx-auto" />
          <h2 className="text-lg font-extrabold text-navy-900 dark:text-white font-display">
            Verifying Beta Entitlement...
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Checking authentication session and beta whitelist permissions.
          </p>
        </div>
      </div>
    );
  }

  // On beta host, if user is not logged in OR not whitelisted -> Show Beta Auth card / Access Denied screen
  if (!currentUser || !isWhitelisted) {
    return <BetaPortalAuth />;
  }

  // Authenticated AND Whitelisted -> Grant access to main portal
  return <>{children}</>;
};
