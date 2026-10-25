import fs from 'fs';
import path from 'path';

// Extract all routes from App.tsx
const appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["']/g;
const declaredRoutes = new Set<string>();
let match;
while ((match = routeRegex.exec(appTsx)) !== null) {
  declaredRoutes.add(match[1]);
}

console.log(`Found ${declaredRoutes.size} declared routes in App.tsx`);

// Function to convert path pattern to regex for matching
function routeToPattern(route: string): RegExp {
  if (route === '*') return /.*/;
  // Escape regex special chars except : and *
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

function isValidInternalPath(targetPath: string): boolean {
  // Strip query string and hash
  const cleanPath = targetPath.split('?')[0].split('#')[0];
  if (!cleanPath || cleanPath === '') return true;
  
  // External or mailto or tel
  if (cleanPath.startsWith('http') || cleanPath.startsWith('mailto:') || cleanPath.startsWith('tel:')) return true;
  if (cleanPath.startsWith('/api/') || cleanPath.startsWith('/assets/')) return true;

  // Check if it is a real file in public/
  if (fs.existsSync(path.join('public', cleanPath))) return true;

  // Check against static and parameterized routes
  for (const matcher of routeMatchers) {
    if (matcher.regex.test(cleanPath)) return true;
  }
  return false;
}

// Recursively find all tsx/ts files in src
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getAllFiles(fullPath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles('src');
const pathLiteralRegex = /['"`](\/[a-zA-Z0-9_\-./]+)['"`]/g;

interface BrokenLink {
  file: string;
  line: number;
  link: string;
  context: string;
}

const brokenLinks: BrokenLink[] = [];

for (const file of allFiles) {
  // skip test files, scripts, or types
  if (file.includes('audit-links') || file.includes('.test.') || file.includes('/tests/')) continue;
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    // Look for link-related keywords on the line
    if (!line.includes('to=') && !line.includes('href') && !line.includes('navigate(') && !line.includes('path:') && !line.includes('url:')) {
      continue;
    }
    let m;
    const r = new RegExp(pathLiteralRegex);
    while ((m = r.exec(line)) !== null) {
      const link = m[1];
      // Skip file paths like /index.html, /favicon.ico, /manifest.json, /api/*, /icons/*, etc.
      if (link.includes('.') && (link.endsWith('.png') || link.endsWith('.svg') || link.endsWith('.json') || link.endsWith('.ico') || link.endsWith('.css') || link.endsWith('.webp') || link.endsWith('.jpg') || link.endsWith('.js'))) continue;
      if (link.startsWith('/api/') || link.startsWith('/assets/') || link.startsWith('/fonts/') || link.startsWith('/images/')) continue;
      
      if (!isValidInternalPath(link)) {
        brokenLinks.push({
          file,
          line: lineIdx + 1,
          link,
          context: line.trim()
        });
      }
    }
  }
}

console.log(`\nFound ${brokenLinks.length} potentially broken paths in link/nav contexts:\n`);
for (const b of brokenLinks) {
  console.log(`- [${b.file}:${b.line}] -> "${b.link}"\n    Context: ${b.context}`);
}

