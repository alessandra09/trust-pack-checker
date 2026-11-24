import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      // Allows dropping fields with { a: _a, ...rest } without a helper.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // /src/core must stay pure: no DOM, no React, so it runs in Node for tests and eval.
    files: ['src/core/**/*.ts'],
    languageOptions: { globals: { ...globals.es2023 } },
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage'],
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', '*/app/*', '*/components/*'] },
      ],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['eval/**/*.ts', 'scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
)
