/**
 * Cloudflare Pages Function: Reverse Proxy for Firebase Auth
 * 
 * Proxies Firebase Auth static assets and handlers from:
 * https://<site>/__/auth/* -> https://shikshasahayak-demo.firebaseapp.com/__/auth/*
 * 
 * This enables same-origin Firebase authentication (authDomain = window.location.host)
 * on custom domains like beta.shikshasahayak.org & shikshasahayak.org, bypassing
 * 3rd-party cookie & storage partitioning blocks in modern browsers.
 */

export async function onRequest(context: {
  request: Request;
  params: { path?: string[] };
}) {
  const { request, params } = context;
  const url = new URL(request.url);

  // Construct target URL to Firebase App auth handler
  const pathSegments = params.path && Array.isArray(params.path) ? params.path.join('/') : '';
  const targetUrl = new URL(`/__/auth/${pathSegments}${url.search}`, 'https://shikshasahayak-demo.firebaseapp.com');

  const headers = new Headers(request.headers);
  headers.set('Host', 'shikshasahayak-demo.firebaseapp.com');

  try {
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Proxied-By', 'ShikshaSahayak-CF-Auth-Proxy');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown proxy error';
    return new Response(JSON.stringify({ error: 'Firebase Auth Proxy Error', message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
