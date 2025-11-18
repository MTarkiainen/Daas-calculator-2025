import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      // __dirname is not available in ES modules. 
      // path.resolve('.') resolves to the project root where vite.config.js is located.
      '@': path.resolve('.'),
    }
  },
});