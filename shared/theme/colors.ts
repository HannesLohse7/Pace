/**
 * Color tokens ported verbatim from `design/Triathlon Coach App.dc.html`
 * (the approved Claude Design export for Pace).
 *
 * This is the single source of truth: `tailwind.config.js` imports this
 * file directly rather than redefining these values, and components that
 * need a raw color value (SVG stroke/fill props, RN shadow colors, etc.,
 * where a Tailwind className can't reach) import it too.
 *
 * `docs/PROJECT_RULES.md` requires dark mode support "from day one," so
 * `darkColors` scaffolds a dark equivalent for every light token below —
 * `ColorPalette` enforces both palettes share the exact same shape, so
 * either can be swapped in wherever `colors` is used today. These are
 * first-pass, reasonable values, not a finished design pass; treat them
 * as placeholders pending real dark-mode design review. Runtime light/dark
 * switching is NOT wired up anywhere yet — `colors` still resolves to
 * `lightColors` unconditionally, so nothing about the current UI changes.
 * That wiring is a future milestone.
 */

export interface ColorPalette {
  // Screen / surface backgrounds
  background: string;
  surface: string;
  'surface-dark': string;
  'surface-dark-alt': string;
  tint: string;

  // Brand accent
  accent: string;
  'accent-pressed': string;

  // Status
  success: string;
  'success-strong': string;
  'success-bg': string;
  danger: string;

  // Hairlines / borders
  border: string;
  'border-strong': string;
  'border-soft': string;
  'border-faint': string;

  // Neutral scale (inactive dots/tracks/disabled labels)
  neutral: {
    100: string;
    200: string;
    300: string;
    400: string;
  };

  // Foreground/text colors — nested under `color` so Tailwind's `text-color-*`
  // can't collide with the `text-*` typography scale (fontSize tokens),
  // which shares the same `text-` class prefix.
  color: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    inverse: string;
    'inverse-secondary': string;
  };

  // Per-discipline / workout-zone colors
  sport: {
    swim: string;
    strength: string;
    bike: string;
    run: string;
    rest: string;
  };
}

export const lightColors = {
  background: '#FFFFFF',
  surface: '#FAFAF9',
  'surface-dark': '#111318',
  'surface-dark-alt': '#0E1015',
  tint: '#EEF0FC',

  accent: '#4338CA',
  'accent-pressed': '#312E9A',

  success: '#059669',
  'success-strong': '#10B981',
  'success-bg': '#ECFDF5',
  danger: '#DC2626',

  // (four close variants, used in different places in the source)
  border: '#F1F1EF',
  'border-strong': '#EAEAE7',
  'border-soft': '#F0F0EE',
  'border-faint': '#EEEEEC',

  neutral: {
    100: '#E4E4E0',
    200: '#D8D8D3',
    300: '#C4C4BE',
    400: '#D4D4D0',
  },

  color: {
    primary: '#111318',
    secondary: '#5B6069',
    tertiary: '#9AA0AB',
    quaternary: '#B4B8BF',
    inverse: '#FFFFFF',
    'inverse-secondary': '#8A90A0',
  },

  sport: {
    swim: '#1D4ED8',
    strength: '#64748B',
    bike: '#7C3AED',
    run: '#EA580C',
    rest: '#9CA3AF',
  },
} as const satisfies ColorPalette;

export const darkColors = {
  background: '#0B0C0F',
  surface: '#15171C',
  'surface-dark': '#000000',
  'surface-dark-alt': '#000000',
  tint: '#1E2140',

  // Kept identical to light: it's the brand color, not a neutral, and
  // #4338CA has enough contrast on both white and near-black. Revisit if
  // real dark-mode contrast testing says otherwise.
  accent: '#4338CA',
  'accent-pressed': '#312E9A',

  success: '#10B981',
  'success-strong': '#10B981',
  'success-bg': '#0F2A22',
  danger: '#DC2626',

  // Dark-theme hairlines are a low-opacity light-on-dark, not the light
  // theme's near-white grays
  border: '#2A2D33',
  'border-strong': '#34373E',
  'border-soft': '#24262B',
  'border-faint': '#1E2025',

  neutral: {
    100: '#2A2D33',
    200: '#34373E',
    300: '#4A4E58',
    400: '#3A3D44',
  },

  color: {
    primary: '#F2F3F5',
    secondary: '#A6ACB8',
    tertiary: '#7C8493',
    quaternary: '#5B6069',
    inverse: '#FFFFFF',
    'inverse-secondary': '#9099AC',
  },

  // Kept identical to light for the same reason as accent: these are
  // semantic/brand identifiers meant to be recognizable regardless of theme.
  sport: {
    swim: '#1D4ED8',
    strength: '#64748B',
    bike: '#7C3AED',
    run: '#EA580C',
    rest: '#9CA3AF',
  },
} as const satisfies ColorPalette;

export type ColorScheme = 'light' | 'dark';

export const colorSchemes = { light: lightColors, dark: darkColors } as const;

/** Currently always the light palette — see file header. */
export const colors = lightColors;

export type Colors = typeof colors;
