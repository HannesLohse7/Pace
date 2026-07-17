/**
 * RN shadow presets ported from `design/Triathlon Coach App.dc.html`.
 *
 * These have no Tailwind counterpart to de-duplicate: NativeWind can't
 * reliably express arbitrary colored CSS box-shadow as RN's separate
 * shadowColor/shadowOffset/shadowOpacity/shadowRadius (+ Android elevation)
 * props, so these are consumed directly as RN style objects instead of
 * Tailwind classNames. This file is the only place they're defined.
 *
 * Mobile has no CSS `:hover` — the source's hover-elevated card shadow
 * (0 4px 16px rgba(17,19,24,0.06)) has no touch equivalent, so `card` uses
 * the resting-state shadow only (0 1px 2px rgba(17,19,24,0.03)).
 */

export const shadows = {
  card: {
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

export type Shadows = typeof shadows;
