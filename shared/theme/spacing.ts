/**
 * Spacing tokens ported from `design/Triathlon Coach App.dc.html`.
 *
 * Single source of truth: `tailwind.config.js` imports this file and
 * appends the `px` unit itself when building the Tailwind spacing scale.
 * Values here stay unitless numbers since that's what RN style props and
 * SVG layout math consume directly.
 *
 * Genuine one-off values in the source (e.g. a lone 7px gap) aren't forced
 * into named tokens here — those stay as arbitrary bracket classes where
 * they show up, since not every incidental value earns a scale name.
 */

export const spacing = {
  '2xs': 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  'screen-x': 24,
  'screen-top': 58,
  'screen-bottom': 20,
} as const;

export type Spacing = typeof spacing;
