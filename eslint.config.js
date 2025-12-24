// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'build/*', 'node_modules/*'],
    settings: {
      'import/resolver': {
        typescript: {
          // Point to the project tsconfig so the resolver understands `@/*` paths
          project: './tsconfig.json',
        },
      },
    },
  },
]);
