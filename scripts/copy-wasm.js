#!/usr/bin/env node
// Copies MediaPipe Tasks Vision WASM assets from node_modules into public/
// so they are served from our own origin (no external CDN — spec §2.7, §8.14).
// Runs automatically after `npm install` / `npm ci` via the postinstall hook.

import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const dest = resolve(root, 'public/mediapipe-vision/wasm');

if (!existsSync(src)) {
  console.error('copy-wasm: @mediapipe/tasks-vision not found in node_modules (run npm install first)');
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
for (const file of readdirSync(src)) {
  copyFileSync(resolve(src, file), resolve(dest, file));
}
console.log(`copy-wasm: copied MediaPipe WASM assets to public/mediapipe-vision/wasm/`);
