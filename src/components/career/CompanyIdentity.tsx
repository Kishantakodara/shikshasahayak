import React, { useState } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';

export type CompanyBadgeType = 'featured' | 'high-demand' | 'popular' | 'urgent';

interface CompanyIdentityProps {
  companyName: string;
  companyLogoUrl?: string;
  companyVerified?: boolean;
  isVerified?: boolean;
  badgeType?: CompanyBadgeType;
  departmentOrSubtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BADGE_CONFIG: Record<CompanyBadgeType, { label: string; className: string }> = {
  featured: {
    label: 'Featured',
    className: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-800/40',
  },
  'high-demand': {
    label: 'High Demand',
    className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40',
  },
  popular: {
    label: 'Popular',
    className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40',
  },
};

export const CompanyIdentity: React.FC<CompanyIdentityProps> = ({
  companyName,
  companyLogoUrl,
  companyVerified = true,
  isVerified = true,
  badgeType,
  departmentOrSubtitle,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Compute 1-2 letter initials
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || companyName.slice(0, 2).toUpperCase();

  const isCompanyTrusted = Boolean(companyVerified || isVerified);

  const sizeClasses = {
    sm: {
      avatar: 'w-8 h-8 rounded-lg text-xs',
      name: 'text-xs',
      check: 'w-3.5 h-3.5',
    },
    md: {
      avatar: 'w-11 h-11 rounded-xl text-sm',
      name: 'text-sm',
      check: 'w-4 h-4',
    },
    lg: {
      avatar: 'w-14 h-14 rounded-2xl text-base',
      name: 'text-base',
      check: 'w-5 h-5',
    },
  }[size];

  const badge = badgeType ? BADGE_CONFIG[badgeType] : null;

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      {/* Company Avatar / Logo */}
      <div
        className={`${sizeClasses.avatar} bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}
      >
        {companyLogoUrl && !imgError ? (
          <img
            src={companyLogoUrl}
            alt={`${companyName} official logo`}
            className="w-full h-full object-contain p-1"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/10 to-indigo-500/10 dark:from-orange-500/20 dark:to-indigo-500/20 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">
            {initials ? initials : <Building2 className="w-4 h-4 text-slate-400" />}
          </div>
        )}
      </div>

      {/* Name, Verified Tick & Optional Badge */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-semibold text-slate-700 dark:text-slate-200 truncate ${sizeClasses.name}`}
            title={companyName}
          >
            {companyName}
          </span>

          {/* Blue verification checkmark for verified company */}
          {isCompanyTrusted && (
            <span
              title="Verified employer identity"
              className="inline-flex items-center text-blue-500 dark:text-blue-400 shrink-0"
              aria-label="Verified Employer"
            >
              <CheckCircle2 className={`${sizeClasses.check} fill-blue-500/10`} />
            </span>
          )}

          {/* Badge Pill (Featured / High Demand / Popular) */}
          {badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className} tracking-wide shrink-0`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {departmentOrSubtitle && (
          <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
            {departmentOrSubtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default CompanyIdentity;
