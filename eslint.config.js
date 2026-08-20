export default [
  { ignores: ['dist/', 'node_modules/', 'assets/atlases/'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { project: './tsconfig.json' }
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
