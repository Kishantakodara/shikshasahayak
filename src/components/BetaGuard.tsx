import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useBetaFeatures } from '../hooks/useBetaFeatures';
import { Sparkles, ShieldAlert, ArrowLeft } from 'lucide-react';

interface BetaGuardProps {
  featureKey?: string;
  children: React.ReactNode;
  fallbackToHome?: boolean;
}

export const BetaGuard: React.FC<BetaGuardProps> = ({ featureKey, children, fallbackToHome = false }) => {
  const { isBetaTester, betaFeaturesEnabled, hasFeature, loading } = useBetaFeatures();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verifying 2.0 Beta entitlement...</p>
      </div>
    );
  }

  const isAllowed = featureKey
    ? hasFeature(featureKey)
    : (betaFeaturesEnabled && isBetaTester);

  if (!isAllowed) {
    if (fallbackToHome) {
      return <Navigate to="/student" replace />;
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-brand-orange flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" /> Beta Preview Only
            </span>
            <h2 className="text-2xl font-extrabold text-text font-display">2.0 Feature Access Required</h2>
            <p className="text-sm text-text-muted">
              This feature is currently available exclusively to registered <strong>ShikshaSahayak 2.0 Beta Testers</strong>.
            </p>
          </div>

          <div className="bg-background p-4 rounded-2xl border border-border text-xs text-text-muted text-left space-y-1 font-mono">
            <p className="font-bold text-text">Access Conditions:</p>
            <p>• Authenticated Student / User</p>
            <p>• Approved in Admin Beta Management</p>
            <p>• Active Feature Flag ({featureKey || 'betaFeaturesEnabled'})</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/student"
              className="flex-1 px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to My Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
