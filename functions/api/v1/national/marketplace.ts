/**
 * SHIKSHA SAHAYAK OS — PRODUCTION CREATOR MARKETPLACE API
 * Endpoint: /api/v1/national/marketplace
 */

import { fetchMarketplaceProducts } from '../../../../functions/lib/nationalScaleEcosystem';
import { onboardFacultySeller, calculateRevenueShare } from '../../../../functions/lib/creatorMarketplaceService';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'marketplace');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }
  try {
    const url = new URL(context.request.url);
    const mode = url.searchParams.get('mode') || 'catalog';
    const category = url.searchParams.get('category') || undefined;

    if (mode === 'revenue') {
      const gross = parseFloat(url.searchParams.get('gross') || '15000');
      const revenue = calculateRevenueShare(gross);
      return new Response(JSON.stringify({ success: true, revenue }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const products = fetchMarketplaceProducts(category);
    return new Response(JSON.stringify({ success: true, products }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'marketplace');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }
  try {
    const body = await context.request.json() as any;
    const action = body.action || 'onboard_seller';

    if (action === 'onboard_seller') {
      const seller = onboardFacultySeller(
        body.creatorName || 'Prof. A. Shah',
        body.email || 'prof.shah@gtu.ac.in',
        body.collegeName || 'L.D. College of Engineering',
        body.payoutUpiId || 'profshah@okicici'
      );

      return new Response(JSON.stringify({ success: true, seller }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid marketplace action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
