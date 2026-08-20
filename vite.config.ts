import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isPolli = mode === 'polli';
  return {
    root: '.',
    publicDir: 'public',
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@data': path.join(__dirname, 'src', 'data'),
        '@systems': path.join(__dirname, 'src', 'systems'),
        '@components': path.join(__dirname, 'src', 'components'),
        '@scenes': path.join(__dirname, 'src', 'scenes'),
        '@utils': path.join(__dirname, 'src', 'utils'),
      },
    },
    build: {
      outDir: `dist/${isPolli ? 'polli' : 'standard'}`,
      sourcemap: true,
      minify: 'esbuild',
      esbuildOptions: { drop: ['console', 'debugger'] },
      rollupOptions: {
        input: {
          main: isPolli ? 'src/main-polli.ts' : 'src/main-standard.ts'
        }
      }
    },
    define: {
      'import.meta.env.VITE_POLLI_VERSION': JSON.stringify(isPolli ? 'polli' : 'standard')
    },
    optimizeDeps: { include: ['phaser'] },
    server: { port: 3000, open: true }
  };
});
