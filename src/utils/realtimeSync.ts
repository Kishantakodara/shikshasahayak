// ============================================================
// Real-Time Cross-Role Event Sync Manager
// Enables live synchronization between Teacher & Student Portals
// ============================================================

export const SYNC_EVENTS = {
  ATTENDANCE_LAUNCH: 'padhaku_attendance_launch',
  ATTENDANCE_END: 'padhaku_attendance_end',
  ATTENDANCE_SUBMIT: 'padhaku_attendance_submit',
  ANNOUNCEMENT_CREATE: 'padhaku_announcement_create',
  ASSIGNMENT_CREATE: 'padhaku_assignment_create',
};

// Dispatch a real-time event (both same window and cross-tab localStorage)
export function dispatchSyncEvent(eventType: string, payload: any) {
  // 1. Same-window CustomEvent
  const event = new CustomEvent(eventType, { detail: payload });
  window.dispatchEvent(event);

  // 2. Cross-tab localStorage trigger
  const syncKey = `padhaku_sync_${eventType}_${Date.now()}`;
  localStorage.setItem(syncKey, JSON.stringify(payload));
  // Clean up after 2 seconds to avoid clutter
  setTimeout(() => {
    try {
      localStorage.removeItem(syncKey);
    } catch {
      // ignore
    }
  }, 2000);
}

// Subscribe to a real-time sync event
export function subscribeToSyncEvent(eventType: string, callback: (payload: any) => void) {
  // 1. Same-window listener
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent;
    callback(customEvent.detail);
  };
  window.addEventListener(eventType, handleCustomEvent);

  // 2. Cross-tab localStorage listener
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key && e.key.startsWith(`padhaku_sync_${eventType}`) && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        callback(data);
      } catch (err) {
        console.error('Error parsing sync storage event:', err);
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // Return unsubscribe function
  return () => {
    window.removeEventListener(eventType, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

// Get active attendance session for student dashboard
export function getActiveAttendanceSessionForStudent(): any | null {
  try {
    const sessionStr = localStorage.getItem('padhaku_active_attendance_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.is_active) {
        if (!session.expires_at || new Date(session.expires_at) > new Date()) {
          return session;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
