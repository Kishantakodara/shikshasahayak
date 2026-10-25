// ============================================================
// SHIKSHA SAHAYAK OS - DESIGN SYSTEM & COMPONENT LIBRARY TYPES
// ============================================================

/** 7 Master Component Categories */
export type ComponentCategory =
  | 'inputs'
  | 'data_display'
  | 'feedback'
  | 'navigation'
  | 'layout'
  | 'overlay'
  | 'charts';

/** Component Specification Payload */
export interface ComponentVariantSpec {
  id: string;
  componentKey: string;
  name: string;
  category: ComponentCategory;
  variants: string[];
  props: string[];
  isAccessible: boolean;
  createdAt: string;
}

/** Theme Variant Configuration Payload */
export interface ThemeVariantSpec {
  id: string;
  themeKey: string;
  name: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
}

/** Motion & Animation Token Payload */
export interface MotionTokenSpec {
  id: string;
  tokenName: string;
  durationMs: number;
  easing: string;
  createdAt: string;
}

/** Design System Catalog Overview Payload */
export interface DesignSystemCatalogPayload {
  title: string;
  version: string;
  totalComponents: number;
  totalThemes: number;
  categories: Array<{ name: ComponentCategory; count: number }>;
  components: ComponentVariantSpec[];
  themes: ThemeVariantSpec[];
}
