import { View } from 'react-native';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

export interface ConsistencyGridProps {
  /**
   * 12 weekly completion percentages (0-100), oldest first. `null` for
   * a week with nothing due yet to measure (before the athlete's plan
   * existed, or -- for the current week -- before anything in it has
   * come due) -- real data as of 2026-09-01 can produce this, where the
   * original mock never did.
   */
  values: (number | null)[];
}

/**
 * 12-week completion heatmap — each square is the accent color at an
 * opacity scaled by that week's completion percentage (an 18%-90%
 * range), ported from the design source's
 * `rgba(67,56,202, 0.18 + 0.72 * pct/100)` formula. Uses RN's plain
 * `opacity` style instead of computing an rgba string, which is
 * visually equivalent for a flat background color and avoids a
 * hex-to-rgba conversion helper for this one use.
 *
 * A `null` week renders as an empty outlined square, not a filled one —
 * showing it at the same opacity as 0% would read as "attempted and
 * missed everything," which isn't what "no data yet" means.
 */
export function ConsistencyGrid({ values }: ConsistencyGridProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-row gap-[5px]">
      {values.map((pct, i) =>
        pct === null ? (
          <View
            key={i}
            className="aspect-square flex-1 rounded-[3px] border"
            style={{ borderColor: colors['border-soft'] }}
          />
        ) : (
          <View
            key={i}
            className="aspect-square flex-1 rounded-[3px]"
            style={{ backgroundColor: colors.accent, opacity: 0.18 + 0.72 * (pct / 100) }}
          />
        ),
      )}
    </View>
  );
}
