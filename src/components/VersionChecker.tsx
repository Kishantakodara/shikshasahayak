import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  const __APP_VERSION__: string;
}

// Build-time version defined via Vite `define`
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const VersionChecker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Only check in production/preview mode
    if (import.meta.env.DEV) return;

    const checkVersion = async () => {
      try {
        const response = await fetch(`/assets-manifest.json?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (response.ok) {
          const manifest = await response.json();
          if (manifest && manifest.version && manifest.version !== APP_VERSION) {
            console.warn(`[VersionChecker] Client version (${APP_VERSION}) is stale. New version (${manifest.version}) detected on server. Reloading to update...`);
            
            // Reload the page to load the new deployment on the target route
            window.location.reload();
          }
        }
      } catch (err) {
        console.error('[VersionChecker] Failed to fetch assets-manifest.json:', err);
      }
    };

    checkVersion();
  }, [location.pathname]); // Run on every route transition

  return null;
};

export default VersionChecker;
