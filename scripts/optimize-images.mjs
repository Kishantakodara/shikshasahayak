import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = 'public';

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  // Keep original extension files, but generate WebP counterpart
  const webpPath = filePath.replace(ext, '.webp');
  const stats = fs.statSync(filePath);

  // If optimized version is newer, skip
  if (fs.existsSync(webpPath) && fs.statSync(webpPath).mtimeMs >= stats.mtimeMs) return;

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    if (metadata.format === 'svg') return;

    // Resize if wider than 1200px (standard screen size for poster/illustration)
    const resized = metadata.width > 1200
      ? image.resize(1200, Math.round(metadata.height * (1200 / metadata.width)))
      : image;

    await resized.webp({ quality: 80, effort: 4 }).toFile(webpPath);
    const saved = stats.size - fs.statSync(webpPath).size;
    console.log(`✓ WebP: ${path.basename(filePath)} → ${path.basename(webpPath)} (${(stats.size / 1024).toFixed(1)}KB → ${(fs.statSync(webpPath).size / 1024).toFixed(1)}KB, saved ${(saved / 1024).toFixed(1)}KB)`);

    // Generate small favicons from logo.png to prevent large favicon downloads
    if (filePath.endsWith('logo.png')) {
      await sharp(filePath).resize(32, 32).png().toFile(path.join(path.dirname(filePath), 'favicon-32x32.png'));
      await sharp(filePath).resize(16, 16).png().toFile(path.join(path.dirname(filePath), 'favicon-16x16.png'));
      console.log('✓ Favicons generated: favicon-32x32.png and favicon-16x16.png');
    }
  } catch (err) {
    console.error(`✗ Error optimizing ${filePath}:`, err.message);
  }
}

async function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else if (entry.isFile() && /\.(png|jpg|jpeg)$/i.test(entry.name)) {
      await optimizeImage(fullPath);
    }
  }
}

console.log('Optimizing images and converting to WebP...');
walkDir(PUBLIC_DIR).then(() => console.log('Image optimization complete!'));
