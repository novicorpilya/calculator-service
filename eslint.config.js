import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results', 'coverage', 'supabase/functions']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Temporarily disabled - TODO: re-enable with proper logging
      'no-console': 'off',
      'no-debugger': 'error',
      'no-alert': 'off',
      // Disable for media query pattern
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // Prettier должен быть последним
  prettierConfig,
])

