import type { TextStyle } from 'react-native';

/**
 * Typography tokens ported from `design/Triathlon Coach App.dc.html`.
 *
 * Single source of truth: `tailwind.config.js` imports this file and
 * reprojects each entry into Tailwind's fontSize tuple shape rather than
 * redefining the values inline — the same pattern used for colors.ts and
 * spacing.ts.
 *
 * `fontSize`/`letterSpacing` are unitless px numbers and `lineHeight` is a
 * unitless multiplier relative to `fontSize` (matching CSS's own
 * convention, and how the source itself expresses line-height), so this
 * file is directly usable both by Tailwind (which wants CSS-style values)
 * and by raw RN style objects via `textStyle()` below (RN's `lineHeight`
 * style prop wants an absolute number, not a multiplier).
 *
 * Font *family* (system vs. monospace) is a separate axis, handled by the
 * shared AppText component, so it isn't part of these tokens.
 */

export interface TypographyToken {
  fontSize: number;
  /** Unitless multiplier relative to fontSize, e.g. 1.12 — omitted where the source doesn't specify one. */
  lineHeight?: number;
  /** px */
  letterSpacing?: number;
  fontWeight: '400' | '600' | '700';
}

export const typography = {
  // display/heading family
  display: { fontSize: 29, lineHeight: 1.12, letterSpacing: -0.6, fontWeight: '700' },
  'heading-1': { fontSize: 27, lineHeight: 1.12, letterSpacing: -0.6, fontWeight: '700' },
  'heading-2': { fontSize: 18, lineHeight: 1.2, letterSpacing: -0.2, fontWeight: '700' },

  // body family
  body: { fontSize: 14, lineHeight: 1.6, fontWeight: '400' },
  'body-sm': { fontSize: 13.5, lineHeight: 1.5, fontWeight: '400' },
  label: { fontSize: 14.5, lineHeight: 1.3, fontWeight: '600' },
  // primary button label (e.g. "Start Workout") — distinct from `label` above
  'label-lg': { fontSize: 15, fontWeight: '600' },

  // caption / metadata family
  caption: { fontSize: 12.5, lineHeight: 1.4, fontWeight: '400' },
  'caption-sm': { fontSize: 12, lineHeight: 1.4, fontWeight: '400' },

  // section eyebrows (e.g. "COMING UP", "TODAY · BIKE")
  eyebrow: { fontSize: 12, letterSpacing: 0.3, fontWeight: '600' },
  'eyebrow-sm': { fontSize: 11, letterSpacing: 1, fontWeight: '600' },

  // small uppercase unit/meta labels (e.g. "DAYS", zone labels, tab labels)
  micro: { fontSize: 10, letterSpacing: 0.4, fontWeight: '600' },
  'micro-sm': { fontSize: 9.5, letterSpacing: 0.1, fontWeight: '600' },

  // standalone numeric stats
  stat: { fontSize: 42, lineHeight: 1, letterSpacing: -1, fontWeight: '700' },
  'stat-sm': { fontSize: 15, fontWeight: '700' },

  // inline figures (durations, etc.)
  value: { fontSize: 13, fontWeight: '400' },
} as const satisfies Record<string, TypographyToken>;

export type TypographyTokenName = keyof typeof typography;

/** Resolves a token into a ready-to-spread RN TextStyle (absolute lineHeight, not a multiplier). */
export function textStyle(token: TypographyTokenName): TextStyle {
  const t: TypographyToken = typography[token];
  return {
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    ...(t.letterSpacing !== undefined && { letterSpacing: t.letterSpacing }),
    ...(t.lineHeight !== undefined && { lineHeight: t.fontSize * t.lineHeight }),
  };
}
