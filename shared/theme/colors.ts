/**
 * Color tokens ported verbatim from `design/Triathlon Coach App.dc.html`
 * (the approved Claude Design export for Pace).
 *
 * This is the single source of truth: `tailwind.config.js` imports this
 * file directly rather than redefining these values, and components that
 * need a raw color value (SVG stroke/fill props, RN shadow colors, etc.,
 * where a Tailwind className can't reach) import it too.
 */

export const colors = {
  // Screen / surface backgrounds
  background: '#FFFFFF',
  surface: '#FAFAF9',
  'surface-dark': '#111318',
  'surface-dark-alt': '#0E1015',
  tint: '#EEF0FC',

  // Brand accent
  accent: '#4338CA',
  'accent-pressed': '#312E9A',

  // Status
  success: '#059669',
  'success-strong': '#10B981',
  'success-bg': '#ECFDF5',
  danger: '#DC2626',

  // Hairlines / borders (four close variants, used in different places in the source)
  border: '#F1F1EF',
  'border-strong': '#EAEAE7',
  'border-soft': '#F0F0EE',
  'border-faint': '#EEEEEC',

  // Neutral scale (inactive dots/tracks/disabled labels)
  neutral: {
    100: '#E4E4E0',
    200: '#D8D8D3',
    300: '#C4C4BE',
    400: '#D4D4D0',
  },

  // Foreground/text colors — nested under `color` so Tailwind's `text-color-*`
  // can't collide with the `text-*` typography scale (fontSize tokens),
  // which shares the same `text-` class prefix.
  color: {
    primary: '#111318',
    secondary: '#5B6069',
    tertiary: '#9AA0AB',
    quaternary: '#B4B8BF',
    inverse: '#FFFFFF',
    'inverse-secondary': '#8A90A0',
  },

  // Per-discipline / workout-zone colors
  sport: {
    swim: '#1D4ED8',
    strength: '#64748B',
    bike: '#7C3AED',
    run: '#EA580C',
    rest: '#9CA3AF',
  },
} as const;

export type Colors = typeof colors;
