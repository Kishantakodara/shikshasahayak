import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

async function runPostBuild() {
  console.log('🔄 Running post-build steps...');
  const indexPath = path.join(distDir, 'index.html');
  const fallbackPath = path.join(distDir, '200.html');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ Error: dist/index.html does not exist!');
    process.exit(1);
  }

  // Ensure all script tags have data-cfasync="false" to prevent Cloudflare Rocket Loader from breaking ES Modules
  let indexHtml = fs.readFileSync(indexPath, 'utf-8');
  indexHtml = indexHtml.replaceAll('<script', '<script data-cfasync="false"');
  indexHtml = indexHtml.replaceAll('<script data-cfasync="false" data-cfasync="false"', '<script data-cfasync="false"');
  fs.writeFileSync(indexPath, indexHtml);

  // Copy compiled index.html to 200.html to guarantee SPA fallback contains compiled assets
  fs.copyFileSync(indexPath, fallbackPath);
  console.log('✅ Copied dist/index.html -> dist/200.html (with data-cfasync="false" protection) for Cloudflare Pages SPA fallback.');

  // Copy public/_headers into dist/_headers to ensure Cloudflare Edge CDN cache control rules apply online
  const headersPath = path.resolve(__dirname, '../public/_headers');
  const distHeadersPath = path.join(distDir, '_headers');
  if (fs.existsSync(headersPath)) {
    fs.copyFileSync(headersPath, distHeadersPath);
    console.log('✅ Copied public/_headers -> dist/_headers for Cloudflare Edge CDN caching.');
  }

  // Copy public/_redirects into dist/_redirects for SPA routing
  const redirectsPath = path.resolve(__dirname, '../public/_redirects');
  const distRedirectsPath = path.join(distDir, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    fs.copyFileSync(redirectsPath, distRedirectsPath);
    console.log('✅ Copied public/_redirects -> dist/_redirects for Cloudflare Pages SPA rewrite.');
  } else {
    fs.writeFileSync(distRedirectsPath, '/* /index.html 200\n');
    console.log('✅ Created dist/_redirects with default SPA rewrite rule.');
  }

  // Generate assets-manifest.json with matching build version
  let buildId = Date.now().toString();
  const buildIdFile = path.resolve(__dirname, '../.build-id');
  if (fs.existsSync(buildIdFile)) {
    try {
      buildId = fs.readFileSync(buildIdFile, 'utf-8').trim();
      fs.unlinkSync(buildIdFile);
      console.log(`✅ Loaded build ID from temp file: ${buildId} (cleaned up temp file)`);
    } catch (err) {
      console.error('⚠️ Failed reading or deleting temp .build-id file:', err);
    }
  } else {
    console.warn('⚠️ Temp .build-id file not found. Generated new fallback build ID.');
  }

  const manifest = {
    version: buildId,
    builtAt: new Date().toISOString()
  };

  const manifestPath = path.join(distDir, 'assets-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Generated dist/assets-manifest.json with version ${buildId}`);
}

runPostBuild();
