import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'build/**',
      'node_modules/**',
      'src/scss/style.scss',
    ],
  },

  js.configs.recommended,

  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        autosize: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
];
