import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Project Pages site served from https://<user>.github.io/PocketGaze/.
// The base path must match the public repository name.
export default defineConfig({
  base: '/PocketGaze/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
