import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { gymmySqlitePlugin } from './server/vitePlugin.ts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gymmySqlitePlugin()],
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
