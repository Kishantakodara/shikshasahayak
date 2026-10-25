import * as jose from 'jose';

const JWKS = jose.createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

// Cached JWKS sets for Cloudflare Access team certs
const cfJwksCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();
function getCfJWKS(certsUrl: string) {
  let jwks = cfJwksCache.get(certsUrl);
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(certsUrl));
    cfJwksCache.set(certsUrl, jwks);
  }
  return jwks;
}

export interface AuthEnvironment extends Partial<Pick<WorkerBindings, 'DB' | 'ASSESSMENT_DB' | 'PADHAKU_CORE_DB'>> {
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  CF_ACCESS_TEAM_NAME?: string;
  CF_ACCESS_AUD?: string;
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  role?: 'student' | 'teacher' | 'educator' | 'admin' | 'super_admin' | 'reviewer' | 'lead_reviewer';
  photoURL?: string;
}

export const ALLOWED_ADMIN_EMAILS = [
  'contact@shikshasahayak.org',
  'tech@shikshasahayak.org',
  'team@shikshasahayak.org',
  'mentor@shikshasahayak.org',
  'ayush.team@shikshasahayak.org',
  'support@shikshasahayak.org',
  'lead@shikshasahayak.org',
  'admin@shikshasahayak.org',
  'developer@shikshasahayak.org',
];

export function isAdmin(email?: string | null, role?: string | null): boolean {
  if (role) {
    const normalized = role.toLowerCase().trim();
    if (normalized === 'admin' || normalized === 'super_admin') {
      return true;
    }
  }
  if (!email || typeof email !== 'string') return false;
  const lower = email.toLowerCase().trim();
  if (ALLOWED_ADMIN_EMAILS.includes(lower)) return true;
  return false;
}

export function isAuthorizedAdminOrReviewer(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user) return false;
  if (user.role) {
    const r = user.role.toLowerCase().trim();
    if (r === 'admin' || r === 'super_admin' || r === 'reviewer' || r === 'lead_reviewer') {
      return true;
    }
  }
  return isAdmin(user.email, user.role);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function extractCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCfJwt(request: Request): string | null {
  return (
    request.headers.get('cf-access-jwt-assertion') ||
    request.headers.get('cf-access-token') ||
    extractCookie(request.headers.get('cookie') || request.headers.get('Cookie'), 'CF_Authorization')
  );
}

export async function requireAdminOrTeacher(
  request: Request,
  env: AuthEnvironment
): Promise<{ user: AuthenticatedUser | null; errorResponse?: Response }> {
  const authHeader = request.headers.get('Authorization');
  const cfJwt = getCfJwt(request);

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !cfJwt) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing or invalid authorization credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  const isTeacherOrAdmin =
    isAdmin(user.email, user.role) ||
    user.role === 'admin' ||
    user.role === 'super_admin' ||
    user.role === 'teacher' ||
    user.role === 'educator';

  if (!isTeacherOrAdmin) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Teacher or Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(
  request: Request,
  env: any
): Promise<{ user: AuthenticatedUser | null; errorResponse?: Response }> {
  const authHeader = request.headers.get('Authorization');
  const cfJwt = getCfJwt(request);

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !cfJwt) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing or invalid authorization credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  if (!isAdmin(user.email, user.role) && user.role !== 'admin' && user.role !== 'super_admin') {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }
  return { user };
}

export async function requireAdminOrReviewer(
  request: Request,
  env: any
): Promise<{ user: AuthenticatedUser | null; errorResponse?: Response }> {
  const authHeader = request.headers.get('Authorization');
  const cfJwt = getCfJwt(request);

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !cfJwt) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing or invalid authorization credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  if (!isAuthorizedAdminOrReviewer(user)) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin or Reviewer access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }
  return { user };
}

async function resolveRole(
  email: string | undefined,
  uid: string | undefined,
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database }
): Promise<NonNullable<AuthenticatedUser['role']>> {
  if (!email && !uid) return 'student';
  if (isAdmin(email)) return 'admin';
  
  const db = env.PADHAKU_CORE_DB || env.DB || env.ASSESSMENT_DB;
  if (db) {
    try {
      const lowerEmail = (email || '').toLowerCase().trim();

      // 1. Check teacher_whitelist first
      if (lowerEmail) {
        const whitelisted = await db.prepare(
          `SELECT email FROM teacher_whitelist WHERE LOWER(email) = ? AND status = 'approved' LIMIT 1`
        )
          .bind(lowerEmail)
          .first<{ email: string }>();
        if (whitelisted) return 'teacher';
      }

      // 2. Check teacher_profiles
      if (uid) {
        const teacher = await db.prepare(
          `SELECT user_id FROM teacher_profiles WHERE user_id = ? LIMIT 1`
        )
          .bind(uid)
          .first<{ user_id: string }>();
        if (teacher) return 'teacher';
      }

      // 3. Check unified_users
      const user = await db.prepare(
        `SELECT user_type FROM unified_users WHERE (uid = ? OR id = ? OR LOWER(email) = ?) LIMIT 1`
      )
        .bind(uid || '', uid || '', lowerEmail)
        .first<{ user_type: string }>();
      
      if (user && user.user_type) {
        const uType = String(user.user_type).toLowerCase().trim();
        if (uType === 'admin' || uType === 'super_admin') return 'admin';
        if (uType === 'teacher' || uType === 'educator') return 'teacher';
        if (uType === 'reviewer' || uType === 'lead_reviewer') return 'reviewer';
        if (uType === 'student') return 'student';
      }
    } catch (err) {
      // Fallback
    }
  }

  return 'student';
}

export async function getAuthenticatedUser(
  request: Request,
  env: { 
    FIREBASE_PROJECT_ID?: string; 
    VITE_FIREBASE_PROJECT_ID?: string;
    PADHAKU_CORE_DB?: D1Database;
    ASSESSMENT_DB?: D1Database;
    DB?: D1Database;
    CF_ACCESS_TEAM_NAME?: string;
    CF_ACCESS_AUD?: string;
  }
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  const cfJwt = getCfJwt(request);

  // Path A: Standard Firebase Authorization Bearer Header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (!token) return null;

    const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || 'padhakuportal';
    if (!projectId) return null;

    try {
      const url = new URL(request.url);
      const isDevOrTest =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '::1' ||
        (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV !== 'production');

      if (token.startsWith('mock-token-')) {
        if (!isDevOrTest) return null;
        const parts = token.substring('mock-token-'.length).split('-');
        const roleRaw = parts[0]?.toLowerCase();
        const role = (roleRaw === 'admin' || roleRaw === 'teacher' || roleRaw === 'reviewer') ? roleRaw : 'student';
        const uid = parts.slice(1).join('-') || 'mock-uid';
        const email = role === 'admin' ? 'developer@shikshasahayak.org' : `${uid}@example.com`;
        return {
          uid,
          email,
          name: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          photoURL: undefined,
          role: (role as any),
        };
      }
    } catch {
      if (token.startsWith('mock-token-')) return null;
    }

    try {
      const decoded = jose.decodeJwt(token);
      const tokenIss = typeof decoded.iss === 'string' ? decoded.iss : '';
      const tokenAud = typeof decoded.aud === 'string' ? decoded.aud : Array.isArray(decoded.aud) ? decoded.aud[0] : '';

      // Determine expected project ID
      const expectedProjectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;

      // Verify issuer format strictly matches Google Firebase Secure Token specification
      const isGoogleIssuer = tokenIss.startsWith('https://securetoken.google.com/');
      if (!isGoogleIssuer) {
        console.warn('[auth] Bearer token rejected: issuer does not match Google securetoken authority');
        return null;
      }

      const issuerProjectId = tokenIss.replace('https://securetoken.google.com/', '').trim();
      if (!issuerProjectId || (expectedProjectId && issuerProjectId !== expectedProjectId && tokenAud !== expectedProjectId)) {
        console.warn(`[auth] Bearer token project mismatch: issuer=${issuerProjectId}, aud=${tokenAud}, expected=${expectedProjectId}`);
        return null;
      }

      const verifyAudience = expectedProjectId || tokenAud || issuerProjectId;
      const verifyIssuer = `https://securetoken.google.com/${issuerProjectId}`;

      const { payload } = await jose.jwtVerify(token, JWKS, {
        algorithms: ['RS256'],
        issuer: verifyIssuer,
        audience: verifyAudience,
        requiredClaims: ['sub', 'exp', 'iat'],
        clockTolerance: 120,
      });

      const now = Math.floor(Date.now() / 1000);
      if (
        !payload.sub ||
        payload.sub.length > 128 ||
        typeof payload.iat !== 'number' ||
        payload.iat > now + 300
      ) {
        console.warn('[auth] Bearer token claims validation failed: invalid sub or future iat');
        return null;
      }

      if (typeof payload.auth_time === 'number' && payload.auth_time > now + 300) {
        console.warn('[auth] Bearer token claims validation failed: future auth_time');
        return null;
      }

      const rawEmail = typeof payload.email === 'string' ? payload.email.trim() : undefined;
      const emailLower = rawEmail?.toLowerCase();
      const isEmailVerified = payload.email_verified === true || (payload as any).firebase?.sign_in_provider === 'google.com';
      const isAllowlistedAdmin = emailLower ? isAdmin(emailLower) : false;

      // Allow email privileges if verified, Google-authenticated, or matching canonical admin allowlist
      const email = (isEmailVerified || isAllowlistedAdmin) ? rawEmail : undefined;

      return {
        uid: payload.sub,
        email,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        photoURL: typeof payload.picture === 'string' ? payload.picture : undefined,
        role: await resolveRole(email, payload.sub, env),
      };
    } catch (err: any) {
      console.warn('[auth] Firebase JWT cryptographic verification failed:', err?.message || err);
      return null;
    }
  }

  // Path B: Cloudflare Access Identity Header (CF-Access-Jwt-Assertion)
  if (cfJwt) {
    try {
      const decoded = jose.decodeJwt(cfJwt);
      const teamName = env.CF_ACCESS_TEAM_NAME || 'padhakuportal';
      const expectedIss = `https://${teamName}.cloudflareaccess.com`;
      const iss = typeof decoded.iss === 'string' ? decoded.iss.replace(/\/$/, '') : '';

      // Cryptographically verify issuer matches configured Access team or padhaku domain
      const isTrustedTeam = iss === expectedIss || (iss.endsWith('.cloudflareaccess.com') && (iss.includes('padhaku') || !env.CF_ACCESS_TEAM_NAME));
      if (iss && isTrustedTeam) {
        const certsUrl = `${iss}/cdn-cgi/access/certs`;
        const jwks = getCfJWKS(certsUrl);
        const verifyOptions: jose.JWTVerifyOptions = {
          issuer: iss,
          clockTolerance: 60,
          requiredClaims: ['sub', 'exp', 'iat'],
        };
        if (env.CF_ACCESS_AUD) {
          verifyOptions.audience = env.CF_ACCESS_AUD;
        }

        const { payload } = await jose.jwtVerify(cfJwt, jwks, verifyOptions);
        const cfEmail = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : undefined;
        const sub = typeof payload.sub === 'string' ? payload.sub : 'cf-access-user';
        if (cfEmail) {
          return {
            uid: sub,
            email: cfEmail,
            name: typeof payload.name === 'string' ? payload.name : cfEmail.split('@')[0],
            photoURL: undefined,
            role: await resolveRole(cfEmail, sub, env),
          };
        }
      }
    } catch (cfErr) {
      console.warn('Cloudflare Access JWT cryptographic verification failed:', cfErr);
    }
  }

  return null;
}

/**
 * Resolves user beta access entitlement and active feature flags.
 */
export interface BetaEntitlement {
  isBetaTester: boolean;
  betaFeaturesEnabled: boolean;
  flags: Record<string, boolean>;
}

export async function getUserBetaEntitlement(
  user: AuthenticatedUser | null,
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database }
): Promise<BetaEntitlement> {
  const defaultFlags: Record<string, boolean> = {
    betaFeaturesEnabled: true,
    aiCopilot: true,
    personalizedLearning: true,
    resumeBuilder: true,
    newAssessmentFeatures: true,
    examPrediction: false,
    spacedRepetition: false,
    aiCareerMentor: false,
    codingPlatform: false,
    marketplace: false,
    vectorSearch: false,
  };

  let betaFeaturesEnabled = true;
  const activeFlags: Record<string, boolean> = { ...defaultFlags };

  const db = env.PADHAKU_CORE_DB || env.DB || env.ASSESSMENT_DB;
  if (db) {
    try {
      const dbFlags = await db.prepare(`SELECT flag_key, is_enabled FROM feature_flags`).all();
      if (dbFlags && dbFlags.results) {
        for (const row of dbFlags.results as any[]) {
          if (row.flag_key === 'betaFeaturesEnabled') {
            betaFeaturesEnabled = row.is_enabled === 1;
          }
          activeFlags[row.flag_key] = row.is_enabled === 1;
        }
      }
    } catch (err) {
      console.warn('Feature flags table query fallback:', err);
    }
  }

  const disableAllFlags = (flags: Record<string, boolean>): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    for (const key of Object.keys(flags)) {
      result[key] = false;
    }
    result.betaFeaturesEnabled = false;
    return result;
  };

  if (!user) {
    return {
      isBetaTester: false,
      betaFeaturesEnabled,
      flags: betaFeaturesEnabled ? activeFlags : disableAllFlags(activeFlags),
    };
  }

  // Admin user automatically gets beta tester status
  if (user.role === 'admin' || isAdmin(user.email)) {
    return {
      isBetaTester: true,
      betaFeaturesEnabled,
      flags: betaFeaturesEnabled ? activeFlags : disableAllFlags(activeFlags),
    };
  }

  let isBetaTester = false;
  let customOverrides: Record<string, boolean> = {};

  if (env.DB) {
    try {
      const betaRec = await env.DB.prepare(
        `SELECT is_beta_tester, custom_flags_json FROM user_beta_access WHERE user_id = ? OR user_id = ? OR LOWER(user_id) = ? LIMIT 1`
      )
        .bind(user.uid, user.email || '', (user.email || '').toLowerCase())
        .first();

      if (betaRec) {
        isBetaTester = (betaRec as any).is_beta_tester === 1;
        if ((betaRec as any).custom_flags_json) {
          try {
            customOverrides = JSON.parse((betaRec as any).custom_flags_json);
          } catch {}
        }
      } else {
        const uRec = await env.DB.prepare(
          `SELECT ai_beta_enabled FROM unified_users WHERE uid = ? OR LOWER(email) = ? LIMIT 1`
        )
          .bind(user.uid, (user.email || '').toLowerCase())
          .first();

        if (uRec && (uRec as any).ai_beta_enabled === 1) {
          isBetaTester = true;
        }
      }
    } catch (err) {
      console.error('Error fetching user beta entitlement:', err);
    }
  }

  const finalFlags = { ...activeFlags, ...customOverrides };

  return {
    isBetaTester,
    betaFeaturesEnabled,
    flags: (betaFeaturesEnabled && isBetaTester) ? finalFlags : disableAllFlags(finalFlags),
  };
}

/**
 * Verifies if the authenticated user has AI Beta feature access.
 */
export async function checkAIBetaAccess(
  user: AuthenticatedUser | null,
  env: { DB?: any }
): Promise<boolean> {
  if (!user) return false;
  const entitlement = await getUserBetaEntitlement(user, env);
  return entitlement.betaFeaturesEnabled && entitlement.isBetaTester;
}

/**
 * Enforces API authorization for 2.0 Beta endpoints.
 */
export async function verifyBetaAccess(
  user: AuthenticatedUser | null,
  env: { DB?: D1Database },
  featureKey?: string
): Promise<{ allowed: boolean; reason?: string; response?: Response }> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (!user) {
    return {
      allowed: false,
      reason: 'Unauthorized: Authentication required',
      response: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  const entitlement = await getUserBetaEntitlement(user, env);

  if (!entitlement.betaFeaturesEnabled) {
    return {
      allowed: false,
      reason: 'Forbidden: Global beta features disabled',
      response: new Response(
        JSON.stringify({ success: false, error: 'Forbidden: 2.0 Beta features are currently offline site-wide.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  if (!entitlement.isBetaTester) {
    return {
      allowed: false,
      reason: 'Forbidden: Beta access entitlement required',
      response: new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Beta Tester access required. Please request access from an Administrator.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  if (featureKey && entitlement.flags[featureKey] === false) {
    return {
      allowed: false,
      reason: `Forbidden: Feature flag '${featureKey}' is disabled`,
      response: new Response(
        JSON.stringify({ success: false, error: `Forbidden: Feature '${featureKey}' is currently disabled for your account.` }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      ),
    };
  }

  return { allowed: true };
}


