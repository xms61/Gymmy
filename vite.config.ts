import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { gymmySqlitePlugin } from './server/vitePlugin.ts';
import { DESIGN } from './src/theme/tokens.ts';
import { tokenStylesheet } from './src/theme/tokensCss.ts';

// Puts the design tokens in <head>, so the first paint already has the right colors.
function designTokensPlugin(): Plugin {
  return {
    name: 'gymmy-design-tokens',
    transformIndexHtml: () => [{ tag: 'style', attrs: { id: 'design-tokens' }, children: tokenStylesheet(DESIGN), injectTo: 'head' }]
  };
}

// data/ holds the real training history and the access key, and Vite would otherwise serve it as a
// static file. Setting fs.deny replaces Vite's defaults, so they are listed again. The patterns are
// globs, which need forward slashes: a Windows path with backslashes matches nothing.
const DATA_DIR = normalizePath(fileURLToPath(new URL('./data', import.meta.url)));
const DENIED_FILES = ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', `${DATA_DIR}/**`];

// Another site could load the app in a hidden frame, where its requests count as same-origin.
const NO_FRAMING = { 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gymmySqlitePlugin(), designTokensPlugin()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: false,
    headers: NO_FRAMING,
    fs: { deny: DENIED_FILES }
  },
  preview: {
    headers: NO_FRAMING
  }
});
