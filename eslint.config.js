import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Accessibility is a build error here, not a code review opinion. The jsx-a11y
// preset is applied to every TSX file so an aria-hidden misuse cannot be merged.
const jsxA11yRules = jsxA11y.flatConfigs?.recommended?.rules ?? jsxA11y.configs.recommended.rules;

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'storybook-static/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11yRules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.mjs', '*.config.{ts,js}'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
  {
    files: ['.storybook/**/*.{ts,tsx}'],
    rules: { 'no-console': 'off' },
  },
]);
