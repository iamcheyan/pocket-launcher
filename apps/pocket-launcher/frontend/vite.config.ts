import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    proxy: { '/api': process.env.POCKET_LAUNCHER_API ?? 'http://localhost:8787' },
  },
});
