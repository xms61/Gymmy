import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { gymmySqlitePlugin } from './server/vitePlugin.ts';
import { THEME_STORAGE_KEY, THEMES } from './src/theme/themes.ts';
import { themeBootScript, themeStylesheet } from './src/theme/themeCss.ts';

// Puts the theme tokens and the stored theme choice in <head>, so the first paint already has
// the right colors.
function themeTokensPlugin(): Plugin {
  const themes = Object.values(THEMES);
  return {
    name: 'gymmy-theme-tokens',
    transformIndexHtml: () => [
      { tag: 'style', attrs: { id: 'theme-tokens' }, children: themeStylesheet(themes), injectTo: 'head' },
      { tag: 'script', children: themeBootScript(themes, THEME_STORAGE_KEY), injectTo: 'head' }
    ]
  };
}

// data/ holds the real training history, and Vite would otherwise serve it as a static file.
// Setting fs.deny replaces Vite's defaults, so they are listed again.
const DATA_DIR = fileURLToPath(new URL('./data', import.meta.url));
const DENIED_FILES = ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', `${DATA_DIR}/**`];

// Another site could load the app in a hidden frame, where its requests count as same-origin.
const NO_FRAMING = { 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gymmySqlitePlugin(), themeTokensPlugin()],
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
