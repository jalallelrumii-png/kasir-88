
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ganti 'nexus-pos' dengan nama repository GitHub kamu jika berbeda
export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    outDir: 'dist',
  }
});
