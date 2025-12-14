import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/friendly/',
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
