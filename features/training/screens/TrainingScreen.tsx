import { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { useSession } from '@/lib/supabase/useSession';
import { AppText, Screen } from '@/shared/components';
import { isSwappable } from '@/shared/store';
import { useThemeColors } from '@/shared/theme/ThemeProvider';
import { addDays, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';

import { ROW_HEIGHT, TrainingWorkoutRow } from '../components/TrainingWorkoutRow';
import { useReorderWorkout } from '../hooks/useReorderWorkout';
import { useTrainingWeek } from '../hooks/useTrainingWeek';
import { buildTrainingViewModel, canAcceptDrop } from '../utils/buildTrainingViewModel';

/**
 * Training week view — real data as of 2026-09-01 (previously
 * `shared/store/useTrainingStore.ts`'s mock week, which Coach/Progress's
 * own mocks still use and this screen no longer touches). Header,
 * phase/race card and the 7-row day list are unchanged in structure
 * from Checkpoint 1-3; what changed is where the data comes from and
 * how a drag-reorder is committed.
 *
 * Rows are still absolutely positioned inside a fixed-height container
 * rather than a FlatList — always exactly 7 of them, so virtualization
 * buys nothing (see `TrainingWorkoutRow.tsx` for the drag mechanics
 * themselves, unchanged from the mock-data version).
 *
 * Drag-reorder now persists to Supabase instead of only updating local
 * Zustand state: `useReorderWorkout` swaps (or, dropped onto an empty
 * Rest Day, moves) real `workout.scheduled_date` values, optimistically
 * and with rollback on failure. A drop is valid when the dragged row is
 * a real, upcoming, non-rest workout and the target is either the same
 * (an upcoming real workout it can swap with) or an empty upcoming
 * calendar day — see `canAcceptDrop` in `buildTrainingViewModel.ts`;
 * anything else silently no-ops, same "snap back" UX the mock version
 * had for a rejected reorder. A drop that's structurally valid but
 * rejected by `useReorderWorkout`'s taper-load guardrail (#15, added
 * 2026-09-01 — no increasing a day's load during Taper) rolls back the
 * same way: a drag has no room for an inline error message the way
 * Workout Detail's explicit "Move this workout" does, so it snaps back
 * silently rather than looking like a broken drop.
 */
export function TrainingScreen() {
  const colors = useThemeColors();
  const { session } = useSession();
  const athleteId = session?.user.id;
  const { data, isLoading, isError, refetch } = useTrainingWeek(athleteId);
  const reorderWorkout = useReorderWorkout(athleteId);

  const activeIndex = useSharedValue(-1);
  const dragTranslationY = useSharedValue(0);

  // Stable for the lifetime of this screen instance -- re-deriving
  // "today" on every render would let the week/phase/countdown drift
  // out of sync with each other mid-session.
  const today = useMemo(() => new Date(), []);
  const todayIso = toIsoDate(today);
  const weekStart = useMemo(() => mondayOnOrBefore(today), [today]);

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom']} className="items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen edges={['top', 'bottom']} className="items-center justify-center px-screen-x">
        <AppText className="text-center text-body text-color-secondary">
          Couldn’t load your training week right now.
        </AppText>
        <Pressable onPress={() => refetch()} className="mt-md">
          <AppText className="text-body-sm font-semibold text-accent">Try again</AppText>
        </Pressable>
      </Screen>
    );
  }

  const view = buildTrainingViewModel(data, today);

  const handleDragEnd = (from: number, to: number) => {
    if (from === to) return;
    const dragged = view.days[from];
    const target = view.days[to];
    if (!dragged || !target) return;
    if (!dragged.isReal || !isSwappable(dragged)) return;
    if (!canAcceptDrop(target)) return;

    reorderWorkout.mutate({
      moved: {
        id: dragged.id,
        title: dragged.title,
        trainingPlanId: dragged.trainingPlanId ?? null,
        originDate: toIsoDate(addDays(weekStart, from)),
      },
      targetDate: toIsoDate(addDays(weekStart, to)),
      displaced: target.isReal
        ? { id: target.id, title: target.title, trainingPlanId: target.trainingPlanId ?? null }
        : undefined,
    });
  };

  return (
    <Screen edges={['top', 'bottom']} scroll className="pt-lg pb-2xl">
      <View className="mb-sm">
        <View className="px-screen-x">
          <AppText className="text-[26px] font-bold tracking-[-0.5px] text-color-primary">
            Training
          </AppText>
          <AppText mono className="mt-xs text-[12px] text-color-tertiary">
            {view.weekDateRangeLabel} · {view.totalHoursLabel}
          </AppText>
        </View>

        {!data.plan ? (
          <View className="mx-screen-x mt-lg border border-border-soft bg-surface px-[22px] py-[26px]">
            <AppText className="text-heading-2 text-color-primary">
              Your training plan isn’t ready yet
            </AppText>
            <AppText className="mt-sm text-body-sm text-color-secondary">
              Automatic plan generation currently covers Sprint and Olympic distance races. Other
              distances are coming soon.
            </AppText>
          </View>
        ) : (
          (view.currentPhase || view.raceCountdown) && (
            <View className="mt-lg bg-surface-dark px-screen-x py-xl">
              {view.currentPhase && (
                <>
                  <AppText
                    mono
                    className="text-[10px] font-semibold tracking-[1px] text-color-inverse-secondary"
                  >
                    {view.currentPhase.name.toUpperCase()} PHASE
                  </AppText>
                  <AppText className="mt-[3px] text-[12px] text-color-inverse-secondary">
                    {view.currentPhase.startDate} – {view.currentPhase.endDate}
                  </AppText>
                </>
              )}

              {view.raceCountdown && (
                <View
                  className={view.currentPhase ? 'mt-md border-t border-white/10 pt-md' : undefined}
                >
                  <AppText className="text-[16px] font-bold text-color-inverse">
                    {view.raceCountdown.raceName}
                  </AppText>
                  <AppText className="mt-[3px] text-[12px] text-color-inverse-secondary">
                    {view.raceCountdown.raceDate} · {view.raceCountdown.daysToRace} days
                  </AppText>
                </View>
              )}
            </View>
          )
        )}
      </View>

      <View style={{ height: view.days.length * ROW_HEIGHT }}>
        {view.days.map((workout, index) => (
          <TrainingWorkoutRow
            key={workout.id}
            workout={workout}
            index={index}
            isToday={toIsoDate(addDays(weekStart, index)) === todayIso}
            rowCount={view.days.length}
            activeIndex={activeIndex}
            dragTranslationY={dragTranslationY}
            onDragEnd={handleDragEnd}
          />
        ))}
      </View>
    </Screen>
  );
}
