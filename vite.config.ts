/**
 * Vite configuration for Pibble & Nibble.
 *
 * Uses @tailwindcss/vite for zero-config Tailwind v4 integration —
 * no postcss.config or tailwind.config file required.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

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
})
