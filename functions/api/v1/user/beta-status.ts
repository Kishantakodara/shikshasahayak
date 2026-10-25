import { getAuthenticatedUser, getUserBetaEntitlement } from '../../../lib/auth';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: { request: Request; env: any }) {
  const { request, env } = context;

  try {
    const user = await getAuthenticatedUser(request, env);
    const entitlement = await getUserBetaEntitlement(user, env);

    return new Response(
      JSON.stringify({
        success: true,
        user: user ? { uid: user.uid, email: user.email, role: user.role } : null,
        ...entitlement
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Failed to fetch beta status",
        isBetaTester: false,
        betaFeaturesEnabled: false,
        flags: {}
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
