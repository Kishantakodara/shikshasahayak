import { normalizeGtuPyqUrl } from './gtuPyq';

/**
 * Helper function to trigger programmatic PDF download with custom filename appended with "- By ShikshaSahayak.pdf"
 */
export async function downloadPdfFile(url: string, rawTitle?: string) {
  if (!url) return;

  // Auto-normalize any legacy GTU URLs to the new archive format
  const normalized = normalizeGtuPyqUrl(url);

  const baseTitle = rawTitle && rawTitle.trim() ? rawTitle.trim() : 'Study Material';
  
  // Clean filename: remove illegal file characters
  let cleanName = baseTitle.replace(/[/\\?%*:|"<>]/g, '').trim();
  
  // Strip .pdf if already in title
  if (cleanName.toLowerCase().endsWith('.pdf')) {
    cleanName = cleanName.substring(0, cleanName.length - 4);
  }

  // Append "- By ShikshaSahayak"
  if (!cleanName.toLowerCase().includes('by padhaku portal')) {
    cleanName = `${cleanName} - By ShikshaSahayak`;
  }
  const filename = `${cleanName}.pdf`;

  // 1. Prepare target URL: append download=1 parameter if local storage/api endpoint
  let targetUrl = normalized;
  if (targetUrl.startsWith('/') || targetUrl.includes(window.location.origin) || targetUrl.includes('/api/storage/')) {
    try {
      const parsed = new URL(targetUrl, window.location.origin);
      parsed.searchParams.set('download', '1');
      parsed.searchParams.set('disposition', 'attachment');
      targetUrl = parsed.toString();
    } catch {}
  }

  // 2. Try direct CORS blob download
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    // Force application/octet-stream blob to guarantee save-to-disk rather than browser tab opening
    const downloadBlob = new Blob([blob], { type: 'application/octet-stream' });
    const blobUrl = window.URL.createObjectURL(downloadBlob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    return;
  } catch (error) {
    console.warn('Direct blob fetch failed, routing via download proxy:', error);
  }

  // 3. Fallback for cross-origin external URLs (e.g. gtu.ac.in): Proxy via backend Cloudflare worker
  try {
    const proxyUrl = `/api/materials/download?url=${encodeURIComponent(url)}&title=${encodeURIComponent(filename)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      const downloadBlob = new Blob([blob], { type: 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      return;
    }
  } catch (err) {
    console.warn('Proxy download failed:', err);
  }

  // 4. Final Fallback: Hidden iframe download trigger (prevents main page redirect)
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = targetUrl;
  document.body.appendChild(iframe);
  setTimeout(() => document.body.removeChild(iframe), 6000);
}

/**
 * Helper to generate a PDF source URL suitable for inline previews.
 * On mobile Android devices, it routes via Google Docs Viewer to render inline.
 * On iOS and desktop browsers, it renders directly in the standard PDF iframe viewer.
 */
export function getEmbeddedPdfUrl(url: string): string {
  if (!url) return '';
  const clean = normalizeGtuPyqUrl(url);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

  // Android Chrome/mobile browsers other than iOS native preview require Google Docs Viewer
  if (isMobile && !isIOS && !isLocalhost) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(clean)}&embedded=true`;
  }
  return `${clean}#toolbar=0&navpanes=0`;
}
