import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

let errors = [];

function logError(msg) {
  console.error(`❌ Assertion Failed: ${msg}`);
  errors.push(msg);
}

function verifyBuild() {
  console.log('🔍 Performing static build verification on dist/...');

  // 1. Check index.html and 200.html exist
  const indexPath = path.join(distDir, 'index.html');
  const fallbackPath = path.join(distDir, '200.html');

  if (!fs.existsSync(indexPath)) {
    logError('dist/index.html does not exist.');
  }
  if (!fs.existsSync(fallbackPath)) {
    logError('dist/200.html does not exist.');
  }

  // 2. Scan all HTML files in dist/ for uncompiled /src/ references and valid asset links
  const files = fs.readdirSync(distDir);
  const htmlFiles = files.filter(f => f.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    const filePath = path.join(distDir, htmlFile);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check specifically for uncompiled script or style tags pointing to /src/
    const devPathRegex = /(?:src|href)=["']\/src\/[^"']+["']/g;
    let devMatch;
    while ((devMatch = devPathRegex.exec(content)) !== null) {
      logError(`HTML file '${htmlFile}' contains uncompiled dev path: ${devMatch[0]}`);
    }

    // Extract asset references from <script src="...">, <link href="...">, <img src="...">, <source src="...">
    const resourceRegex = /<(?:script|link|img|source|iframe)\b[^>]*(?:src|href)=["']([^"']+)["']/gi;
    let match;
    while ((match = resourceRegex.exec(content)) !== null) {
      let rawUrl = match[1];

      // Ignore external URLs, data URIs, and anchors
      if (
        rawUrl.startsWith('http://') ||
        rawUrl.startsWith('https://') ||
        rawUrl.startsWith('data:') ||
        rawUrl.startsWith('//') ||
        rawUrl.startsWith('#') ||
        rawUrl.startsWith('mailto:')
      ) {
        continue;
      }

      // Strip query parameters and hash fragments
      let cleanUrl = rawUrl.split('?')[0].split('#')[0];
      try {
        cleanUrl = decodeURIComponent(cleanUrl);
      } catch (e) {
        // use raw if decoding fails
      }

      // Resolve path relative to dist root
      const relativePath = cleanUrl.startsWith('/') ? cleanUrl.substring(1) : cleanUrl;
      const targetFilePath = path.join(distDir, relativePath);

      // Verify file exists (unless it's a known dynamic route or showcase preview anchor)
      if (!fs.existsSync(targetFilePath)) {
        // If it's not a root HTML or showcase preview link
        if (cleanUrl.endsWith('.js') || cleanUrl.endsWith('.css') || cleanUrl.includes('/assets/')) {
          logError(`HTML file '${htmlFile}' references missing asset: '${rawUrl}' (resolved to '${targetFilePath}')`);
        }
      } else {
        // If it's a script module, ensure file is non-empty
        if (cleanUrl.endsWith('.js')) {
          const stats = fs.statSync(targetFilePath);
          if (stats.size === 0) {
            logError(`JS asset referenced in '${htmlFile}' is empty (0 bytes): '${rawUrl}'`);
          }
        }
      }
    }
  }

  // 3. Verify _redirects rule
  const redirectsPath = path.join(distDir, '_redirects');
  if (!fs.existsSync(redirectsPath)) {
    logError('dist/_redirects file is missing.');
  } else {
    const redirectsContent = fs.readFileSync(redirectsPath, 'utf-8');
    if (!redirectsContent.includes('/* /index.html 200')) {
      logError("dist/_redirects does not contain the required SPA rewrite rule: '/* /index.html 200'");
    }
    // IMPORTANT: Do NOT add a '/assets/* /404.html 404' redirect rule.
    // Doing so causes ALL JS/CSS asset requests to return an HTML page with
    // incorrect MIME type, leading to a blank white page on the custom domain.
    // Cloudflare Pages serves static assets directly from the dist/ folder.
    if (redirectsContent.includes('/assets/* /404.html 404')) {
      logError("dist/_redirects contains a BROKEN assets redirect rule '/assets/* /404.html 404' that causes white page errors on custom domains. Remove it immediately.");
    }
  }

  // 4. Verify assets-manifest.json and 404.html exist
  const manifestPath = path.join(distDir, 'assets-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    logError('dist/assets-manifest.json does not exist.');
  } else {
    try {
      const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (!manifestData.version) {
        logError('dist/assets-manifest.json is missing the "version" property.');
      }
      console.log(`✅ Verified assets-manifest.json exists and has version: ${manifestData.version}`);
    } catch (e) {
      logError(`dist/assets-manifest.json is not valid JSON: ${e.message}`);
    }
  }

  const static404Path = path.join(distDir, '404.html');
  if (!fs.existsSync(static404Path)) {
    logError('dist/404.html does not exist.');
  } else {
    console.log('✅ Verified dist/404.html fallback is present.');
  }

  // 5. Verify all JS files in dist/assets exist and match the Vite build manifest
  const viteManifestDir = path.join(distDir, '.vite');
  const viteManifestPath = path.join(viteManifestDir, 'manifest.json');
  const fallbackViteManifestPath = path.join(distDir, 'manifest.json');
  
  let viteManifest = null;
  let usedManifestPath = '';
  
  if (fs.existsSync(viteManifestPath)) {
    usedManifestPath = viteManifestPath;
  } else if (fs.existsSync(fallbackViteManifestPath)) {
    usedManifestPath = fallbackViteManifestPath;
  }

  if (usedManifestPath) {
    try {
      viteManifest = JSON.parse(fs.readFileSync(usedManifestPath, 'utf-8'));
      console.log(`✅ Loaded Vite build manifest from: ${usedManifestPath}`);
    } catch (e) {
      logError(`Vite build manifest at '${usedManifestPath}' is not valid JSON: ${e.message}`);
    }
  } else {
    logError('Vite build manifest file (manifest.json) does not exist. Ensure build.manifest is enabled in vite.config.ts.');
  }

  if (viteManifest) {
    let manifestFilesCount = 0;
    for (const [key, entry] of Object.entries(viteManifest)) {
      if (entry.file) {
        const fullFilePath = path.join(distDir, entry.file);
        if (!fs.existsSync(fullFilePath)) {
          logError(`Vite manifest references file that does not exist: '${entry.file}' (source key: '${key}')`);
        } else {
          manifestFilesCount++;
          // Verify file is not empty
          const stats = fs.statSync(fullFilePath);
          if (stats.size === 0) {
            logError(`Vite manifest asset is empty (0 bytes): '${entry.file}'`);
          }
        }
      }

      // Check associated CSS files
      if (entry.css && Array.isArray(entry.css)) {
        for (const cssFile of entry.css) {
          const cssFilePath = path.join(distDir, cssFile);
          if (!fs.existsSync(cssFilePath)) {
            logError(`Vite manifest references CSS file that does not exist: '${cssFile}' (source key: '${key}')`);
          }
        }
      }

      // Check imports
      if (entry.imports && Array.isArray(entry.imports)) {
        for (const importKey of entry.imports) {
          if (!viteManifest[importKey]) {
            logError(`Vite manifest references import key '${importKey}' which is missing from manifest (source key: '${key}')`);
          }
        }
      }
    }
    console.log(`📦 Verified ${manifestFilesCount} files and dependencies from Vite build manifest.`);
  }

  // Backup regex-based scan for any orphaned files in assets
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    console.log(`📦 Performed integrity check on ${jsFiles.length} JavaScript files in dist/assets/.`);

    // Scan JS files for dynamic import references
    const importRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
    for (const jsFile of jsFiles) {
      const jsPath = path.join(assetsDir, jsFile);
      const jsContent = fs.readFileSync(jsPath, 'utf-8');
      
      let importMatch;
      while ((importMatch = importRegex.exec(jsContent)) !== null) {
        const importPath = importMatch[1];
        if (importPath.startsWith('./') || importPath.startsWith('/assets/')) {
          const targetName = path.basename(importPath);
          const targetPath = path.join(assetsDir, targetName);
          if (!fs.existsSync(targetPath)) {
            logError(`Dynamic import in '${jsFile}' references non-existent chunk '${importPath}'`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Static build verification FAILED with ${errors.length} error(s).`);
    process.exit(1);
  } else {
    console.log('✅ Static build verification PASSED successfully! All assets and redirects verified.\n');
  }
}

verifyBuild();
