import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';

import { buildCssVars, colorSchemes, type ColorPalette } from './colors';

const ThemeColorsContext = createContext<ColorPalette | null>(null);

/**
 * Resolves light/dark exclusively from React Native's `useColorScheme()`
 * (OS-level preference) — no manual toggle yet, since that belongs in
 * Profile settings, which doesn't exist until later in Milestone 3.
 *
 * Two things happen here, both driven by the same resolved palette:
 * 1. NativeWind CSS variables (`vars()`) are applied on a root wrapping
 *    View, so every existing `bg-surface`/`text-color-primary`/etc.
 *    className keeps working completely unchanged — `tailwind.config.js`
 *    registers those tokens as `rgb(var(--color-...))` references rather
 *    than baked-in hex values, so they resolve against whichever palette
 *    is currently in scope here.
 * 2. The resolved palette object is exposed via context (`useThemeColors`)
 *    for call sites that need a raw value in a `style` prop instead of a
 *    className — SVG stroke/fill, RN shadow colors, conditional inline
 *    colors — where a Tailwind className can't reach.
 *
 * Chose this hybrid (CSS vars for className coverage + a context/hook for
 * everything else) over hand-pairing every className with a `dark:`
 * variant: this codebase leans heavily on inline conditional colors for
 * interactive states (selected/unselected chips, toggles, etc.), so a
 * context was needed regardless — and CSS vars mean the ~100 existing
 * color classNames across the onboarding screens and Home don't need to
 * be touched one by one to pick up dark mode.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const resolvedScheme = scheme === 'dark' ? 'dark' : 'light';
  const palette = colorSchemes[resolvedScheme];
  const cssVars = useMemo(() => vars(buildCssVars(palette)), [palette]);

  return (
    <ThemeColorsContext.Provider value={palette}>
      <View style={[{ flex: 1 }, cssVars]}>{children}</View>
    </ThemeColorsContext.Provider>
  );
}

/** The active color scheme's full palette — re-renders whenever OS appearance changes. */
export function useThemeColors(): ColorPalette {
  const ctx = useContext(ThemeColorsContext);
  if (!ctx) {
    throw new Error('useThemeColors must be used within a ThemeProvider');
  }
  return ctx;
}
