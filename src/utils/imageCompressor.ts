/**
 * Helper to compress images (File, Data URL, or HTMLCanvasElement) into a lightweight,
 * razor-sharp base64 string using modern WebP (with JPEG fallback).
 * Keeps text crisp and perfectly readable while maintaining payloads well under
 * database statement limits (typically 30KB - 120KB) and using 0 R2 storage.
 */

function getOptimalDataUrl(canvas: HTMLCanvasElement, quality = 0.90): string {
  try {
    const webpUrl = canvas.toDataURL('image/webp', quality);
    if (webpUrl && webpUrl.startsWith('data:image/webp')) {
      return webpUrl;
    }
  } catch {
    // Fallback if browser does not support WebP canvas export
  }
  return canvas.toDataURL('image/jpeg', 0.88);
}

export async function compressImageToBase64(
  source: File | string,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.90
): Promise<string> {
  return new Promise((resolve, reject) => {
    let srcUrl = '';
    let shouldRevoke = false;

    if (typeof source === 'string') {
      srcUrl = source;
    } else {
      srcUrl = URL.createObjectURL(source);
      shouldRevoke = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);

      let width = img.width;
      let height = img.height;

      // Scale down proportionally only if larger than maximum 1080p/2K bounds
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(typeof source === 'string' ? source : srcUrl);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background fill in case of transparency
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(getOptimalDataUrl(canvas, quality));
    };

    img.onerror = (err) => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      if (typeof source === 'string') {
        resolve(source);
      } else {
        reject(err);
      }
    };

    img.src = srcUrl;
  });
}

/**
 * Compresses an HTMLCanvasElement directly into a high-clarity base64 WebP/JPEG data URL.
 */
export function compressCanvasToBase64(
  canvas: HTMLCanvasElement,
  maxWidth = 1920,
  quality = 0.90
): string {
  let targetWidth = canvas.width;
  let targetHeight = canvas.height;

  if (targetWidth > maxWidth) {
    targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
    targetWidth = maxWidth;
  }

  // If already within bounds, directly encode to avoid unnecessary re-draw
  if (targetWidth === canvas.width && targetHeight === canvas.height) {
    return getOptimalDataUrl(canvas, quality);
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    return getOptimalDataUrl(canvas, quality);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  return getOptimalDataUrl(outputCanvas, quality);
}

