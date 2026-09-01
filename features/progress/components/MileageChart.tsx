import { View } from 'react-native';

import { AppText } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { MileageMonth } from '../types/progress';

export interface MileageChartProps {
  data: MileageMonth[];
}

const CHART_HEIGHT = 60;

/**
 * Monthly bike mileage bars — heights scaled relative to the tallest
 * month in `data` (not a fixed max), matching the design source's
 * `Math.max(...pd.mileage)` normalization. The most recent month is
 * highlighted in accent, matching the source; every other month is
 * neutral.
 */
export function MileageChart({ data }: MileageChartProps) {
  const colors = useThemeColors();
  const maxMiles = Math.max(...data.map((m) => m.miles));

  return (
    <View className="flex-row items-end gap-sm" style={{ height: CHART_HEIGHT }}>
      {data.map((month, i) => {
        const isLast = i === data.length - 1;
        const heightPct = Math.round((month.miles / maxMiles) * 100);
        return (
          <View key={month.label} className="h-full flex-1 items-center justify-end gap-[6px]">
            <View
              className="w-full rounded-[3px]"
              style={{
                height: `${heightPct}%`,
                minHeight: 3,
                backgroundColor: isLast ? colors.accent : colors.neutral[100],
              }}
            />
            <AppText mono className="text-[9px] text-color-quaternary">
              {month.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
