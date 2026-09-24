import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { gymmySqlitePlugin } from './vite-plugin-sqlite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gymmySqlitePlugin()],
  server: {
    port: 3000,
    open: true
  }
});
