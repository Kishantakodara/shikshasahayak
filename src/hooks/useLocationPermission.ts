/**
 * useLocationPermission — Universal GPS/Geolocation Hook
 *
 * Handles all device types (phone, tablet, laptop) and all browsers
 * (Chrome, Firefox, Safari, Samsung Internet, Edge, Opera).
 *
 * Key features:
 *  - Detects if geolocation is supported
 *  - Detects if we're on HTTPS (required for geolocation)
 *  - Checks permission state before requesting
 *  - Handles iOS Safari quirks (no permissions.query support)
 *  - Graceful error categorisation with user-facing messages
 *  - High accuracy mode with sensible timeout & fallback
 */

import { useState, useCallback } from 'react';

export type LocationPermissionState =
  | 'idle'        // Not yet requested
  | 'requesting'  // Currently asking the browser
  | 'granted'     // Location obtained successfully
  | 'denied'      // User explicitly denied
  | 'unavailable' // GPS hardware/signal not available
  | 'timeout'     // Request timed out
  | 'unsupported' // Browser does not support geolocation
  | 'insecure';   // Not on HTTPS — geolocation blocked by browser

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number; // metres
}

export interface UseLocationPermissionReturn {
  /** Current permission / fetch state */
  permissionState: LocationPermissionState;
  /** Captured coordinates, null until granted */
  coords: LocationCoords | null;
  /** Human-readable error message for the current state */
  errorMessage: string | null;
  /** Whether the browser/OS supports geolocation at all */
  isSupported: boolean;
  /** True while the location is being fetched */
  isRequesting: boolean;
  /** Call this to trigger the browser location prompt */
  requestLocation: () => Promise<void>;
  /** Reset back to idle (so user can retry) */
  reset: () => void;
}

/**
 * Detect device type for giving contextual browser instructions.
 * Returns 'ios', 'android', or 'desktop'.
 */
export function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Detect the browser name for giving contextual instructions.
 */
export function detectBrowser(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'samsung' | 'opera' | 'other' {
  const ua = navigator.userAgent || '';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/OPR|Opera/i.test(ua)) return 'opera';
  if (/Edg/i.test(ua)) return 'edge';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/Chrome/i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua)) return 'safari';
  return 'other';
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('idle');
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const reset = useCallback(() => {
    setPermissionState('idle');
    setCoords(null);
    setErrorMessage(null);
  }, []);

  const requestLocation = useCallback(async () => {
    // 1. Check browser support
    if (!isSupported) {
      setPermissionState('unsupported');
      setErrorMessage('Your browser does not support GPS location. Please use a modern browser like Chrome or Firefox.');
      return;
    }

    // 2. Require HTTPS (geolocation is blocked on insecure origins in modern browsers)
    const isSecure =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '::1';

    if (!isSecure) {
      setPermissionState('insecure');
      setErrorMessage('Location access requires a secure (HTTPS) connection. Please contact the site administrator.');
      return;
    }

    // 3. Check existing permission state where the API is available
    //    NOTE: iOS Safari < 16 does NOT support navigator.permissions.query for geolocation.
    //    We wrap this in try/catch and fall through silently.
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (result.state === 'denied') {
          setPermissionState('denied');
          setErrorMessage(
            'Location access has been blocked for this site. Please follow the instructions below to re-enable it.'
          );
          return;
        }
      } catch {
        // permissions.query not supported on this browser/platform — proceed
      }
    }

    // 4. Fetch the location with progressive fallback (high accuracy -> standard accuracy)
    setPermissionState('requesting');
    setErrorMessage(null);

    const onLocationSuccess = (position: GeolocationPosition) => {
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
      });
      setPermissionState('granted');
      setErrorMessage(null);
    };

    const onLocationError = (error: GeolocationPositionError, isFallback = false) => {
      // If high accuracy timed out or was unavailable, try standard accuracy fallback once
      if (!isFallback && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
        console.warn('[useLocationPermission] High accuracy GPS failed, falling back to standard accuracy...');
        navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          (fallbackErr) => onLocationError(fallbackErr, true),
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 }
        );
        return;
      }

      switch (error.code) {
        case error.PERMISSION_DENIED:
          setPermissionState('denied');
          setErrorMessage(
            'Location access was denied. Please follow the instructions below to allow it.'
          );
          break;
        case error.POSITION_UNAVAILABLE:
          setPermissionState('unavailable');
          setErrorMessage(
            'GPS signal is not available. Try moving to an open area, enabling Wi-Fi/mobile data, and try again.'
          );
          break;
        case error.TIMEOUT:
          setPermissionState('timeout');
          setErrorMessage(
            'Location request timed out. Please check your GPS/Wi-Fi settings and try again.'
          );
          break;
        default:
          setPermissionState('unavailable');
          setErrorMessage('An unknown location error occurred. Please try again.');
      }
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      (err) => onLocationError(err, false),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15000,
      }
    );
  }, [isSupported]);

  return {
    permissionState,
    coords,
    errorMessage,
    isSupported,
    isRequesting: permissionState === 'requesting',
    requestLocation,
    reset,
  };
}
