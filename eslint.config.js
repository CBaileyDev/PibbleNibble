// Flat ESLint config (ESLint 9 / typescript-eslint).
//
// Replaces the previous placeholder config that ignored every .ts/.tsx file
// (and therefore enforced nothing). This lints the React + TypeScript source
// with the rules that actually catch bugs in this codebase: hook dependency
// correctness, unsafe promise handling, and dead code.

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  {
    // Generated / vendored output that should never be linted.
    ignores: [
      'dist/**',
      'node_modules/**',
      'src-tauri/target/**',
      'src-tauri/gen/**',
      'supabase/functions/**', // Deno runtime — separate toolchain, not bundler-resolved.
      'coverage/**',
    ],
  },

  // Base JS + TypeScript recommended rules for all source files.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Browser app source (React + Vite).
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Allow intentionally-unused args/vars when prefixed with `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Node-context config files (Vite, Vitest, ESLint itself).
  {
    files: ['*.{js,ts}', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
)
