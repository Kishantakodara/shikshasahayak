import { compress } from '@quicktoolsone/pdf-compress';

/**
 * Compresses a PDF file using client-side compression.
 * Returns the original file if compression fails or if it's not a PDF.
 */
export async function compressPdfFile(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<File> {
  // Only compress if the file is explicitly a PDF
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return file;
  }

  try {
    const buffer = await file.arrayBuffer();

    const result = await compress(buffer, {
      preset: 'max', // Maximum compression (typically 60-90% reduction)
      targetDPI: 90, // Force downsampling to 90 DPI for high compression ratio
      jpegQuality: 0.35, // Force 35% JPEG quality to achieve 60-70% space savings
      onProgress: (event) => {
        if (onProgress) {
          onProgress(event.progress, event.message || 'Compressing...');
        }
      },
    });

    // Reconstruct the file from the compressed buffer
    const blob = new Blob([result.pdf], { type: 'application/pdf' });
    const compressedFile = new File([blob], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    const savedPercentage = ((file.size - compressedFile.size) / file.size) * 100;
    console.log(`PDF Compression: Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB -> Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB (Saved ${savedPercentage.toFixed(1)}%)`);

    return compressedFile;
  } catch (error) {
    console.error('PDF compression failed, uploading original:', error);
    // If it fails (e.g. out of memory on very large file), fail gracefully and return original
    return file;
  }
}
