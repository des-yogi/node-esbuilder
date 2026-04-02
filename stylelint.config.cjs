module.exports = {
  extends: [
    'stylelint-config-standard-scss',
  ],
  customSyntax: 'postcss-scss',
  ignoreFiles: [
    'build/**',
    'src/scss/style.scss',
    '**/*.min.css',
  ],
  rules: {
    'selector-class-pattern': null,
    'no-empty-source': null,
  },
};