import { useState, type ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAPER_LOAD_GUARDRAIL_ERROR } from '@/lib/adaptation/guardrails/checkTaperLoadGuardrail';
import { useSession } from '@/lib/supabase/useSession';
import { AppText, Screen } from '@/shared/components';
import { ChevronLeftIcon } from '@/shared/components/icons';
import { lightColors } from '@/shared/theme/colors';
import { useThemeColors } from '@/shared/theme/ThemeProvider';
import { addDays, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';
import { formatEventDate } from '@/shared/utils/format';

import { useReorderWorkout } from '../hooks/useReorderWorkout';
import { useTrainingWeek } from '../hooks/useTrainingWeek';
import { useWorkoutDetail } from '../hooks/useWorkoutDetail';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';
import type { WorkoutZone } from '../types/training';
import { buildTrainingViewModel, canAcceptDrop } from '../utils/buildTrainingViewModel';
import { buildWorkoutDetailViewModel } from '../utils/buildWorkoutDetailViewModel';

function ZoneRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View
      className="flex-row items-center justify-between border-b py-sm"
      style={{ borderColor: colors.border }}
    >
      <AppText className="text-[13px] text-color-secondary">{label}</AppText>
      <AppText mono className="text-[13px] font-semibold text-color-primary">
        {value}
      </AppText>
    </View>
  );
}

function TimelineStep({
  dotColor,
  label,
  text,
  isLast,
}: {
  dotColor: string;
  label: string;
  text: string;
  isLast?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row gap-sm">
      <View className="w-2 items-center">
        <View className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
        {!isLast && (
          <View
            className="mt-[3px] w-px flex-1"
            style={{ backgroundColor: colors['border-strong'] }}
          />
        )}
      </View>
      <View className="pb-lg">
        <AppText
          mono
          className="mb-1 text-[10.5px] font-bold tracking-[0.6px]"
          style={{ color: dotColor }}
        >
          {label}
        </AppText>
        <AppText className="text-[13.5px] leading-[1.55] text-color-primary">{text}</AppText>
      </View>
    </View>
  );
}

/**
 * Workout detail — real data as of 2026-09-01 (previously
 * `shared/store/useTrainingStore.ts`'s mock week). Fetches the real
 * `workout` row by route param `id` plus its `workout_step`/
 * `workout_target_zone` children (`useWorkoutDetail`/
 * `fetchWorkoutDetail.ts`) rather than reading Training's local Zustand
 * mock. Layout (hero, stats row, description, equipment tags, timeline,
 * zone rows) is unchanged from the mock-data version; see that file's
 * git history for the original design-export porting notes.
 *
 * Real-data gaps, decided explicitly (not an oversight — see
 * docs/ROADMAP.md's 2026-09-01 entry): TSS and calories are omitted
 * from the stats row when the workout has none (no threshold data to
 * compute them from, same as Home). The warm-up/main-set/cool-down
 * timeline is skipped in favor of one honest note when all three steps
 * are absent (nothing writes `workout_step` rows yet — see
 * `fetchWorkoutDetail.ts`), rather than three literal "—" rows. Target
 * zones already degrade this way (`zoneRows.length > 0` gate, unchanged)
 * since `hrZones`/`powerZones`/`paceTarget`/`cadenceTarget` were already
 * optional.
 *
 * The status badge condition changed from `!== 'upcoming'` to an
 * explicit `'completed' || 'missed'` check: `WorkoutStatus` gained a
 * `'past'` value for real data (a `planned` workout whose date has
 * elapsed, completion untracked — see that type's own doc comment), and
 * the old negated check would have mislabeled every past-but-untracked
 * workout as "Missed."
 *
 * "Move this workout" (added 2026-09-01, alongside `features/overrides`'
 * "what's going on" reports — see `ReportOverrideScreen.tsx`'s doc
 * comment for why this one action lives here instead) shares
 * `useReorderWorkout` with Training's drag-reorder rather than
 * duplicating the date-change logic: tapping it lists the other days in
 * *this* calendar week that are valid drop targets (`canAcceptDrop`,
 * same rule the drag gesture uses), and picking one runs the same
 * swap-or-move mutation, audit-logged the same way. Only offered when
 * the workout itself is upcoming, non-rest, and scheduled within the
 * current week — Training has no next-week view yet to build a target
 * list from beyond that, so rather than a broken or empty picker, the
 * action simply doesn't appear. A move can also be rejected by
 * `useReorderWorkout`'s taper-load guardrail (#15, added 2026-09-01) --
 * `moveError` shows the athlete-facing reason (a tailored message for
 * that specific rejection, a generic one for any other failure) rather
 * than leaving the tap looking like it silently did nothing.
 *
 * The HISTORY section (added 2026-09-01) is the read side of that same
 * audit trail: `useWorkoutHistory`/`fetchWorkoutHistory.ts` query
 * `adaptation_event` for rows whose `workout_id` matches this workout,
 * newest first, and render each one's already athlete-facing `summary`
 * text plus a short relative date. It's the "why this changed" UI
 * `adaptation_event`'s own schema doc has called for since it was built
 * (#7) — there was simply nothing to read until manual overrides and
 * audit-logged reschedules (#11) started writing real rows. Shown for
 * both rest and non-rest workouts (history isn't specific to the
 * detailed-stats layout), and only rendered at all once there's at
 * least one real event — an empty history is a normal state for most
 * workouts, not a gap to placeholder. Each row also renders `reasoning`
 * when present — only the v1 adaptation engine (#1) sets it, so in
 * practice it's the engine's own longer explanation showing up under
 * its `summary` line; manual entries (reports, reschedules) never have
 * one, so they render as a single line.
 */
export function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const athleteId = session?.user.id;
  const { data, isLoading, isError } = useWorkoutDetail(id);
  const { data: weekData } = useTrainingWeek(athleteId);
  const { data: history } = useWorkoutHistory(id);
  const reorderWorkout = useReorderWorkout(athleteId);
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom']} className="items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen edges={['top', 'bottom']} className="items-center justify-center">
        <AppText className="text-color-tertiary">Workout not found.</AppText>
      </Screen>
    );
  }

  const workout = buildWorkoutDetailViewModel(data);
  const isRest = workout.discipline === 'rest';
  const heroColor = colors.sport[workout.discipline];

  const zoneRows: ReactNode[] = [];
  workout.hrZones?.forEach((zone: WorkoutZone, i) => {
    zoneRows.push(
      <ZoneRow key={`hr-${i}`} label={`${zone.zone} ${zone.name}`} value={zone.range} />,
    );
  });
  workout.powerZones?.forEach((zone: WorkoutZone, i) => {
    zoneRows.push(
      <ZoneRow key={`pw-${i}`} label={`${zone.zone} ${zone.name}`} value={zone.range} />,
    );
  });
  if (workout.paceTarget) {
    zoneRows.push(<ZoneRow key="pace" label="Pace target" value={workout.paceTarget} />);
  }
  if (workout.cadenceTarget) {
    zoneRows.push(<ZoneRow key="cadence" label="Cadence" value={workout.cadenceTarget} />);
  }

  const timelineSteps = [
    workout.warmup && { dotColor: colors.accent, label: 'WARM-UP', text: workout.warmup },
    workout.mainset && { dotColor: colors.color.primary, label: 'MAIN SET', text: workout.mainset },
    workout.cooldown && {
      dotColor: colors.color.tertiary,
      label: 'COOL-DOWN',
      text: workout.cooldown,
    },
  ].filter((step): step is { dotColor: string; label: string; text: string } => Boolean(step));

  const today = new Date();
  const weekStart = mondayOnOrBefore(today);
  const weekEndIso = toIsoDate(addDays(weekStart, 6));
  const isInCurrentWeek =
    data.workout.scheduled_date >= toIsoDate(weekStart) &&
    data.workout.scheduled_date <= weekEndIso;
  const canMove = !isRest && workout.status === 'upcoming' && isInCurrentWeek;

  // Computed once (not per-render-branch) so a target's array index --
  // its real calendar date, `weekStart` + index, same recipe
  // TrainingScreen.tsx uses -- stays valid for `handleMove` below.
  const weekDays = weekData ? buildTrainingViewModel(weekData, today).days : [];
  const moveTargets = weekDays
    .map((day, dayIndex) => ({ day, dayIndex }))
    .filter(({ day }) => day.id !== data.workout.id && canAcceptDrop(day));

  const handleMove = (target: (typeof moveTargets)[number]) => {
    setMoveError(null);
    reorderWorkout.mutate(
      {
        moved: {
          id: data.workout.id,
          title: data.workout.title,
          trainingPlanId: data.workout.training_plan_id,
          originDate: data.workout.scheduled_date,
        },
        targetDate: toIsoDate(addDays(weekStart, target.dayIndex)),
        displaced: target.day.isReal
          ? {
              id: target.day.id,
              title: target.day.title,
              trainingPlanId: target.day.trainingPlanId ?? null,
            }
          : undefined,
      },
      {
        onSuccess: () => router.back(),
        onError: (error) => {
          setMoveError(
            error instanceof Error && error.message === TAPER_LOAD_GUARDRAIL_ERROR
              ? 'Durations can only decrease during taper — try a shorter or later target day.'
              : 'Couldn’t move that workout — try again.',
          );
        },
      },
    );
  };

  return (
    <Screen edges={['bottom']} scroll className="pb-2xl">
      <View style={{ height: 240, backgroundColor: heroColor }} className="relative">
        <Pressable
          onPress={() => router.back()}
          className="absolute h-[34px] w-[34px] items-center justify-center rounded-full bg-white/90"
          style={{ top: insets.top + 18, left: 20 }}
        >
          <ChevronLeftIcon color={lightColors.color.primary} />
        </Pressable>

        <View className="absolute bottom-5 left-6 right-6">
          <AppText
            mono
            className="mb-[6px] text-[11px] font-semibold tracking-[0.6px] text-white/75"
          >
            {workout.discipline.toUpperCase()}
          </AppText>
          <AppText className="text-[23px] font-bold tracking-[-0.4px] text-color-inverse">
            {workout.title}
          </AppText>
        </View>
      </View>

      <View className="px-screen-x pb-xl pt-xl">
        {(workout.status === 'completed' || workout.status === 'missed') && (
          <View
            className="mb-md self-start rounded-full px-sm py-[4px]"
            style={{
              backgroundColor:
                workout.status === 'completed' ? colors['success-bg'] : colors.surface,
            }}
          >
            <AppText
              className="text-[11px] font-bold"
              style={{ color: workout.status === 'completed' ? colors.success : colors.danger }}
            >
              {workout.status === 'completed' ? 'Completed' : 'Missed'}
            </AppText>
          </View>
        )}

        {isRest ? (
          <AppText className="text-[14px] leading-[1.6] text-color-primary">
            {workout.description}
          </AppText>
        ) : (
          <>
            <View className="flex-row items-baseline gap-xl">
              {workout.tss !== undefined && (
                <View className="flex-row items-baseline">
                  <AppText mono className="text-[26px] font-bold text-color-primary">
                    {workout.tss}
                  </AppText>
                  <AppText className="ml-1 text-[11px] text-color-tertiary">TSS</AppText>
                </View>
              )}
              <AppText className="text-[13px] text-color-secondary">{workout.duration}</AppText>
              {workout.calories !== undefined && (
                <AppText className="text-[13px] text-color-secondary">
                  {workout.calories} cal
                </AppText>
              )}
            </View>

            <AppText className="mt-md text-[14px] leading-[1.6] text-color-primary">
              {workout.description}
            </AppText>

            {workout.equipment.length > 0 && (
              <View className="mt-md flex-row flex-wrap gap-xs">
                {workout.equipment.map((item) => (
                  <View
                    key={item}
                    className="rounded-full border border-border-strong px-sm py-[5px]"
                  >
                    <AppText className="text-[12px] text-color-secondary">{item}</AppText>
                  </View>
                ))}
              </View>
            )}

            {timelineSteps.length > 0 ? (
              <View className="mt-xl">
                {timelineSteps.map((step, i) => (
                  <TimelineStep
                    key={step.label}
                    dotColor={step.dotColor}
                    label={step.label}
                    text={step.text}
                    isLast={i === timelineSteps.length - 1}
                  />
                ))}
              </View>
            ) : (
              <AppText className="mt-xl text-[13px] text-color-tertiary">
                Step-by-step structure isn’t available for this workout yet.
              </AppText>
            )}

            {zoneRows.length > 0 && (
              <View className="mt-lg border-t" style={{ borderColor: colors.border }}>
                {zoneRows}
              </View>
            )}

            {canMove && (
              <View className="mt-xl">
                <Pressable onPress={() => setShowMoveOptions((open) => !open)}>
                  <AppText className="text-body-sm font-semibold text-accent">
                    {showMoveOptions ? 'Cancel' : 'Move this workout'}
                  </AppText>
                </Pressable>

                {showMoveOptions && (
                  <View className="mt-md">
                    {moveTargets.length === 0 ? (
                      <AppText className="text-[13px] text-color-tertiary">
                        No other days this week are open to move to.
                      </AppText>
                    ) : (
                      moveTargets.map((target) => (
                        <Pressable
                          key={target.day.id}
                          onPress={() => handleMove(target)}
                          disabled={reorderWorkout.isPending}
                          className="flex-row items-center justify-between border-t border-border py-sm"
                        >
                          <AppText className="text-[14px] text-color-primary">
                            {target.day.short} {target.day.dateNum}
                          </AppText>
                          <AppText className="text-[12px] text-color-tertiary">
                            {target.day.isReal ? target.day.title : 'Rest day'}
                          </AppText>
                        </Pressable>
                      ))
                    )}
                    {moveError && (
                      <AppText className="mt-sm text-caption-sm text-danger">{moveError}</AppText>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {history && history.length > 0 && (
          <View className="mt-xl">
            <AppText className="mb-xs text-eyebrow text-color-tertiary">HISTORY</AppText>
            <View className="border-t" style={{ borderColor: colors.border }}>
              {history.map((event) => (
                <View
                  key={event.id}
                  className="border-b py-sm"
                  style={{ borderColor: colors.border }}
                >
                  <AppText className="text-[13px] leading-[1.5] text-color-primary">
                    {event.summary}
                  </AppText>
                  {event.reasoning && (
                    <AppText className="mt-[2px] text-[12px] leading-[1.5] text-color-secondary">
                      {event.reasoning}
                    </AppText>
                  )}
                  <AppText className="mt-[2px] text-[11px] text-color-tertiary">
                    {formatEventDate(event.created_at)}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
