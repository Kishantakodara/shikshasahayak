import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
const rawArgs = process.argv.slice(2);
let artifactDir = 'C:/Users/kisha/.gemini/antigravity-ide/brain/f4465b6d-c6ca-4aa1-b78f-b118292071ec'; // Default fallback

const filteredUrls = [];
for (const arg of rawArgs) {
  if (arg.startsWith('--artifact-dir=')) {
    artifactDir = arg.split('=')[1].replace(/^"|"$/g, '');
  } else {
    filteredUrls.push(arg);
  }
}

const TARGET_URLS = filteredUrls.length > 0 
  ? filteredUrls 
  : ['https://padhakuportal.pages.dev', 'https://shikshasahayak.org'];

const REPORT_DIR = artifactDir;

async function runLiveVerification() {
  console.log('🚀 Starting live production smoke tests...\n');
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  
  let overallPassed = true;
  const reports = [];

  for (const url of TARGET_URLS) {
    console.log(`--------------------------------------------------`);
    console.log(`🌐 Testing Live Deployment: ${url}`);
    console.log(`--------------------------------------------------`);

    // Create a fresh incognito context
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    const consoleErrors = [];
    const pageExceptions = [];
    const failedRequests = [];
    const assetMimeDetails = [];
    let blankPage = false;
    let reactMounted = false;
    let loadStatus = null;
    let loadError = null;

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected external tracking or ads block failures
        if (
          text.includes('google-analytics') || 
          text.includes('adsbygoogle') || 
          text.includes('ezojs') ||
          text.includes('ezoicanalytics') ||
          text.includes('CSP') ||
          text.includes('Content Security Policy')
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    // Listen for page exceptions
    page.on('pageerror', (err) => {
      pageExceptions.push(`${err.name}: ${err.message}\n${err.stack}`);
    });

    // Intercept network responses to verify status and MIME types
    page.on('response', (response) => {
      const reqUrl = response.url();
      const status = response.status();
      const headers = response.headers();
      const contentType = headers['content-type'] || '';

      // Check JS assets
      if (reqUrl.includes('/assets/') && reqUrl.endsWith('.js')) {
        if (contentType.includes('text/html') || status >= 400) {
          failedRequests.push({
            url: reqUrl,
            status,
            contentType,
            reason: `JS chunk returned HTML/Error instead of JavaScript!`
          });
        } else {
          assetMimeDetails.push({ url: reqUrl, status, contentType, type: 'JS' });
        }
      }

      // Check CSS assets
      if (reqUrl.includes('/assets/') && reqUrl.endsWith('.css')) {
        if (status >= 400 || (contentType && !contentType.includes('css'))) {
          failedRequests.push({
            url: reqUrl,
            status,
            contentType,
            reason: `CSS returned incorrect Content-Type or failed to load`
          });
        } else {
          assetMimeDetails.push({ url: reqUrl, status, contentType, type: 'CSS' });
        }
      }
    });

    // Track request failures directly
    page.on('requestfailed', (request) => {
      const reqUrl = request.url();
      if (reqUrl.includes('/assets/') || reqUrl.endsWith('.js') || reqUrl.endsWith('.css')) {
        failedRequests.push({
          url: reqUrl,
          status: 'Failed',
          contentType: 'N/A',
          reason: request.failure()?.errorText || 'Network request failed'
        });
      }
    });

    try {
      const testUrl = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
      console.log(`🔗 Loading cache-busted URL: ${testUrl}`);
      const response = await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 25000 });
      loadStatus = response ? response.status() : 'Unknown';

      // Wait a moment for dynamic rendering and React mount
      await page.waitForTimeout(3000);

      // Check #root element
      const rootInfo = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
          exists: !!root,
          innerHTML: root ? root.innerHTML.trim() : '',
          innerText: root ? root.innerText.trim() : ''
        };
      });

      if (!rootInfo.exists) {
        blankPage = true;
        loadError = 'Could not find #root element in DOM';
      } else if (rootInfo.innerHTML.length === 0) {
        blankPage = true;
        loadError = '#root element is present but completely empty';
      } else {
        reactMounted = true;
      }

    } catch (err) {
      loadError = err.message || err.toString();
      overallPassed = false;
    }

    const passed = reactMounted && !blankPage && consoleErrors.length === 0 && pageExceptions.length === 0 && failedRequests.length === 0;
    if (!passed) {
      overallPassed = false;
    }

    reports.push({
      url,
      passed,
      loadStatus,
      loadError,
      reactMounted,
      blankPage,
      consoleErrors,
      pageExceptions,
      failedRequests,
      assetMimeDetails
    });

    await context.close();
  }

  await browser.close();

  // Generate the markdown report
  const reportPath = path.join(REPORT_DIR, 'deployment_verification_report.md');
  const timestamp = new Date().toISOString();
  
  let md = `# Live Deployment Verification Report\n\n`;
  md += `**Timestamp**: ${timestamp}\n`;
  md += `**Overall Status**: ${overallPassed ? '🟢 PASSED' : '🔴 FAILED'}\n\n`;
  md += `## Individual URL Summaries\n\n`;

  for (const rep of reports) {
    md += `### URL: ${rep.url}\n`;
    md += `- **Status**: ${rep.passed ? '🟢 Passed' : '🔴 Failed'}\n`;
    md += `- **HTTP Load Status**: ${rep.loadStatus}\n`;
    md += `- **React Mounted**: ${rep.reactMounted ? '✅ Yes' : '❌ No'}\n`;
    md += `- **Blank Page**: ${rep.blankPage ? '❌ Yes (BLANK)' : '✅ No (Rendered)'}\n`;
    if (rep.loadError) {
      md += `- **Load/Render Error**: \`${rep.loadError}\`\n`;
    }
    md += `- **Critical Browser Console Errors**: ${rep.consoleErrors.length === 0 ? '✅ 0' : `❌ ${rep.consoleErrors.length}`}\n`;
    md += `- **Unhandled Exceptions**: ${rep.pageExceptions.length === 0 ? '✅ 0' : `❌ ${rep.pageExceptions.length}`}\n`;
    md += `- **Failed Asset Requests**: ${rep.failedRequests.length === 0 ? '✅ 0' : `❌ ${rep.failedRequests.length}`}\n\n`;

    if (rep.consoleErrors.length > 0) {
      md += `#### 📜 Browser Console Errors\n\`\`\`text\n`;
      rep.consoleErrors.forEach((err) => { md += `${err}\n`; });
      md += `\`\`\`\n\n`;
    }

    if (rep.pageExceptions.length > 0) {
      md += `#### 💥 Unhandled Runtime Exceptions\n\`\`\`text\n`;
      rep.pageExceptions.forEach((exc) => { md += `${exc}\n\n`; });
      md += `\`\`\`\n\n`;
    }

    if (rep.failedRequests.length > 0) {
      md += `#### ❌ Failed/MIME-mismatched Asset Requests\n`;
      md += `| Asset URL | Status | Content-Type | Issue Description |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      rep.failedRequests.forEach((req) => {
        md += `| \`${req.url}\` | ${req.status} | \`${req.contentType}\` | ${req.reason} |\n`;
      });
      md += `\n`;
    }

    md += `#### 📑 Verified Assets (Sample)\n`;
    md += `| Type | Status | Content-Type | Asset URL |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    rep.assetMimeDetails.slice(0, 10).forEach((asset) => {
      md += `| ${asset.type} | ${asset.status} | \`${asset.contentType}\` | \`${asset.url.split('/').pop()}\` |\n`;
    });
    md += `\n---\n\n`;
  }

  try {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(reportPath, md, 'utf-8');
    console.log(`✅ Saved deployment verification report to: ${reportPath}`);
  } catch (err) {
    console.error('❌ Failed to write deployment verification report:', err);
  }

  if (overallPassed) {
    console.log('\n🎉 ALL LIVE SMOKE TESTS PASSED! Production site is verified working correctly.');
    process.exit(0);
  } else {
    console.error('\n❌ ONE OR MORE LIVE SMOKE TESTS FAILED! Check the report details.');
    process.exit(1);
  }
}

runLiveVerification();
