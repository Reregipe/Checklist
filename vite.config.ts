import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  base: '/Checklist/',
  plugins: [react()],
  server: {
    proxy: {
      '/excel': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
