import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Screen, SportDot } from '@/shared/components';
import { CheckIcon } from '@/shared/components/icons';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import {
  currentPhase,
  raceCountdown,
  todayId,
  totalHoursLabel,
  totalTssLabel,
  weekDateRangeLabel,
  weekWorkouts,
} from '../data/mockTrainingData';

/**
 * Training week view — Milestone 3 Checkpoint 1. The design export has a
 * real Training tab reference (title, a date-range/hours/TSS summary
 * line, and a 7-row day list with drag-to-reorder), ported directly: row
 * spacing, the today-row highlight, and the rest-day-dimmed title all
 * match it exactly. Two things don't exist in the source at all and are
 * extrapolated from Home/Profile's established visual language instead:
 * the phase + race countdown card (styled like Profile's Race Goal card
 * and Home's NextRaceCard, since neither Training-specific precedent
 * exists), and each row's completed/missed status marker (the source
 * only visually distinguishes "today" and "rest day" — see
 * mockTrainingData.ts for why a real 3-state status needed inventing).
 *
 * Checkpoint 2 wires each row to the workout-detail modal
 * (app/workout/[id].tsx). Drag-reorder is still Checkpoint 3 — the
 * source's own six-dot drag handle isn't rendered here either, since
 * there's nothing for it to do yet.
 */
export function TrainingScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <Screen scroll edges={['top', 'bottom']} className="pb-2xl pt-lg">
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

      <View className="mt-sm">
        {weekWorkouts.map((workout) => {
          const isToday = workout.id === todayId;
          const isRest = workout.discipline === 'rest';

          return (
            <Pressable
              key={workout.id}
              onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
              className="flex-row items-center gap-sm border-t border-border px-screen-x py-lg"
              style={{ backgroundColor: isToday ? colors.surface : 'transparent' }}
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
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
