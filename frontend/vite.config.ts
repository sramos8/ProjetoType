import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://44.223.65.79:3333',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});