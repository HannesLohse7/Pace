/**
 * `shared/theme/{colors,spacing}.ts` are the single source of truth for
 * these tokens — this file imports and reprojects them into Tailwind's
 * expected shape rather than redefining values inline. (Node's built-in
 * TypeScript type-stripping lets this plain .js config `require()` a .ts
 * file directly, as long as it only uses erasable syntax like `as const`.)
 */
const { colors } = require('./shared/theme/colors.ts');
const { spacing: spacingTokens } = require('./shared/theme/spacing.ts');

const spacing = Object.fromEntries(
  Object.entries(spacingTokens).map(([key, value]) => [key, `${value}px`])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './features/**/*.{js,jsx,ts,tsx}', './shared/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      spacing,

      // Typography scale — size/line-height/letter-spacing/weight only.
      // Font *family* (system vs. monospace) is a separate axis, handled by
      // the shared AppText component, so it isn't baked into these tokens.
      fontSize: {
        // display/heading family
        display: ['29px', { lineHeight: '1.12', letterSpacing: '-0.6px', fontWeight: '700' }],
        'heading-1': ['27px', { lineHeight: '1.12', letterSpacing: '-0.6px', fontWeight: '700' }],
        'heading-2': ['18px', { lineHeight: '1.2', letterSpacing: '-0.2px', fontWeight: '700' }],

        // body family
        body: ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['13.5px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['14.5px', { lineHeight: '1.3', fontWeight: '600' }],
        // primary button label (e.g. "Start Workout") — distinct from `label` above
        'label-lg': ['15px', { fontWeight: '600' }],

        // caption / metadata family
        caption: ['12.5px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-sm': ['12px', { lineHeight: '1.4', fontWeight: '400' }],

        // section eyebrows (e.g. "COMING UP", "TODAY · BIKE")
        eyebrow: ['12px', { letterSpacing: '0.3px', fontWeight: '600' }],
        'eyebrow-sm': ['11px', { letterSpacing: '1px', fontWeight: '600' }],

        // small uppercase unit/meta labels (e.g. "DAYS", zone labels, tab labels)
        micro: ['10px', { letterSpacing: '0.4px', fontWeight: '600' }],
        'micro-sm': ['9.5px', { letterSpacing: '0.1px', fontWeight: '600' }],

        // standalone numeric stats
        stat: ['42px', { lineHeight: '1', letterSpacing: '-1px', fontWeight: '700' }],
        'stat-sm': ['15px', { fontWeight: '700' }],

        // inline figures (durations, etc.)
        value: ['13px', { fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};
