/**
 * Vite configuration for Pibble & Nibble.
 *
 * Uses @tailwindcss/vite for zero-config Tailwind v4 integration —
 * no postcss.config or tailwind.config file required.
 *
 * Tauri desktop wiring:
 *  - Dev server is pinned to port 1420 with strictPort so the Rust shell's
 *    devUrl stays stable across restarts (no port drift).
 *  - clearScreen is off so Rust compiler errors aren't wiped by Vite.
 *  - envPrefix lets Tauri-specific build env vars (e.g. TAURI_PLATFORM)
 *    flow into the client bundle alongside VITE_* vars.
 *  - Build target tracks the minimum Chromium shipped in WebView2 on
 *    Windows 11 and Safari in macOS 12+, matching bundle.macOS.minimumSystemVersion.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM)

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  server: {
    port: 1420,
    strictPort: true,
    host: '127.0.0.1',
    hmr: { host: '127.0.0.1', port: 1421 },
    watch: { ignored: ['**/src-tauri/**'] },
  },
  build: {
    target: isTauri ? ['es2022', 'chrome110', 'safari15'] : 'es2022',
    minify: 'esbuild',
    sourcemap: !isTauri,
  },
})
