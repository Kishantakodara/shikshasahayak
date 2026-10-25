import fs from 'fs';
import path from 'path';

// Read subjects data and handle potential BOM
const dataRaw = fs.readFileSync('public/subjects_data.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(dataRaw);
const subjects = data[0].results;

const SITE_URL = 'https://shikshasahayak.org';
const lastmod = new Date().toISOString().split('T')[0];

const staticUrls = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/student', changefreq: 'weekly', priority: '0.9' },
  { loc: '/study', changefreq: 'weekly', priority: '0.9' },
  { loc: '/resources', changefreq: 'weekly', priority: '0.9' },
  { loc: '/practice', changefreq: 'weekly', priority: '0.8' },
  { loc: '/subjects', changefreq: 'weekly', priority: '0.8' },
  { loc: '/timeline', changefreq: 'weekly', priority: '0.7' },
  { loc: '/assignments', changefreq: 'weekly', priority: '0.7' },
  { loc: '/pyqs', changefreq: 'weekly', priority: '0.8' },
  { loc: '/notes', changefreq: 'weekly', priority: '0.8' },
  { loc: '/guides', changefreq: 'weekly', priority: '0.9' },
  { loc: '/exam-tips', changefreq: 'monthly', priority: '0.8' },
  { loc: '/ai-tutor', changefreq: 'monthly', priority: '0.6' },
  { loc: '/contribute', changefreq: 'monthly', priority: '0.6' },
  { loc: '/about', changefreq: 'monthly', priority: '0.7' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
  { loc: '/privacypolicy', changefreq: 'yearly', priority: '0.6' },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.6' },
  { loc: '/terms-of-service', changefreq: 'yearly', priority: '0.6' },
  { loc: '/disclaimer', changefreq: 'yearly', priority: '0.6' },
  { loc: '/sitemap', changefreq: 'monthly', priority: '0.5' },
  { loc: '/courses', changefreq: 'weekly', priority: '0.9' },
  { loc: '/scholarships', changefreq: 'weekly', priority: '0.9' },
  { loc: '/workshops', changefreq: 'weekly', priority: '0.8' },
  { loc: '/festivals', changefreq: 'weekly', priority: '0.8' },
  { loc: '/coding/100-days', changefreq: 'daily', priority: '0.9' },
  { loc: '/student/100-days-code', changefreq: 'daily', priority: '0.9' },
  { loc: '/student/100-days-code/tracks', changefreq: 'weekly', priority: '0.8' },
  { loc: '/student/100-days-code/projects', changefreq: 'weekly', priority: '0.8' },
  { loc: '/student/100-days-code/achievements', changefreq: 'weekly', priority: '0.8' },
  { loc: '/coding/conquest', changefreq: 'weekly', priority: '0.9' },
  { loc: '/career/internships', changefreq: 'daily', priority: '0.9' },
  { loc: '/career/interview-prep', changefreq: 'weekly', priority: '0.9' },
  { loc: '/career/resume-builder', changefreq: 'monthly', priority: '0.8' },
  { loc: '/articles', changefreq: 'weekly', priority: '0.8' },
  { loc: '/login', changefreq: 'monthly', priority: '0.7' },
  { loc: '/register', changefreq: 'weekly', priority: '0.9' }
];

const guides = [
  'data-structures-pyq-strategy',
  'engineering-mathematics-revision-plan',
  'thermodynamics-numerical-practice',
  'circuit-analysis-semester-revision',
  'digital-electronics-exam-guide',
  'operating-systems-core-concepts',
  'dbms-sql-normalization-guide',
  'computer-networks-last-week-plan',
  'object-oriented-programming-guide',
  'signals-systems-problem-solving',
  'strength-of-materials-formula-map',
  'fluid-mechanics-exam-prep',
  'microprocessors-8086-revision',
  'environmental-engineering-notes',
  'control-systems-root-locus',
  'machine-design-safe-practice',
  'power-systems-revision-guide',
  'communication-systems-exam-guide',
  'construction-materials-practical-guide',
  'study-planner-active-recall',
  'exam-writing-answer-presentation',
  'pyq-analysis-how-to-find-repeated-topics',
  'lab-file-viva-preparation',
  'first-year-engineering-survival-guide',
  'semester-backlog-recovery-plan'
];

const urls = [];

// 1. Add static pages
for (const staticUrl of staticUrls) {
  urls.push({
    loc: `${SITE_URL}${staticUrl.loc}`,
    changefreq: staticUrl.changefreq,
    priority: staticUrl.priority
  });
}

// 2. Add guide pages
for (const guide of guides) {
  urls.push({
    loc: `${SITE_URL}/guides/${guide}`,
    changefreq: 'monthly',
    priority: '0.7'
  });
}

// Helper to encode semester slug
const encodeSemesterSlug = (sem) => {
  return Number(sem) === 0 ? '1-or-2-common' : String(sem);
};

const types = ['pyq', 'study-material', 'syllabus'];
const visited = new Set();

// 3. Generate dynamic branch, semester, and subject URLs
for (const subject of subjects) {
  const branch = subject.branch_slug;
  const sem = encodeSemesterSlug(subject.semester);
  const subjectSlug = subject.subject_slug;

  for (const type of types) {
    // Branch URL
    const branchPath = `/resources/${type}/${branch}`;
    if (!visited.has(branchPath)) {
      visited.add(branchPath);
      urls.push({
        loc: `${SITE_URL}${branchPath}`,
        changefreq: 'weekly',
        priority: '0.8'
      });
    }

    // Semester URL
    const semPath = `/resources/${type}/${branch}/semester/${sem}`;
    if (!visited.has(semPath)) {
      visited.add(semPath);
      urls.push({
        loc: `${SITE_URL}${semPath}`,
        changefreq: 'weekly',
        priority: '0.7'
      });
    }

    // Subject URL
    const subjectPath = `/resources/${type}/${branch}/semester/${sem}/${subjectSlug}`;
    if (!visited.has(subjectPath)) {
      visited.add(subjectPath);
      urls.push({
        loc: `${SITE_URL}${subjectPath}`,
        changefreq: 'weekly',
        priority: '0.7'
      });
    }
  }
}

// Construct XML
let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const url of urls) {
  xml += '  <url>\n';
  xml += `    <loc>${url.loc}</loc>\n`;
  xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
  xml += `    <priority>${url.priority}</priority>\n`;
  xml += '  </url>\n';
}

xml += '</urlset>\n';

fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs!`);
