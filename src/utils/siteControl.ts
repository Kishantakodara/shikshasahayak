/**
 * Admin Website Content & Feature Control Utility
 * Manages admin preferences for showing/hiding sections and materials site-wide.
 */

export interface SiteControlState {
  showSyllabus: boolean;
  showPyqs: boolean;
  showNotes: boolean;
  showStudyNotes?: boolean;
  showGtuSyllabusBanner: boolean;
  showAiTutor: boolean;
  showGateHub: boolean;
  showAnnouncements: boolean;
}

const STORAGE_KEY = 'padhaku_admin_site_control';

const DEFAULT_CONTROL_STATE: SiteControlState = {
  showSyllabus: true,
  showPyqs: true,
  showNotes: true,
  showStudyNotes: true,
  showGtuSyllabusBanner: true,
  showAiTutor: true,
  showGateHub: true,
  showAnnouncements: true,
};

export function getSiteControlState(): SiteControlState {
  if (typeof window === 'undefined') return DEFAULT_CONTROL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONTROL_STATE;
    return { ...DEFAULT_CONTROL_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONTROL_STATE;
  }
}

export function saveSiteControlState(state: Partial<SiteControlState>): SiteControlState {
  const current = getSiteControlState();
  const updated = { ...current, ...state };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event for real-time reactive UI updates
    window.dispatchEvent(new Event('site-control-updated'));
  }
  return updated;
}

export function toggleSiteFeature(featureKey: keyof SiteControlState): SiteControlState {
  const current = getSiteControlState();
  return saveSiteControlState({ [featureKey]: !current[featureKey] });
}
