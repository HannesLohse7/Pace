/**
 * `shared/theme/{colors,spacing,typography}.ts` are the single source of
 * truth for these tokens — this file imports and reprojects them into
 * Tailwind's expected shape rather than redefining values inline. (Node's
 * built-in TypeScript type-stripping lets this plain .js config require()
 * a .ts file directly, as long as it only uses erasable syntax like
 * `as const`.)
 */
const { colors } = require('./shared/theme/colors.ts');
const { spacing: spacingTokens } = require('./shared/theme/spacing.ts');
const { typography } = require('./shared/theme/typography.ts');

const spacing = Object.fromEntries(
  Object.entries(spacingTokens).map(([key, value]) => [key, `${value}px`]),
);

const fontSize = Object.fromEntries(
  Object.entries(typography).map(([key, token]) => [
    key,
    [
      `${token.fontSize}px`,
      {
        ...(token.lineHeight !== undefined && { lineHeight: String(token.lineHeight) }),
        ...(token.letterSpacing !== undefined && { letterSpacing: `${token.letterSpacing}px` }),
        fontWeight: token.fontWeight,
      },
    ],
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      spacing,
      fontSize,
    },
  },
  plugins: [],
};
