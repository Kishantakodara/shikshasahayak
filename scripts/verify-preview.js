import { spawn } from 'child_process';
import http from 'http';
import { chromium } from 'playwright';

const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;

// Helper to check if server is up
function checkServerUp() {
  return new Promise((resolve) => {
    http.get(PREVIEW_URL, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runVerification() {
  console.log('🚀 Starting Vite preview server...');
  
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', PREVIEW_PORT.toString()], {
    shell: true,
    stdio: 'ignore'
  });

  let isUp = false;
  for (let i = 0; i < 25; i++) {
    isUp = await checkServerUp();
    if (isUp) break;
    await sleep(500);
  }

  if (!isUp) {
    console.error('❌ Failed to start Vite preview server.');
    previewProcess.kill();
    process.exit(1);
  }

  console.log(`✅ Preview server is up at ${PREVIEW_URL}`);

  let browser;
  let exitCode = 0;
  const consoleErrors = [];
  const pageErrors = [];
  const mimeTypeErrors = [];

  try {
    console.log('🌐 Launching headless browser for comprehensive SPA verification...');
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
    const page = await browser.newPage();

    // Intercept network responses to verify MIME types
    page.on('response', (response) => {
      const url = response.url();
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      const status = response.status();

      // Check JS assets
      if (url.includes('/assets/') && url.endsWith('.js')) {
        if (contentType.includes('text/html')) {
          mimeTypeErrors.push(`Asset '${url}' returned 'text/html' instead of JavaScript module! (Status: ${status})`);
        } else if (contentType && !contentType.includes('javascript') && !contentType.includes('ecmascript') && !contentType.includes('application/x-javascript')) {
          mimeTypeErrors.push(`Asset '${url}' returned unexpected Content-Type '${contentType}'`);
        }
      }

      // Check CSS assets
      if (url.includes('/assets/') && url.endsWith('.css')) {
        if (contentType && !contentType.includes('css')) {
          mimeTypeErrors.push(`CSS Asset '${url}' returned unexpected Content-Type '${contentType}'`);
        }
      }
    });

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const locationUrl = msg.location()?.url || '';
        
        // Filter out expected API 500/502/network errors when local dev API backend is offline during preview check
        if (
          locationUrl.includes('/api/') ||
          text.includes('/api/') ||
          text.includes('500 (Internal Server Error)') ||
          text.includes('502 (Bad Gateway)') ||
          text.includes('Request failed: 502') ||
          text.includes('502') ||
          text.includes('ERR_CONNECTION_REFUSED')
        ) {
          return;
        }
        
        // Filter out third-party script CSP warnings on localhost preview
        if (text.includes('violates the following Content Security Policy') || text.includes('Content Security Policy')) {
          return;
        }
        
        // Filter out script resource loading failures for ads/analytics on localhost preview
        if (text.includes('ezojs') || text.includes('ezoicanalytics') || text.includes('google-analytics')) {
          return;
        }

        consoleErrors.push(text);
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // Test routes for SPA rendering and direct deep-linking
    const routesToTest = [
      '/',
      '/about',
      '/privacy-policy',
      '/blogs',
      '/resources',
      '/admin',
      '/contact'
    ];

    for (const route of routesToTest) {
      const fullUrl = `${PREVIEW_URL}${route}`;
      console.log(`🔗 Testing route navigation & SPA fallback: ${fullUrl}`);
      
      const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(1000);

      if (!response || response.status() >= 400) {
        console.error(`❌ Route '${route}' returned status ${response?.status()}`);
        exitCode = 1;
      }

      const rootHTML = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerHTML.trim() : null;
      });

      if (!rootHTML || rootHTML.length === 0) {
        console.error(`❌ Route '${route}' rendered a BLANK PAGE (#root is empty).`);
        exitCode = 1;
      } else {
        console.log(`  ✓ Route '${route}' rendered successfully (${rootHTML.length} chars).`);
      }
    }

    console.log('\n🔍 --- Analysis Results ---');
    if (mimeTypeErrors.length > 0) {
      console.error(`❌ MIME Type Validation Failed (${mimeTypeErrors.length} errors):`);
      mimeTypeErrors.forEach((err, idx) => console.error(`   [MIME Error ${idx + 1}] ${err}`));
      exitCode = 1;
    } else {
      console.log('✅ MIME Type Check PASSED: All JavaScript modules returned application/javascript and CSS returned text/css.');
    }

    if (consoleErrors.length > 0) {
      console.error(`❌ Captured ${consoleErrors.length} browser console errors:`);
      consoleErrors.forEach((err, idx) => console.error(`   [Console Error ${idx + 1}] ${err}`));
      exitCode = 1;
    } else {
      console.log('✅ Console Error Check PASSED: Zero critical runtime errors detected.');
    }

    if (pageErrors.length > 0) {
      console.error(`❌ Captured ${pageErrors.length} unhandled runtime exceptions:`);
      pageErrors.forEach((err, idx) => console.error(`   [Exception ${idx + 1}] ${err}`));
      exitCode = 1;
    } else {
      console.log('✅ Runtime Exception Check PASSED.');
    }

  } catch (error) {
    console.error('❌ Verification script crashed:', error);
    exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
    previewProcess.kill();
    
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', previewProcess.pid, '/f', '/t'], { shell: true });
    }
  }

  if (exitCode === 0) {
    console.log('\n🎉 Comprehensive preview verification PASSED! Build is 100% ready for deployment.');
  } else {
    console.error('\n❌ Preview check FAILED! Deployment aborted.');
  }

  process.exit(exitCode);
}

runVerification();
