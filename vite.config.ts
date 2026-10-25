import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';
    const buildId = Date.now().toString();

    // Write buildId to a temporary file for post-build scripts to consume
    try {
      fs.writeFileSync(path.resolve(__dirname, '.build-id'), buildId);
    } catch (err) {
      console.error('Failed to write .build-id file:', err);
    }

    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:8788',
            changeOrigin: true,
          }
        }
      },
      plugins: [
        react(),
        ...(isProd && process.env.ANALYZE ? [visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        })] : []),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(buildId)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        manifest: true,
        modulePreload: {
          polyfill: true,
        },
        minify: true,
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor';
              if (id.includes('node_modules/firebase')) return 'firebase';
              if (id.includes('node_modules/lucide-react') || id.includes('node_modules/framer-motion') || id.includes('node_modules/class-variance-authority') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'ui';
              if (id.includes('node_modules/@uiw/react-md-editor') || id.includes('node_modules/rehype-sanitize') || id.includes('node_modules/@uiw')) return 'editor';
              if (id.includes('node_modules/recharts')) return 'charts';
              if (id.includes('node_modules/pdfjs-dist') || id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/@quicktoolsone/pdf-compress')) return 'pdf';
            },
          },
        },
        chunkSizeWarningLimit: 300,
        reportCompressedSize: true,
      },
    };
});
