import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { gymmySqlitePlugin } from './server/vitePlugin.ts';
import { THEMES } from './src/theme/themes.ts';
import { themeStylesheet } from './src/theme/themeCss.ts';

// Puts the theme tokens in <head>, so the first paint already has the right colors.
function themeTokensPlugin(): Plugin {
  return {
    name: 'gymmy-theme-tokens',
    transformIndexHtml: () => [
      { tag: 'style', attrs: { id: 'theme-tokens' }, children: themeStylesheet(Object.values(THEMES)), injectTo: 'head' }
    ]
  };
}

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
    open: true
  }
});
