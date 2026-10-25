// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND DESIGN SYSTEM API CLIENT
// ============================================================

import {
  DesignSystemCatalogPayload,
  ThemeVariantSpec,
} from "../types/design-system";

/**
 * Fetches component library catalog and category breakdown.
 */
export async function fetchDesignSystemCatalog(): Promise<DesignSystemCatalogPayload | null> {
  try {
    const res = await fetch("/api/design-system/catalog");
    if (!res.ok) {
      throw new Error(`Failed to fetch design system catalog (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in DesignSystemClient.fetchDesignSystemCatalog:", error);
    return null;
  }
}

/**
 * Fetches active theme configurations (ShikshaSahayak Deep Navy & Orange, Dark Mode, White-label).
 */
export async function fetchThemeVariantsCatalog(): Promise<ThemeVariantSpec[]> {
  try {
    const res = await fetch("/api/design-system/themes");
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in DesignSystemClient.fetchThemeVariantsCatalog:", error);
    return [];
  }
}
