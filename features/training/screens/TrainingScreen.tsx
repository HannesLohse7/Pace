import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { AppText, Screen } from '@/shared/components';
import { useTrainingStore } from '@/shared/store';

import { ROW_HEIGHT, TrainingWorkoutRow } from '../components/TrainingWorkoutRow';
import {
  currentPhase,
  raceCountdown,
  totalHoursLabel,
  totalTssLabel,
  weekDateRangeLabel,
} from '../data/mockTrainingData';

/**
 * Training week view — Milestone 3. Checkpoint 1 built the header,
 * phase/race card, and static day list; Checkpoint 2 wired each row to
 * the workout-detail modal; Checkpoint 3 added drag-reorder, first on
 * react-native-draggable-flatlist, then — after three rounds of
 * on-device bugs traced to that library's internal position cache —
 * replaced with a hand-built implementation on
 * react-native-gesture-handler + react-native-reanimated directly (see
 * `TrainingWorkoutRow.tsx` for the actual drag mechanics and
 * `useTrainingStore`'s `reorderWeek` for the reorder/validation logic,
 * both kept out of this component per the project's UI/business-logic
 * separation).
 *
 * Rows are absolutely positioned inside a fixed-height container
 * (`weekWorkouts.length * ROW_HEIGHT`) rather than rendered by a
 * FlatList — there are always exactly 7 of them, so virtualization
 * buys nothing, and explicit positions are what make each row's
 * location a direct, un-cached function of its current array index.
 */
export function TrainingScreen() {
  const weekWorkouts = useTrainingStore((s) => s.weekWorkouts);
  const reorderWeek = useTrainingStore((s) => s.reorderWeek);

  const activeIndex = useSharedValue(-1);
  const dragTranslationY = useSharedValue(0);

  return (
    <Screen edges={['top', 'bottom']} scroll className="pt-lg pb-2xl">
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

      <View style={{ height: weekWorkouts.length * ROW_HEIGHT }}>
        {weekWorkouts.map((workout, index) => (
          <TrainingWorkoutRow
            key={workout.id}
            workout={workout}
            index={index}
            rowCount={weekWorkouts.length}
            activeIndex={activeIndex}
            dragTranslationY={dragTranslationY}
            onDragEnd={reorderWeek}
          />
        ))}
      </View>
    </Screen>
  );
}
