import http from 'http';
import https from 'https';

const endpoints = [
  '/api/active-popup',
  '/api/catalog',
  '/api/academic-pyqs',
  '/api/academic-study-materials',
  '/api/branches',
  '/api/student-stats',
  '/api/search-index'
];

const hosts = [
  'http://localhost:8788',
  'https://shikshasahayak.org',
  'https://padhakuportal.pages.dev'
];

async function testEndpoint(baseUrl, path) {
  const fullUrl = `${baseUrl}${path}`;
  const isHttps = fullUrl.startsWith('https');
  const lib = isHttps ? https : http;

  return new Promise((resolve) => {
    lib.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let isJson = false;
        let isHtml = data.trim().startsWith('<');
        try {
          JSON.parse(data);
          isJson = true;
        } catch (e) {}

        resolve({
          url: fullUrl,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          isJson,
          isHtml,
          sample: data.substring(0, 150).replace(/\s+/g, ' ')
        });
      });
    }).on('error', (err) => {
      resolve({
        url: fullUrl,
        status: 'ERR',
        error: err.message
      });
    });
  });
}

async function runApiTests() {
  console.log('🔍 Testing API Endpoints for Unexpected HTML responses...\n');

  for (const host of hosts) {
    console.log(`==================================================`);
    console.log(`🌐 Host: ${host}`);
    console.log(`==================================================`);

    for (const ep of endpoints) {
      const res = await testEndpoint(host, ep);
      if (res.isHtml) {
        console.error(`❌ HTML RETURNED FOR API! Path: ${ep}`);
        console.error(`   Status: ${res.status} | Content-Type: ${res.contentType}`);
        console.error(`   Sample: ${res.sample}\n`);
      } else if (res.isJson) {
        console.log(`  ✓ Path: ${ep} -> Status: ${res.status} (Valid JSON)`);
      } else {
        console.log(`  ⚠️ Path: ${ep} -> Status: ${res.status} | Content-Type: ${res.contentType}`);
        console.log(`     Sample: ${res.sample}`);
      }
    }
    console.log('\n');
  }
}

runApiTests();
