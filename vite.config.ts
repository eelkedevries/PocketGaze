import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Project Pages site served from https://<user>.github.io/PocketGaze/.
// The base path must match the public repository name.
//
// MediaPipe Tasks Vision WASM assets are copied into public/mediapipe-vision/wasm/
// by scripts/copy-wasm.js (runs via the postinstall npm hook after `npm ci`),
// so they are served from our own origin with no external CDN dependency (spec §2.7).
export default defineConfig({
  base: '/PocketGaze/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
