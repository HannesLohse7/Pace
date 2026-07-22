import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';

import { AppText, Screen, SportDot } from '@/shared/components';
import { CheckIcon, DragHandleIcon } from '@/shared/components/icons';
import { isSwappable, useTrainingStore } from '@/shared/store';
import { spacing } from '@/shared/theme/spacing';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import {
  currentPhase,
  raceCountdown,
  todayId,
  totalHoursLabel,
  totalTssLabel,
  weekDateRangeLabel,
} from '../data/mockTrainingData';
import type { PlannedWorkout } from '../types/training';

/**
 * Training week view — Milestone 3. Checkpoint 1 built the header,
 * phase/race card, and static day list; Checkpoint 2 wired each row to
 * the workout-detail modal; Checkpoint 3 added drag-reorder.
 *
 * Dragging is a reschedule (swap dates with the drop target), not a
 * reorder — see useTrainingStore's `swapWorkouts` for the actual swap
 * and drop-target validation logic, kept out of this component per the
 * project's UI/business-logic separation. Only upcoming, non-rest
 * workouts render a drag handle (same `isSwappable` rule the store uses
 * to validate drop targets, imported from the same place so the two
 * can't drift apart) — completed/missed workouts already happened or
 * didn't, and a rest day isn't a session with a date worth taking over.
 *
 * The six-dot drag handle is a real source element (the Training row
 * markup already has it, `opacity:0.35`, unused until Checkpoint 3 gave
 * it something to do) — ported directly, not invented. The interaction
 * itself (long-press the handle to pick up) is
 * react-native-draggable-flatlist's standard pattern, not something the
 * source specifies, since the source is a static mockup with no real
 * gesture behavior to reference.
 */
export function TrainingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const weekWorkouts = useTrainingStore((s) => s.weekWorkouts);
  const swapWorkouts = useTrainingStore((s) => s.swapWorkouts);

  const renderItem = ({ item: workout, drag, isActive }: RenderItemParams<PlannedWorkout>) => {
    const isToday = workout.id === todayId;
    const isRest = workout.discipline === 'rest';
    const draggable = isSwappable(workout);

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
        className="flex-row items-center gap-sm border-t border-border px-screen-x py-lg"
        style={{
          backgroundColor: isActive ? colors.tint : isToday ? colors.surface : 'transparent',
        }}
      >
        <View className="w-[38px]">
          <AppText mono className="text-[10px] font-semibold text-color-tertiary">
            {workout.short}
          </AppText>
          <AppText mono className="mt-[2px] text-[13px] font-semibold text-color-primary">
            {workout.dateNum}
          </AppText>
        </View>

        <SportDot color={colors.sport[workout.discipline]} />

        <View className="flex-1">
          <AppText
            className="text-[15px] font-semibold"
            style={{ color: isRest ? colors.color.quaternary : colors.color.primary }}
          >
            {workout.title}
          </AppText>
          <AppText className="mt-[2px] text-[12px] text-color-tertiary">
            {workout.duration} · {workout.intensity}
          </AppText>
        </View>

        {workout.status === 'completed' && (
          <View
            className="h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: colors['success-bg'] }}
          >
            <CheckIcon size={10} color={colors.success} strokeWidth={2.6} />
          </View>
        )}
        {workout.status === 'missed' && (
          <AppText className="text-[11px] font-semibold text-danger">Missed</AppText>
        )}
        {draggable && (
          <Pressable onLongPress={drag} hitSlop={12} className="pl-1">
            <DragHandleIcon />
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <Screen edges={['top', 'bottom']} className="pt-lg">
      <DraggableFlatList
        data={weekWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ from, to }) => swapWorkouts(from, to)}
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
        ListHeaderComponent={
          <View className="mb-sm">
            <View className="px-screen-x">
              <AppText className="text-[26px] font-bold tracking-[-0.5px] text-color-primary">
                Training
              </AppText>
              <AppText mono className="mt-xs text-[12px] text-color-tertiary">
                {weekDateRangeLabel} · {totalHoursLabel} · {totalTssLabel}
              </AppText>
            </View>

            <View className="mt-lg bg-surface-dark px-screen-x py-xl">
              <AppText
                mono
                className="text-[10px] font-semibold tracking-[1px] text-color-inverse-secondary"
              >
                {currentPhase.name.toUpperCase()} PHASE
              </AppText>
              <AppText className="mt-[3px] text-[12px] text-color-inverse-secondary">
                {currentPhase.startDate} – {currentPhase.endDate}
              </AppText>

              <View className="mt-md border-t border-white/10 pt-md">
                <AppText className="text-[16px] font-bold text-color-inverse">
                  {raceCountdown.raceName}
                </AppText>
                <AppText className="mt-[3px] text-[12px] text-color-inverse-secondary">
                  {raceCountdown.raceDate} · {raceCountdown.daysToRace} days
                </AppText>
              </View>
            </View>
          </View>
        }
      />
    </Screen>
  );
}
