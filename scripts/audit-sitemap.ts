import fs from 'fs';

const appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["']/g;
const declaredRoutes = new Set<string>();
let match;
while ((match = routeRegex.exec(appTsx)) !== null) {
  declaredRoutes.add(match[1]);
}

function routeToPattern(route: string): RegExp {
  if (route === '*') return /.*/;
  let pattern = route
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:[a-zA-Z0-9_]+/g, '/[^/]+')
    .replace(/\/\*/g, '(/.*)?');
  return new RegExp(`^${pattern}$`);
}

const routeMatchers = Array.from(declaredRoutes)
  .filter(r => r !== '*')
  .map(r => ({
    route: r,
    regex: routeToPattern(r)
  }));

const sitemap = fs.readFileSync('public/sitemap.xml', 'utf-8');
const locRegex = /<loc>https:\/\/(?:SHIKSHASAHAYAK\.in|shikshasahayak\.org)(\/[^<]*)<\/loc>/g;
let locMatch;
const sitemapUrls: string[] = [];
while ((locMatch = locRegex.exec(sitemap)) !== null) {
  sitemapUrls.push(locMatch[1]);
}

console.log(`Total sitemap URLs to verify: ${sitemapUrls.length}`);
const brokenSitemapUrls: string[] = [];
for (const url of sitemapUrls) {
  let matched = false;
  for (const m of routeMatchers) {
    if (m.regex.test(url)) {
      matched = true;
      break;
    }
  }
  if (!matched) {
    brokenSitemapUrls.push(url);
  }
}

console.log(`Broken sitemap URLs: ${brokenSitemapUrls.length}`);
if (brokenSitemapUrls.length > 0) {
  console.log('Sample broken sitemap URLs (up to 20):', brokenSitemapUrls.slice(0, 20));
}
