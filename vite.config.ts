import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// Tauri sets these env vars when it invokes Vite via beforeDevCommand /
// beforeBuildCommand. When present, we tune for Tauri:
//   - skip vite-plugin-pwa (no service worker — Tauri loads from a custom
//     protocol where SWs are unnecessary and can interfere)
//   - skip sourcemaps in release for a smaller bundle
//   - bind the dev server to a fixed port that tauri.conf.json points at
const isTauri = !!process.env.TAURI_ENV_PLATFORM;
const isTauriDebug = process.env.TAURI_ENV_DEBUG === 'true';

export default defineConfig({
  plugins: [
    react(),
    ...(isTauri
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'MIDI Surface',
              short_name: 'MIDI Surface',
              description:
                'Touch-first MIDI control surface — Vital-inspired, sends MIDI to FL Studio / Ableton via loopMIDI.',
              theme_color: '#0a0a14',
              background_color: '#0a0a14',
              display: 'fullscreen',
              display_override: ['fullscreen', 'standalone'],
              orientation: 'landscape',
              start_url: '/',
              scope: '/',
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                {
                  src: 'icons/icon-512-maskable.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
            },
            devOptions: { enabled: false },
          }),
        ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Vite expects the dev server here; Tauri's WebView points at this URL too.
  clearScreen: false,
  server: {
    host: false,
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: !isTauri || isTauriDebug,
    minify: 'esbuild',
  },
});
