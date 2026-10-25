/**
 * LocationPermissionGuide
 *
 * A rich, device-aware inline card shown when GPS access is denied or unavailable.
 * Shows step-by-step instructions tailored to the user's device (iOS / Android / desktop)
 * and browser (Chrome, Firefox, Safari, Edge, Samsung, Opera).
 *
 * Also includes a compact "GPS Status Badge" component for embedding in forms.
 */

import React from 'react';
import {
  MapPin,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Shield,
  WifiOff,
  Clock,
} from 'lucide-react';
import { LocationPermissionState, detectBrowser, detectPlatform } from '../../hooks/useLocationPermission';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LocationPermissionGuideProps {
  state: LocationPermissionState;
  onRetry: () => void;
  className?: string;
}

// ─── Per-browser step instructions ──────────────────────────────────────────

interface StepInstructions {
  title: string;
  icon: React.ReactNode;
  steps: string[];
  note?: string;
}

function getDeniedInstructions(): StepInstructions {
  const platform = detectPlatform();
  const browser = detectBrowser();

  // iOS — Safari or Chrome (both use WebKit under the hood on iOS)
  if (platform === 'ios') {
    return {
      title: 'Allow Location on iPhone / iPad',
      icon: <Smartphone className="w-4 h-4 text-blue-500" />,
      steps: [
        'Open the iOS Settings app',
        'Scroll down and tap "Privacy & Security"',
        'Tap "Location Services" and ensure it is turned ON',
        `Find "${browser === 'chrome' ? 'Chrome' : 'Safari'}" in the list and set it to "While Using"`,
        'Return to the app and tap "Allow GPS & Detect Location" again',
      ],
      note: 'On iOS, each app and browser controls location access individually through the Settings app.',
    };
  }

  // Android
  if (platform === 'android') {
    if (browser === 'chrome') {
      return {
        title: 'Allow Location in Chrome (Android)',
        icon: <Smartphone className="w-4 h-4 text-green-500" />,
        steps: [
          'Tap the 🔒 padlock icon in the Chrome address bar',
          'Tap "Site settings"',
          'Tap "Location" and select "Allow"',
          'Refresh the page and try again',
        ],
        note: 'Also make sure Android Location Services are enabled in your phone\'s Settings → Location.',
      };
    }
    if (browser === 'firefox') {
      return {
        title: 'Allow Location in Firefox (Android)',
        icon: <Smartphone className="w-4 h-4 text-orange-500" />,
        steps: [
          'Tap the 🔒 lock or ⋮ menu in the address bar',
          'Tap "Edit Site Permissions"',
          'Set "Access your location" to "Allow"',
          'Tap "Allow GPS & Detect Location" again',
        ],
      };
    }
    if (browser === 'samsung') {
      return {
        title: 'Allow Location in Samsung Internet',
        icon: <Smartphone className="w-4 h-4 text-blue-600" />,
        steps: [
          'Tap the ☰ menu → "Settings"',
          'Tap "Sites and Downloads" → "Site permissions"',
          'Tap "Location" and find this website',
          'Switch it from "Block" to "Allow"',
          'Reload the page and try again',
        ],
      };
    }
    // Generic Android
    return {
      title: 'Allow Location (Android)',
      icon: <Smartphone className="w-4 h-4 text-green-500" />,
      steps: [
        'Tap the lock icon 🔒 in your browser address bar',
        'Find the "Location" or "Permissions" option',
        'Change it to "Allow"',
        'Reload the page and try again',
      ],
      note: 'Also check Android Settings → Location is enabled.',
    };
  }

  // Desktop
  if (browser === 'chrome') {
    return {
      title: 'Allow Location in Chrome',
      icon: <Monitor className="w-4 h-4 text-blue-500" />,
      steps: [
        'Click the 🔒 padlock icon in the Chrome address bar (left side)',
        'Click "Site settings"',
        'Find "Location" and change it from "Block" to "Allow"',
        'Reload this page and click "Allow GPS & Detect Location" again',
      ],
      note: 'Alternatively: Chrome → Settings → Privacy and security → Site Settings → Location',
    };
  }
  if (browser === 'firefox') {
    return {
      title: 'Allow Location in Firefox',
      icon: <Monitor className="w-4 h-4 text-orange-500" />,
      steps: [
        'Click the lock icon 🔒 in the Firefox address bar',
        'Click the "×" next to "Blocked" for Location to clear the block',
        'Reload the page — Firefox will ask you again',
        'Click "Allow" on the permission popup',
      ],
    };
  }
  if (browser === 'safari') {
    return {
      title: 'Allow Location in Safari',
      icon: <Monitor className="w-4 h-4 text-blue-400" />,
      steps: [
        'Open Safari → "Settings" (⌘,)',
        'Click "Websites" tab',
        'Click "Location" in the left sidebar',
        'Find this website and change it to "Allow"',
        'Reload the page and try again',
      ],
    };
  }
  if (browser === 'edge') {
    return {
      title: 'Allow Location in Edge',
      icon: <Monitor className="w-4 h-4 text-blue-600" />,
      steps: [
        'Click the 🔒 lock icon in the Edge address bar',
        'Click "Permissions for this site"',
        'Find "Location" and set it to "Allow"',
        'Reload the page and try again',
      ],
    };
  }

  // Fallback generic
  return {
    title: 'Allow Location Access',
    icon: <Monitor className="w-4 h-4 text-slate-500" />,
    steps: [
      'Click the lock icon 🔒 in your browser address bar',
      'Find "Location" or "Permissions" and change it to "Allow"',
      'Reload the page and try again',
    ],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const LocationPermissionGuide: React.FC<LocationPermissionGuideProps> = ({
  state,
  onRetry,
  className = '',
}) => {
  if (state === 'idle' || state === 'granted') return null;

  // Requesting state — compact loading indicator
  if (state === 'requesting') {
    return (
      <div className={`flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 ${className}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span className="font-semibold">Requesting GPS access — please allow in your browser popup…</span>
      </div>
    );
  }

  // Unsupported
  if (state === 'unsupported') {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <WifiOff className="w-4 h-4 text-slate-500" />
          GPS Not Supported
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Your browser does not support GPS location. Please use <strong>Google Chrome</strong> or <strong>Firefox</strong> on a modern device.
        </p>
      </div>
    );
  }

  // Insecure origin
  if (state === 'insecure') {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-bold text-yellow-700 dark:text-yellow-400">
          <Shield className="w-4 h-4" />
          Secure Connection Required
        </div>
        <p className="text-[11px] text-yellow-700 dark:text-yellow-300">
          Browsers block GPS on non-secure pages. Please ensure you are accessing this site via <strong>https://</strong>.
        </p>
      </div>
    );
  }

  // Timeout
  if (state === 'timeout') {
    return (
      <div className={`p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          <Clock className="w-4 h-4" />
          GPS Signal Timed Out
        </div>
        <ul className="text-[11px] text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
          <li>Make sure your device's <strong>Location Services</strong> are turned on</li>
          <li>Try enabling Wi-Fi (improves indoor GPS accuracy)</li>
          <li>Move closer to a window or outside for better signal</li>
        </ul>
        <button
          type="button"
          onClick={onRetry}
          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer border-none transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry GPS Detection
        </button>
      </div>
    );
  }

  // Unavailable
  if (state === 'unavailable') {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <WifiOff className="w-4 h-4 text-red-500" />
          GPS Signal Not Available
        </div>
        <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>Enable Location Services on your device</li>
          <li>Turn on Wi-Fi or mobile data for assisted GPS</li>
          <li>Move to an open area (avoid underground areas / thick walls)</li>
        </ul>
        <button
          type="button"
          onClick={onRetry}
          className="w-full py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer border-none transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  // Denied — the most detailed guide
  const instructions = getDeniedInstructions();

  return (
    <div className={`p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-extrabold text-red-700 dark:text-red-400">
            Location Access Blocked
          </p>
          <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
            Your browser is blocking GPS access for this site. Follow the steps below to allow it.
          </p>
        </div>
      </div>

      {/* Device/browser-specific steps */}
      <div className="bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/40 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {instructions.icon}
          {instructions.title}
        </div>
        <ol className="space-y-1.5">
          {instructions.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
              <span className="flex-none w-4 h-4 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[9px] font-extrabold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {instructions.note && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-2">
            💡 {instructions.note}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer border-none transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          I've Allowed — Try Again
        </button>
        <a
          href="https://support.google.com/chrome/answer/142065"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 no-underline hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Help Article
        </a>
      </div>

      {/* Optional: GPS not required notice */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
        GPS is optional — you can still submit attendance without it.
      </p>
    </div>
  );
};

// ─── GPS Status Badge ─────────────────────────────────────────────────────────

interface GpsStatusBadgeProps {
  state: LocationPermissionState;
}

export const GpsStatusBadge: React.FC<GpsStatusBadgeProps> = ({ state }) => {
  const configs: Record<string, { label: string; className: string }> = {
    idle:        { label: 'GPS Not Detected',   className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700' },
    requesting:  { label: 'Detecting…',          className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse' },
    granted:     { label: '✓ GPS Ready',         className: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
    denied:      { label: '⛔ Access Denied',    className: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' },
    unavailable: { label: '⚠ No Signal',        className: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
    timeout:     { label: '⚠ Timed Out',        className: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
    unsupported: { label: '✗ Not Supported',    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700' },
    insecure:    { label: '🔒 HTTPS Required',   className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' },
  };

  const cfg = configs[state] ?? configs['idle'];

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

// ─── GPS Location Card (full widget used inside forms) ────────────────────────

interface GpsLocationCardProps {
  permissionState: LocationPermissionState;
  coords: { latitude: number; longitude: number; accuracy: number } | null;
  isRequesting: boolean;
  onRequest: () => void;
  onRetry: () => void;
  /** If true, show "GPS is optional" note */
  isOptional?: boolean;
}

export const GpsLocationCard: React.FC<GpsLocationCardProps> = ({
  permissionState,
  coords,
  isRequesting,
  onRequest,
  onRetry,
  isOptional = true,
}) => {
  const showGuide = ['denied', 'unavailable', 'timeout', 'unsupported', 'insecure'].includes(permissionState);

  return (
    <div className="p-3 bg-gray-50 dark:bg-navy-950 rounded-2xl border border-gray-200 dark:border-navy-800 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
          <MapPin className="w-4 h-4 text-orange-500" />
          GPS Location Verification
          {isOptional && (
            <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500 ml-1">(optional)</span>
          )}
        </div>
        <GpsStatusBadge state={permissionState} />
      </div>

      {/* Permission guide — shown when something is wrong */}
      {showGuide && (
        <LocationPermissionGuide
          state={permissionState}
          onRetry={onRetry}
        />
      )}

      {/* Main CTA button */}
      {!showGuide && (
        <button
          type="button"
          onClick={onRequest}
          disabled={isRequesting}
          className="w-full py-2.5 border border-orange-400/40 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 bg-white dark:bg-transparent text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <MapPin className={`w-3.5 h-3.5 ${isRequesting ? 'animate-bounce' : ''}`} />
          {isRequesting
            ? 'Requesting GPS access…'
            : coords
            ? 'Update GPS Position'
            : 'Allow GPS & Detect My Location'}
        </button>
      )}

      {/* Retry button when guide is shown (after fixing settings) */}
      {showGuide && permissionState === 'denied' && null /* handled inside guide */}

      {/* Success: show coordinates */}
      {coords && permissionState === 'granted' && (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl py-2">
          📍 {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          <span className="ml-2 text-emerald-500 font-bold">±{coords.accuracy}m</span>
          <button
            type="button"
            onClick={onRequest}
            className="ml-3 text-orange-500 hover:text-orange-700 underline text-[9px] cursor-pointer border-none bg-transparent"
          >
            Update
          </button>
        </div>
      )}

      {/* Info text */}
      {!showGuide && !coords && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
          Your browser will ask for permission. This is used to verify you are attending from the campus location.
        </p>
      )}
    </div>
  );
};
