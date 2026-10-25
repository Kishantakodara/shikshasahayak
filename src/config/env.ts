// ============================================================
// SHIKSHA SAHAYAK OS - ENVIRONMENT CONFIGURATION & VALIDATION
// ============================================================

export interface EnvironmentConfig {
  appEnv: 'development' | 'staging' | 'production';
  appName: string;
  appUrl: string;
  isDev: boolean;
  isProd: boolean;
  enableAgentation: boolean;
  enableAnalytics: boolean;
  apiBaseUrl: string;
  VITE_API_URL?: string;
}

/**
 * Validates and retrieves current runtime environment configuration.
 * Disables Agentation strictly in production per AGENTS.md rules.
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isDev = import.meta.env.DEV || false;
  const appEnv = isDev ? 'development' : 'production';
  const isProd = !isDev;

  return {
    appEnv,
    appName: 'ShikshaSahayak OS',
    appUrl: import.meta.env.VITE_APP_URL || 'https://padhakuportal.com',
    isDev,
    isProd,
    // NEVER enable Agentation in production per AGENTS.md
    enableAgentation: isDev && import.meta.env.VITE_ENABLE_AGENTATION === 'true',
    enableAnalytics: isProd,
    apiBaseUrl: import.meta.env.VITE_API_URL || '/api',
    VITE_API_URL: import.meta.env.VITE_API_URL || '/api',
  };
}

export const envConfig = getEnvironmentConfig();
export const env = envConfig;
