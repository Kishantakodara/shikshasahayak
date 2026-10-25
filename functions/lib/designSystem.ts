// ============================================================
// SHIKSHA SAHAYAK OS - DESIGN SYSTEM REGISTRY EDGE SERVICE
// ============================================================

import {
  DesignSystemCatalogPayload,
  ComponentVariantSpec,
  ThemeVariantSpec,
  ComponentCategory,
} from "../../src/types/design-system";
import { Env } from "./contentEngine";

const MASTER_CATEGORIES: ComponentCategory[] = [
  "inputs",
  "data_display",
  "feedback",
  "navigation",
  "layout",
  "overlay",
  "charts",
];

/**
 * Hydrates full component library catalog and multi-theme configurations.
 */
export async function getDesignSystemCatalog(env: Env): Promise<DesignSystemCatalogPayload> {
  try {
    const { results: compRows } = await env.DB.prepare(
      `SELECT id, component_key, name, category, variants_json, props_json, is_accessible, created_at
       FROM design_system_components
       ORDER BY category, name`
    ).all<Record<string, unknown>>();

    const { results: themeRows } = await env.DB.prepare(
      `SELECT id, theme_key, name, colors_json, typography_json, is_default, created_at
       FROM theme_variants
       ORDER BY is_default DESC, name`
    ).all<Record<string, unknown>>();

    const components: ComponentVariantSpec[] = (compRows || []).map((row) => ({
      id: String(row.id),
      componentKey: String(row.component_key),
      name: String(row.name),
      category: String(row.category) as ComponentCategory,
      variants: JSON.parse(String(row.variants_json || "[]")),
      props: JSON.parse(String(row.props_json || "[]")),
      isAccessible: Boolean(row.is_accessible),
      createdAt: String(row.created_at),
    }));

    const themes: ThemeVariantSpec[] = (themeRows || []).map((row) => ({
      id: String(row.id),
      themeKey: String(row.theme_key),
      name: String(row.name),
      colors: JSON.parse(String(row.colors_json || "{}")),
      typography: JSON.parse(String(row.typography_json || "{}")),
      isDefault: Boolean(row.is_default),
      createdAt: String(row.created_at),
    }));

    const categoryBreakdown = MASTER_CATEGORIES.map((cat) => ({
      name: cat,
      count: components.filter((c) => c.category === cat).length,
    }));

    return {
      title: "ShikshaSahayak OS Enterprise Design System & Shared Component Library",
      version: "2026.1 Enterprise",
      totalComponents: components.length,
      totalThemes: themes.length,
      categories: categoryBreakdown,
      components,
      themes,
    };
  } catch (error) {
    console.error("Error in getDesignSystemCatalog:", error);
    return {
      title: "ShikshaSahayak OS Design System",
      version: "1.0",
      totalComponents: 0,
      totalThemes: 0,
      categories: MASTER_CATEGORIES.map((c) => ({ name: c, count: 0 })),
      components: [],
      themes: [],
    };
  }
}
