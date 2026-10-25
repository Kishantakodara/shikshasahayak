// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND DESIGN PATTERNS & UI STANDARDS TYPES
// ============================================================

/** 5 Component Hierarchy Levels */
export type ComponentLevel =
  | 'atomic'
  | 'composite'
  | 'feature'
  | 'layout'
  | 'page'
  | 'widget';

/** UI Design Pattern Categories */
export type PatternCategory =
  | 'forms'
  | 'fetching'
  | 'loading'
  | 'empty'
  | 'errors'
  | 'dialogs'
  | 'tables'
  | 'navigation'
  | 'accessibility';

/** Single UI Design Pattern Specification */
export interface UiPatternSpec {
  id: string;
  patternCode: string;
  name: string;
  level: ComponentLevel;
  category: PatternCategory;
  description: string;
  isAccessible: boolean;
  createdAt: string;
}

/** Design System Token Specification */
export interface DesignTokenSpec {
  id: string;
  tokenCategory: 'colors' | 'typography' | 'spacing' | 'radius' | 'shadows' | 'transitions';
  tokenName: string;
  tokenValue: string;
  cssVariable: string;
  createdAt: string;
}

/** Accessibility Compliance Log Record */
export interface AccessibilityLogSpec {
  id: string;
  componentName: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  status: 'compliant' | 'warning' | 'non_compliant';
  createdAt: string;
}

/** Frontend Patterns System Overview Payload */
export interface FrontendPatternsOverview {
  title: string;
  version: string;
  totalLevels: number;
  totalPatterns: number;
  totalDesignTokens: number;
  levels: Array<{ level: ComponentLevel; description: string }>;
  patterns: UiPatternSpec[];
  tokens: DesignTokenSpec[];
}
