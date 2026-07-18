import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';

import { buildCssVars, colorSchemes, type ColorPalette } from './colors';

const ThemeColorsContext = createContext<ColorPalette | null>(null);

interface ThemeOverrideContextValue {
  /** True once the user has flipped Profile's Dark Mode switch on. */
  isDarkOverridden: boolean;
  setDarkOverride: (forced: boolean) => void;
}

const ThemeOverrideContext = createContext<ThemeOverrideContextValue | null>(null);

/**
 * Resolves light/dark from React Native's `useColorScheme()` (OS-level
 * preference) by default, with an optional manual override — Profile's
 * Dark Mode switch (Milestone 3 Checkpoint 1) — that forces dark
 * regardless of system preference. The override is plain `useState`, not
 * persisted (no AsyncStorage yet, matching the no-persistence-until-
 * actually-needed pattern from onboarding): it resets to "follow system"
 * on every app restart.
 *
 * Deliberately a single on/off override, not a 3-way System/Light/Dark
 * picker: the source's own Profile screen shows one binary switch row for
 * Dark Mode, and "off" already means "follow system" (there's no separate
 * "force light" state to lose access to) — flipping the switch back off
 * always returns to system-following behavior. A 3-way picker would need
 * a new segmented-control pattern the source doesn't show anywhere, for a
 * need (forcing light against a dark system preference) nothing here has
 * asked for. If that need shows up later, this extends cleanly: swap
 * `isDarkOverridden: boolean` for `override: 'system' | 'light' | 'dark'`
 * without changing how `resolvedScheme` below is derived.
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
  const [isDarkOverridden, setDarkOverride] = useState(false);
  const resolvedScheme = isDarkOverridden || scheme === 'dark' ? 'dark' : 'light';
  const palette = colorSchemes[resolvedScheme];
  const cssVars = useMemo(() => vars(buildCssVars(palette)), [palette]);

  const overrideValue = useMemo(() => ({ isDarkOverridden, setDarkOverride }), [isDarkOverridden]);

  return (
    <ThemeOverrideContext.Provider value={overrideValue}>
      <ThemeColorsContext.Provider value={palette}>
        <View style={[{ flex: 1 }, cssVars]}>{children}</View>
      </ThemeColorsContext.Provider>
    </ThemeOverrideContext.Provider>
  );
}

/** The active color scheme's full palette — re-renders whenever OS appearance or the manual override changes. */
export function useThemeColors(): ColorPalette {
  const ctx = useContext(ThemeColorsContext);
  if (!ctx) {
    throw new Error('useThemeColors must be used within a ThemeProvider');
  }
  return ctx;
}

/** Reads/sets Profile's Dark Mode override. `isDarkOverridden` is false by default (follow system). */
export function useThemeOverride(): ThemeOverrideContextValue {
  const ctx = useContext(ThemeOverrideContext);
  if (!ctx) {
    throw new Error('useThemeOverride must be used within a ThemeProvider');
  }
  return ctx;
}
