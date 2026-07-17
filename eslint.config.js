// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // design/ is a vendored copy of the Claude Design export's own preview
    // harness (image-slot.js, ios-frame.jsx, support.js) — third-party
    // reference tooling, not application source, so it's not linted here.
    ignores: ['dist/*', 'design/*'],
  },
]);
