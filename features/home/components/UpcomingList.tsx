import { Pressable, View } from 'react-native';

import { AppText, SportDot } from '@/shared/components';

import type { UpcomingWorkoutItem } from '../types/home';

export interface UpcomingListProps {
  items: UpcomingWorkoutItem[];
  onPressItem?: (item: UpcomingWorkoutItem) => void;
}

/** "Coming Up" — the athlete's upcoming sessions. */
export function UpcomingList({ items, onPressItem }: UpcomingListProps) {
  return (
    <View className="mt-2xl">
      <AppText className="mb-[2px] px-screen-x text-eyebrow text-color-tertiary">COMING UP</AppText>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onPressItem?.(item)}
          className="flex-row items-start gap-[14px] border-t border-border px-screen-x py-md"
        >
          <AppText mono className="w-9 pt-[2px] text-[11px] font-semibold text-color-tertiary">
            {item.short}
          </AppText>
          <SportDot color={item.color} className="mt-[6px]" />
          <View className="flex-1">
            <View className="flex-row items-baseline gap-sm">
              <AppText className="text-label text-color-primary">{item.title}</AppText>
              <AppText mono className="text-micro" style={{ color: item.color }}>
                {item.zoneLabel}
              </AppText>
            </View>
            <AppText className="mt-[3px] text-caption text-color-tertiary">{item.purpose}</AppText>
          </View>
          <AppText mono className="pt-[2px] text-caption-sm text-color-tertiary">
            {item.duration}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
