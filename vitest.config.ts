/**
 * Vitest configuration.
 *
 * Kept separate from vite.config.ts so the test run doesn't pull in the
 * Tailwind/React build plugins. Mirrors the `@/` path alias used by the app.
 */
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**'],
      reporter: ['text', 'html'],
    },
  },
})
