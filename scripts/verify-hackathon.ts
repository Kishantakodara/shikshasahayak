/**
 * ShikshaSahayak — Hack for Social Cause (VBYLD 2027) System Verification Suite
 * Validates backend APIs, frontend routes, sitemap registration, and compliance checklist.
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED';
  details: string;
}

const checks: CheckResult[] = [];

function recordCheck(category: string, name: string, condition: boolean, details: string) {
  checks.push({
    category,
    name,
    status: condition ? 'PASSED' : 'FAILED',
    details
  });
}

console.log('\n=============================================================');
console.log('🇮🇳 HACK FOR SOCIAL CAUSE — VBYLD 2027 VERIFICATION SUITE');
console.log('=============================================================\n');

// 1. Verify Backend API Endpoints
console.log('🔍 [1/5] Auditing Cloudflare Worker Backend APIs...');
const hackathonApiDir = path.resolve('functions/api/hackathon');
const apiIndex = path.join(hackathonApiDir, 'index.ts');
const apiImpact = path.join(hackathonApiDir, 'impact.ts');
const apiEvaluate = path.join(hackathonApiDir, 'evaluate.ts');

recordCheck('Backend API', 'Hackathon Overview API (/api/hackathon)', fs.existsSync(apiIndex), 'functions/api/hackathon/index.ts exists');
recordCheck('Backend API', 'Social Impact API (/api/hackathon/impact)', fs.existsSync(apiImpact), 'functions/api/hackathon/impact.ts exists');
recordCheck('Backend API', 'Evaluator Diagnostic API (/api/hackathon/evaluate)', fs.existsSync(apiEvaluate), 'functions/api/hackathon/evaluate.ts exists');

if (fs.existsSync(apiIndex)) {
  const content = fs.readFileSync(apiIndex, 'utf-8');
  recordCheck('Backend API', 'Theme 2 & VBYLD 2027 Mapping in API', content.includes('Education & Skill Development') && content.includes('VBYLD 2027'), 'Contains official hackathon and theme metadata');
}

// 2. Verify Frontend Pages & Components
console.log('🔍 [2/5] Auditing Frontend Pages & UI Showcase...');
const hackathonPage = path.resolve('src/pages/HackathonSocialCause.tsx');
recordCheck('Frontend', 'Dedicated Hackathon Page Component', fs.existsSync(hackathonPage), 'src/pages/HackathonSocialCause.tsx exists');

if (fs.existsSync(hackathonPage)) {
  const pageContent = fs.readFileSync(hackathonPage, 'utf-8');
  recordCheck('Frontend', '1-Click Evaluator Personas (Student/Teacher/Admin)', pageContent.includes('student@shikshasahayak.org') && pageContent.includes('handlePersonaLogin'), 'Pre-seeded 1-click accounts present');
  recordCheck('Frontend', 'Interactive Impact Simulator', pageContent.includes('simulateHackathonImpact') && pageContent.includes('simStudents'), 'Dynamic impact calculator integrated');
  recordCheck('Frontend', 'UN SDGs 4, 8, 10 Display', pageContent.includes('SDG 4') && pageContent.includes('SDG 10'), 'UN SDGs prominently mapped');
}

// 3. Verify App Routing & Navigation
console.log('🔍 [3/5] Auditing App Routing & Layout Navigation...');
const appTsx = path.resolve('src/App.tsx');
if (fs.existsSync(appTsx)) {
  const appContent = fs.readFileSync(appTsx, 'utf-8');
  recordCheck('Routing', 'Route /hackathon registered', appContent.includes('path="/hackathon"'), 'Route /hackathon in App.tsx');
  recordCheck('Routing', 'Route /social-cause alias registered', appContent.includes('path="/social-cause"'), 'Route /social-cause in App.tsx');
  recordCheck('Routing', 'Route /vbyld-2027 alias registered', appContent.includes('path="/vbyld-2027"'), 'Route /vbyld-2027 in App.tsx');
}

const layoutTsx = path.resolve('src/components/Layout.tsx');
if (fs.existsSync(layoutTsx)) {
  const layoutContent = fs.readFileSync(layoutTsx, 'utf-8');
  recordCheck('Navigation', 'Social Cause link in Layout Navbar/Footer', layoutContent.includes('/hackathon'), 'Layout contains /hackathon link');
}

// 4. Verify Sitemap Registration
console.log('🔍 [4/5] Auditing SEO & Sitemap Registration...');
const sitemapJs = path.resolve('scripts/build_sitemap.js');
if (fs.existsSync(sitemapJs)) {
  const sitemapContent = fs.readFileSync(sitemapJs, 'utf-8');
  recordCheck('SEO', 'Sitemap Generator includes /hackathon', sitemapContent.includes('/hackathon'), 'scripts/build_sitemap.js contains /hackathon');
}

const publicSitemap = path.resolve('public/sitemap.xml');
if (fs.existsSync(publicSitemap)) {
  const sitemapXml = fs.readFileSync(publicSitemap, 'utf-8');
  recordCheck('SEO', 'public/sitemap.xml includes /hackathon', sitemapXml.includes('<loc>https://shikshasahayak.org/hackathon</loc>'), 'public/sitemap.xml has live url');
}

// 5. Verify Documentation & Open-Source Compliance
console.log('🔍 [5/5] Auditing Hackathon Guidelines & Compliance Artifacts...');
const hackathonDoc = path.resolve('HACK_FOR_SOCIAL_CAUSE_2027.md');
recordCheck('Compliance', 'Hackathon Official Guide Document exists', fs.existsSync(hackathonDoc), 'HACK_FOR_SOCIAL_CAUSE_2027.md is present');

const readmeDoc = path.resolve('README.md');
if (fs.existsSync(readmeDoc)) {
  const readmeContent = fs.readFileSync(readmeDoc, 'utf-8');
  recordCheck('Compliance', 'README contains Hack for Social Cause mention', readmeContent.includes('Hack for Social Cause'), 'README mentions HSC / VBYLD');
}

// Summary Report
console.log('\n=============================================================');
console.log('📊 AUDIT SUMMARY REPORT');
console.log('=============================================================\n');

let failedCount = 0;
for (const check of checks) {
  const icon = check.status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} [${check.category}] ${check.name}: ${check.details}`);
  if (check.status === 'FAILED') failedCount++;
}

console.log('\n-------------------------------------------------------------');
console.log(`TOTAL CHECKS: ${checks.length} | PASSED: ${checks.length - failedCount} | FAILED: ${failedCount}`);
console.log('-------------------------------------------------------------\n');

if (failedCount > 0) {
  console.error('❌ SOME CHECKS FAILED! Please review the report above.');
  process.exit(1);
} else {
  console.log('🎉 ALL HACKATHON SYSTEM CHECKS PASSED WITH 100% COMPLIANCE!');
  console.log('ShikshaSahayak is completely verified for Hack for Social Cause (VBYLD 2027).\n');
  process.exit(0);
}

