import { chromium } from 'playwright';

const urls = [
  'https://shikshasahayak.org',
  'https://SHIKSHAportal.pages.dev',
  'https://a6c12570.SHIKSHAportal.pages.dev'
];

async function diagnoseLive() {
  console.log('🔍 Starting live URL diagnostic inspection...\n');
  const browser = await chromium.launch({ headless: true });

  for (const targetUrl of urls) {
    console.log(`==================================================`);
    console.log(`🌐 Inspecting target URL: ${targetUrl}`);
    console.log(`==================================================`);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const consoleLogs = [];
    const pageErrors = [];
    const failedRequests = [];
    const responseDetails = [];

    page.on('console', (msg) => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message + '\n' + err.stack);
    });

    page.on('requestfailed', (req) => {
      failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
    });

    page.on('response', (res) => {
      const u = res.url();
      if (u.includes('.js') || u.includes('.css') || u.includes('/assets/')) {
        responseDetails.push({
          url: u,
          status: res.status(),
          contentType: res.headers()['content-type']
        });
      }
    });

    try {
      const response = await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
      console.log(`HTTP Response Status: ${response?.status()}`);
      
      // Wait extra time for JS execution
      await page.waitForTimeout(3000);

      const rootHTML = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
          exists: !!root,
          innerHTML: root ? root.innerHTML : null,
          innerText: root ? root.innerText : null
        };
      });

      const bodyHTML = await page.evaluate(() => document.body.innerHTML);

      console.log(`\n📦 DOM Root State:`);
      console.log(`  - #root Exists: ${rootHTML.exists}`);
      console.log(`  - #root innerHTML length: ${rootHTML.innerHTML ? rootHTML.innerHTML.length : 0}`);
      console.log(`  - #root innerText: "${rootHTML.innerText ? rootHTML.innerText.substring(0, 100) : ''}"`);
      if (!rootHTML.innerHTML || rootHTML.innerHTML.length === 0) {
        console.log(`  ⚠️ BODY CONTENT SAMPLE: ${bodyHTML.substring(0, 300)}`);
      }

      console.log(`\n📜 Captured Console Messages (${consoleLogs.length}):`);
      consoleLogs.forEach((log, i) => {
        console.log(`  [Console ${log.type.toUpperCase()}] ${log.text}`);
      });

      console.log(`\n💥 Captured Unhandled Exceptions (${pageErrors.length}):`);
      pageErrors.forEach((err, i) => {
        console.log(`  [Exception ${i + 1}] ${err}`);
      });

      console.log(`\n❌ Captured Failed Requests (${failedRequests.length}):`);
      failedRequests.forEach((req, i) => {
        console.log(`  [Failed ${i + 1}] ${req.url} - ${req.failure}`);
      });

      console.log(`\n📑 Asset Response Details (Sample of ${responseDetails.length}):`);
      responseDetails.slice(0, 10).forEach((res) => {
        console.log(`  [Asset] ${res.status} | Content-Type: ${res.contentType} | URL: ${res.url}`);
      });

    } catch (error) {
      console.error(`❌ Diagnostics failed for ${targetUrl}:`, error);
    } finally {
      await context.close();
    }
    console.log('\n');
  }

  await browser.close();
  console.log('✅ Live URL diagnostics completed.');
}

diagnoseLive();
