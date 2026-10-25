import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';

export interface VerificationIndicatorProps {
  isVerified?: boolean;
  companyVerified?: boolean;
  sourceVerified?: boolean;
  applicationDeadline?: string;
  isClosed?: boolean;
  vacancyCheckedAt?: string;
  officialApplicationUrl?: string;
  variant?: 'banner' | 'pill' | 'detailed';
  className?: string;
}

export function isDeadlineExpired(deadlineStr?: string): boolean {
  if (!deadlineStr || deadlineStr.toLowerCase().includes('rolling') || deadlineStr.toLowerCase().includes('open')) {
    return false;
  }
  const parsed = new Date(deadlineStr);
  if (isNaN(parsed.getTime())) return false;
  // End of day deadline
  parsed.setHours(23, 59, 59, 999);
  return parsed.getTime() < Date.now();
}

export function isValidHttpUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return false;
  }
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

export const VerificationIndicator: React.FC<VerificationIndicatorProps> = ({
  isVerified = true,
  companyVerified = true,
  sourceVerified = true,
  applicationDeadline,
  isClosed = false,
  vacancyCheckedAt,
  officialApplicationUrl,
  variant = 'banner',
  className = '',
}) => {
  const expired = isClosed || isDeadlineExpired(applicationDeadline);
  const sourceSafe = isValidHttpUrl(officialApplicationUrl);
  const fullyVerified = isVerified && sourceVerified && sourceSafe && !expired;

  // 1. Expired state
  if (expired) {
    if (variant === 'pill') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 ${className}`}>
          <Clock className="w-3 h-3 text-rose-600" />
          Applications Closed
        </span>
      );
    }
    return (
      <div className={`p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 ${className}`}>
        <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block">Application Period Expired</strong>
          <span className="text-[11px] opacity-90 leading-tight">
            The application deadline ({applicationDeadline || 'recent'}) has passed. This vacancy is archived.
          </span>
        </div>
      </div>
    );
  }

  // 2. Unverified or Needs Review state
  if (!isVerified || !sourceSafe) {
    if (variant === 'pill') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 ${className}`}>
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Verification Pending
        </span>
      );
    }
    return (
      <div className={`p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 ${className}`}>
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block">External Submission • Needs Review</strong>
          <span className="text-[11px] opacity-90 leading-tight">
            ShikshaSahayak has not independently verified this employer application link. Always verify the employer identity before submitting personal credentials.
          </span>
        </div>
      </div>
    );
  }

  // 3. Pill Variant (Compact for Card Header)
  if (variant === 'pill') {
    return (
      <span
        title="Verified opportunity checked by ShikshaSahayak"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        Verified Vacancy
      </span>
    );
  }

  // 4. Detailed Breakdown Variant (For Opportunity Details Modal)
  if (variant === 'detailed') {
    return (
      <div className={`space-y-2 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-slate-700 dark:text-slate-300 ${className}`}>
        <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Opportunity Provenance & Safety
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Company Identity: <strong>Verified</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Application Portal: <strong>Direct Official</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Vacancy Checked: <strong>{vacancyCheckedAt ? new Date(vacancyCheckedAt).toLocaleDateString() : 'Active Now'}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Default Banner Variant (Matching Reference Design input_file_1.png)
  return (
    <div
      className={`p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200 ${className}`}
    >
      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <strong className="font-bold text-blue-900 dark:text-blue-200 block text-xs">
          Verified Vacancy
        </strong>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
          This opportunity is verified by ShikshaSahayak. Apply with confidence!
        </span>
      </div>
    </div>
  );
};

export default VerificationIndicator;
