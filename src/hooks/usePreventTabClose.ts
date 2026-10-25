import { useEffect } from 'react';

/**
 * Hook to prevent the user from closing the tab or reloading the page during active operations (e.g. uploading).
 * @param shouldPrevent Whether the prevent block should be active.
 */
export function usePreventTabClose(shouldPrevent: boolean) {
  useEffect(() => {
    if (!shouldPrevent) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore this custom string and show a default warning,
      // but setting and returning it is required for compatibility.
      const message = 'Upload in progress. If you leave or close this page, the upload will be cancelled. Are you sure you want to leave?';
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldPrevent]);
}
