// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND PATTERNS EDGE SERVICE
// ============================================================

import {
  FrontendPatternsOverview,
  UiPatternSpec,
  DesignTokenSpec,
  ComponentLevel,
  PatternCategory,
} from "../../src/types/frontend-patterns";
import { Env } from "./contentEngine";

const MASTER_LEVELS: Array<{ level: ComponentLevel; description: string }> = [
  { level: "atomic", description: "Buttons, Badges, Inputs, Switches, Skeletons (src/components/ui/)" },
  { level: "composite", description: "FormGroups, SearchBars, FilterChips, ModalDialogs (src/components/shared/)" },
  { level: "feature", description: "ResourceCards, PYQTable, ContentGovernanceFlow (src/features/)" },
  { level: "layout", description: "Header, Sidebar, Footer, PageContainer (src/components/layout/)" },
  { level: "page", description: "Home, StudyMaterialView, SubjectPage, AdminDashboard (src/pages/)" },
];

/**
 * Hydrates full UI pattern catalog, design tokens, and component levels breakdown.
 */
export async function getUiPatternsOverview(env: Env): Promise<FrontendPatternsOverview> {
  try {
    const { results: patternRows } = await env.DB.prepare(
      `SELECT id, pattern_code, name, level, category, description, is_accessible, created_at
       FROM ui_pattern_registry
       ORDER BY level, name`
    ).all<Record<string, unknown>>();

    const { results: tokenRows } = await env.DB.prepare(
      `SELECT id, token_category, token_name, token_value, css_variable, created_at
       FROM design_tokens
       ORDER BY token_category, token_name`
    ).all<Record<string, unknown>>();

    const patterns: UiPatternSpec[] = (patternRows || []).map((row) => ({
      id: String(row.id),
      patternCode: String(row.pattern_code),
      name: String(row.name),
      level: String(row.level) as ComponentLevel,
      category: String(row.category) as PatternCategory,
      description: String(row.description),
      isAccessible: Boolean(row.is_accessible),
      createdAt: String(row.created_at),
    }));

    const tokens: DesignTokenSpec[] = (tokenRows || []).map((row) => ({
      id: String(row.id),
      tokenCategory: String(row.token_category) as any,
      tokenName: String(row.token_name),
      tokenValue: String(row.token_value),
      cssVariable: String(row.css_variable),
      createdAt: String(row.created_at),
    }));

    return {
      title: "ShikshaSahayak OS Frontend Design Patterns & UI Engineering Standards",
      version: "2026.1 Enterprise",
      totalLevels: MASTER_LEVELS.length,
      totalPatterns: patterns.length,
      totalDesignTokens: tokens.length,
      levels: MASTER_LEVELS,
      patterns,
      tokens,
    };
  } catch (error) {
    console.error("Error in getUiPatternsOverview:", error);
    return {
      title: "ShikshaSahayak OS UI Standards",
      version: "1.0",
      totalLevels: MASTER_LEVELS.length,
      totalPatterns: 0,
      totalDesignTokens: 0,
      levels: MASTER_LEVELS,
      patterns: [],
      tokens: [],
    };
  }
}
