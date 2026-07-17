import { View } from 'react-native';

import { AppText, SportDot } from '@/shared/components';
import { colors } from '@/shared/theme/colors';

import type { WeekDayState, WeekDayStatus } from '../types/home';

export interface WeekStripProps {
  days: WeekDayStatus[];
  summary: string;
}

function styleFor(state: WeekDayState) {
  switch (state) {
    case 'done':
      return {
        dotColor: colors.color.primary,
        textColor: colors.color.primary,
        weight: '500' as const,
      };
    case 'today':
      return { dotColor: colors.accent, textColor: colors.accent, weight: '700' as const };
    case 'upcoming':
      return {
        dotColor: colors.neutral[100],
        textColor: colors.neutral[300],
        weight: '500' as const,
      };
  }
}

/** Training status / week-at-a-glance strip. */
export function WeekStrip({ days, summary }: WeekStripProps) {
  return (
    <View className="mt-2xl px-screen-x">
      <View className="flex-row justify-between">
        {days.map((day) => {
          const { dotColor, textColor, weight } = styleFor(day.state);
          return (
            <View key={day.id} className="items-center gap-[7px]">
              <SportDot color={dotColor} size={9} />
              <AppText
                mono
                className="text-[10px]"
                style={{ color: textColor, fontWeight: weight }}
              >
                {day.letter}
              </AppText>
            </View>
          );
        })}
      </View>
      <AppText className="mt-sm text-caption-sm text-color-tertiary">{summary}</AppText>
    </View>
  );
}
