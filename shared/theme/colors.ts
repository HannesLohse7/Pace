/**
 * Color tokens ported verbatim from `design/Triathlon Coach App.dc.html`
 * (the approved Claude Design export for Pace).
 *
 * This is the single source of truth: `tailwind.config.js` imports this
 * file directly rather than redefining these values, and components that
 * need a raw color value (SVG stroke/fill props, RN shadow colors, etc.,
 * where a Tailwind className can't reach) use `useThemeColors()` from
 * `./ThemeProvider` instead.
 *
 * `docs/PROJECT_RULES.md` requires dark mode support "from day one," so
 * `darkColors` scaffolds a dark equivalent for every light token below —
 * `ColorPalette` enforces both palettes share the exact same shape. These
 * are first-pass, reasonable values, not a finished design pass; treat
 * them as placeholders pending real dark-mode design review. Runtime
 * light/dark switching (system-preference only, via `useColorScheme()`)
 * is wired in `./ThemeProvider` — see that file for how `buildCssVars`/
 * `buildTailwindColorTree` below are actually used.
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

/**
 * Static light-palette export, still used by the handful of non-component
 * modules that can't call a hook (e.g. `mockHomeData.ts`) — safe there only
 * because every value those modules read (`sport.*`) is identical across
 * `lightColors`/`darkColors` by design. Everywhere else that needs a color
 * scheme's actual runtime value should use `useThemeColors()` from
 * `./ThemeProvider` instead, which resolves to the live scheme.
 */
export const colors = lightColors;

export type Colors = typeof colors;

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Recursively flattens a nested palette into `{ 'neutral-100': '#E4E4E0', 'color-primary': '#111318', ... }`. */
function flattenPalette(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'string') {
      out[flatKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(out, flattenPalette(value as Record<string, unknown>, flatKey));
    }
  }
  return out;
}

/**
 * Builds the `--color-*` CSS custom properties for a palette, as space-
 * separated RGB triplets (`"67 56 202"`, not `"#4338CA"`) so Tailwind's
 * `rgb(var(--x))` color-function syntax can consume them. Used by
 * `ThemeProvider` with NativeWind's `vars()` to make every existing
 * `bg-surface`/`text-color-primary`/etc. className resolve to the active
 * color scheme without changing any of those classNames.
 */
export function buildCssVars(palette: ColorPalette): Record<string, string> {
  const flat = flattenPalette(palette as unknown as Record<string, unknown>);
  const cssVars: Record<string, string> = {};
  for (const [key, hex] of Object.entries(flat)) {
    cssVars[`color-${key}`] = hexToRgbTriplet(hex);
  }
  return cssVars;
}

/**
 * Rebuilds `lightColors`' nested shape with every leaf replaced by a
 * `rgb(var(--color-...))` reference instead of a literal hex value — this
 * is what `tailwind.config.js` registers as `theme.extend.colors`, so
 * className color resolution happens at the CSS-variable layer (set by
 * `ThemeProvider`) instead of being baked into the bundle at build time.
 */
export function buildTailwindColorTree(): unknown {
  function walk(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const flatKey = prefix ? `${prefix}-${key}` : key;
      if (typeof value === 'string') {
        out[key] = `rgb(var(--color-${flatKey}))`;
      } else if (typeof value === 'object' && value !== null) {
        out[key] = walk(value as Record<string, unknown>, flatKey);
      }
    }
    return out;
  }
  return walk(lightColors as unknown as Record<string, unknown>);
}
