import { Pressable, View } from 'react-native';

import { AppText, PrimaryButton, SportDot } from '@/shared/components';
import { ArrowRightIcon } from '@/shared/components/icons';
import { colors } from '@/shared/theme/colors';
import { shadows } from '@/shared/theme/shadows';

import type { TodayWorkout } from '../types/home';

export interface TodayCardProps {
  workout: TodayWorkout;
  onPress?: () => void;
  onStartWorkout?: () => void;
}

/**
 * The primary/hero element of the Home Dashboard — today's workout is the
 * athlete's main daily anchor, so this card is deliberately larger and more
 * visually weighted than WeekStrip/UpcomingList/NextRaceCard (bigger
 * padding, the largest title on the screen, a shadow, and the only
 * call-to-action button), matching the source exactly rather than sizing
 * it as "just another card".
 */
export function TodayCard({ workout, onPress, onStartWorkout }: TodayCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-2xl border border-border-soft bg-surface px-[26px] py-[30px]"
      style={shadows.card}
    >
      <View className="mb-[14px] flex-row items-center gap-[7px]">
        <SportDot color={workout.color} />
        <AppText mono className="text-eyebrow-sm" style={{ color: workout.color }}>
          TODAY · {workout.type.toUpperCase()}
        </AppText>
      </View>

      <AppText className="text-heading-1 text-color-primary">{workout.title}</AppText>

      <View className="mt-sm flex-row items-baseline gap-[18px]">
        <AppText mono className="text-value text-color-secondary">
          {workout.duration}
        </AppText>
        <View className="h-[3px] w-[3px] rounded-full bg-neutral-200" />
        <View className="flex-row items-baseline">
          <AppText mono className="text-stat-sm text-color-primary">
            {workout.tss}
          </AppText>
          <AppText mono className="text-[11px] text-color-tertiary">
            {' '}
            TSS
          </AppText>
        </View>
      </View>

      <AppText className="mt-md max-w-[290px] text-body text-color-secondary">{workout.description}</AppText>

      <View className="mt-xl self-start">
        <PrimaryButton
          label="Start Workout"
          icon={<ArrowRightIcon color={colors.color.inverse} />}
          onPress={onStartWorkout}
        />
      </View>
    </Pressable>
  );
}
