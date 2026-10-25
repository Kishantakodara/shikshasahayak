export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  let response = await context.next();
  
  // If the path is not API, not assets, doesn't contain a dot (so it's a page route),
  // and it returned a 404, we rewrite it to serve index.html (the SPA entry point).
  if (
    response.status === 404 &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/assets/') &&
    !url.pathname.includes('.')
  ) {
    const indexRequest = new Request(new URL('/index.html', url.origin));
    response = await context.env.ASSETS.fetch(indexRequest);
  }
  
  // Detect if a missing asset was rewritten to index.html (returns 200 text/html)
  if (url.pathname.startsWith('/assets/')) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || response.status === 404 || response.status >= 400) {
      console.warn(`[Middleware] Asset not found: ${url.pathname}. Returning 404.`);
      return new Response('Asset Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  }

  // Clone the response so we can modify its headers
  const newResponse = new Response(response.body, response);
  
  // Apply standard security headers
  newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Skip modifying headers for api requests
  if (url.pathname.startsWith('/api/')) {
    return newResponse;
  }
  
  // Handle caching rules based on path / file type
  if (url.pathname.startsWith('/assets/')) {
    // Immutable assets (fingerprinted js/css/images in bundle)
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    // Static media assets
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    // HTML index page, 200 SPA fallback page, and any clean SPA routes (e.g. /about, /blogs)
    // Never cache HTML aggressively in the browser or at Cloudflare edge CDN
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    newResponse.headers.set('Pragma', 'no-cache');
    newResponse.headers.set('Expires', '0');
    newResponse.headers.set('CDN-Cache-Control', 'no-cache, no-store, must-revalidate');
    newResponse.headers.set('Cloudflare-CDN-Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  return newResponse;
};
