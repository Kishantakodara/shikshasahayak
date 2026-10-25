/**
 * Automated Verification Suite for ShikshaSahayak Career Hub & Internship Opportunity Card
 * 
 * Tests:
 * 1. Strict separation between Jobs and Internships
 * 2. API query filtering (type=INTERNSHIP, type=JOB, search, branch, workplace)
 * 3. Data contract integrity (non-empty fields, valid URLs, realistic deadlines)
 * 4. Verification rules & provenance logic (isDeadlineExpired, isValidHttpUrl)
 * 5. Internship Card facts grid & subcomponents contract
 */

import { onRequestGet } from '../functions/api/career/listings';
import { isDeadlineExpired, isValidHttpUrl } from '../src/components/career/VerificationIndicator';

async function runTests() {
  console.log('🚀 Running Career Hub & Internship Card Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Test full dataset retrieval
  {
    const req = new Request('http://localhost:8788/api/career/listings');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    assert(res.status === 200, 'GET /api/career/listings returns HTTP 200');
    assert(data.success === true, 'Response body contains success: true');
    assert(Array.isArray(data.listings), 'Response body contains listings array');
    assert(data.listings.length >= 14, `Expected at least 14 listings, received ${data.listings.length}`);

    const internships = data.listings.filter((d: any) => d.listingType === 'INTERNSHIP');
    const jobs = data.listings.filter((d: any) => d.listingType === 'JOB');

    assert(internships.length >= 7, `Expected at least 7 internships, received ${internships.length}`);
    assert(jobs.length >= 7, `Expected at least 7 jobs, received ${jobs.length}`);
    assert(internships.length + jobs.length === data.listings.length, 'All listings are strictly categorized as INTERNSHIP or JOB');
  }

  // 2. Test strict type filtering: INTERNSHIP only
  {
    const req = new Request('http://localhost:8788/api/career/listings?type=INTERNSHIP');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    const jobsFound = data.listings.filter((d: any) => d.listingType === 'JOB');
    const internshipsFound = data.listings.filter((d: any) => d.listingType === 'INTERNSHIP');

    assert(jobsFound.length === 0, 'Filtering by type=INTERNSHIP returns ZERO jobs (strict zero leakage)');
    assert(internshipsFound.length > 0, `Filtering by type=INTERNSHIP returns ${internshipsFound.length} internships`);
    assert(internshipsFound.every((i: any) => i.stipendOrSalary && i.stipendOrSalary.length > 0), 'All internships have stipend defined');
  }

  // 3. Test strict type filtering: JOB only
  {
    const req = new Request('http://localhost:8788/api/career/listings?type=JOB');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    const jobsFound = data.listings.filter((d: any) => d.listingType === 'JOB');
    const internshipsFound = data.listings.filter((d: any) => d.listingType === 'INTERNSHIP');

    assert(internshipsFound.length === 0, 'Filtering by type=JOB returns ZERO internships (strict zero leakage)');
    assert(jobsFound.length > 0, `Filtering by type=JOB returns ${jobsFound.length} jobs`);
    assert(jobsFound.every((j: any) => j.stipendOrSalary && j.stipendOrSalary.length > 0), 'All jobs have salaryRange defined');
  }

  // 4. Test search keyword filtering
  {
    const req = new Request('http://localhost:8788/api/career/listings?q=Google');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    assert(data.listings.length >= 1, `Searching for "Google" returns matched opportunities (${data.listings.length} found)`);
    assert(data.listings.some((d: any) => d.companyName.includes('Google')), 'Result contains Google Software Engineering listing');
  }

  // 5. Test workplace filter
  {
    const req = new Request('http://localhost:8788/api/career/listings?workplace=Remote');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    assert(data.listings.length >= 1, `Filtering by workplace=Remote returns remote positions (${data.listings.length} found)`);
    assert(data.listings.every((d: any) => d.workplaceType.toLowerCase() === 'remote'), 'All returned listings have workplace === remote');
  }

  // 6. Test branch/discipline filter
  {
    const req = new Request('http://localhost:8788/api/career/listings?branch=EC');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    assert(data.listings.length >= 1, `Filtering by branch=EC returns relevant positions (${data.listings.length} found)`);
    assert(data.listings.every((d: any) => 
      d.eligibleBranches.some((b: string) => b.includes('EC') || b.includes('Electronics') || b === 'All Engineering')
    ), 'All returned items include EC in eligibleBranches');
  }

  // 7. Verify Data Integrity & Safety (No invent, valid URLs, required props)
  {
    const req = new Request('http://localhost:8788/api/career/listings');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    let allValid = true;
    for (const item of data.listings) {
      if (!item.id || !item.title || !item.companyName || !item.location || !item.officialApplicationUrl) {
        allValid = false;
        console.error(`Invalid item missing core field:`, item);
      }
      if (!item.officialApplicationUrl.startsWith('https://')) {
        allValid = false;
        console.error(`Item has non-https URL: ${item.officialApplicationUrl}`);
      }
    }
    assert(allValid, 'All listings possess valid https URLs, titles, companies, locations, and IDs');
  }

  // 8. Verification & Provenance Rules Unit Tests
  {
    assert(isDeadlineExpired('2020-01-01') === true, 'isDeadlineExpired correctly flags past date as expired');
    assert(isDeadlineExpired('2030-12-31') === false, 'isDeadlineExpired correctly flags future date as active');
    assert(isDeadlineExpired('Rolling') === false, 'isDeadlineExpired correctly flags Rolling admissions as active');
    assert(isDeadlineExpired(undefined) === false, 'isDeadlineExpired treats undefined as non-expired');

    assert(isValidHttpUrl('https://careers.google.com') === true, 'isValidHttpUrl approves secure https URL');
    assert(isValidHttpUrl('javascript:alert(1)') === false, 'isValidHttpUrl rejects dangerous javascript: scheme');
    assert(isValidHttpUrl('data:text/html;base64,...') === false, 'isValidHttpUrl rejects dangerous data: scheme');
    assert(isValidHttpUrl('') === false, 'isValidHttpUrl rejects empty string');
  }

  // 9. Internship Opportunity Model Specs
  {
    const req = new Request('http://localhost:8788/api/career/listings?type=INTERNSHIP');
    const res = await onRequestGet({ request: req, env: {} } as any);
    const data = await res.json();

    const googleIntern = data.listings.find((l: any) => l.companyName === 'Google');
    assert(Boolean(googleIntern), 'Google Software Engineering Intern exists in listings');
    assert(googleIntern.duration === '3 months', 'Google listing has accurate duration (3 months)');
    assert(googleIntern.badgeType === 'featured', 'Google listing has featured badge');
    assert(googleIntern.companyVerified === true, 'Google listing has companyVerified = true');
    assert(googleIntern.sourceVerified === true, 'Google listing has sourceVerified = true');
  }

  console.log(`\n========================================`);
  console.log(`Career Hub & Internship Card Test Results: ${passed}/${total} passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
