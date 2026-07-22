import type { ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Screen } from '@/shared/components';
import { ChevronLeftIcon } from '@/shared/components/icons';
import { useTrainingStore } from '@/shared/store';
import { lightColors } from '@/shared/theme/colors';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { WorkoutZone } from '../types/training';

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
 * Workout detail — Milestone 3 Training Checkpoint 2. The design export
 * has a distinct workout-detail overlay (`workoutOpen`/`selW`, separate
 * from the Training tab markup), matching what PRODUCT_SPEC.md calls out
 * as its own "Daily workout detail screen" concept. Ported directly:
 * the stats row (TSS/duration/calories), description, equipment tags,
 * the warm-up/main-set/cool-down dot-and-line timeline, and the target
 * zones (HR/power/pace/cadence) all use the source's exact per-workout
 * mock values — every workout in the current week already has this data
 * in the source's own `plan` array, so none of it needed extrapolating.
 *
 * Presentation: modal (`app/workout/[id].tsx`, registered with
 * `presentation: 'modal'` in app/_layout.tsx), not a stack push — the
 * source renders this as a `position:absolute;inset:0` overlay above
 * everything else including the tab bar, and app/_layout.tsx's own
 * comment already anticipated modal specifically for "workout detail."
 *
 * Two things are this screen's own additions, not sourced:
 * 1. The hero image is a real photo in the source (`image-slot`); no
 *    such asset exists, so this uses a solid block in the workout's
 *    discipline color instead — same "don't block on missing design
 *    assets" fallback as Profile's initials avatar.
 * 2. A completed/missed status badge above the stats row. The source
 *    has no completed-vs-planned distinction anywhere (no separate
 *    "actual" fields exist in its mock data) — showing the planned data
 *    with a status badge, not fabricated actual/delta numbers.
 *
 * Rest days skip the stats row, equipment, timeline, and zones entirely
 * (all of which would otherwise show a run of literal "—" placeholders)
 * and just show the description under a simpler header — a deliberate
 * "keep it sensible" call, not a source pattern.
 *
 * No "Complete Workout" / "Send to Garmin" / "Send to Apple Watch"
 * actions — out of scope for a detail *view*, and the latter two need
 * real device integration that doesn't exist.
 */
export function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const weekWorkouts = useTrainingStore((s) => s.weekWorkouts);

  const workout = weekWorkouts.find((w) => w.id === id);

  if (!workout) {
    return (
      <Screen edges={['top', 'bottom']} className="items-center justify-center">
        <AppText className="text-color-tertiary">Workout not found.</AppText>
      </Screen>
    );
  }

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
        {workout.status !== 'upcoming' && (
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
              <View className="flex-row items-baseline">
                <AppText mono className="text-[26px] font-bold text-color-primary">
                  {workout.tss}
                </AppText>
                <AppText className="ml-1 text-[11px] text-color-tertiary">TSS</AppText>
              </View>
              <AppText className="text-[13px] text-color-secondary">{workout.duration}</AppText>
              <AppText className="text-[13px] text-color-secondary">{workout.calories} cal</AppText>
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

            <View className="mt-xl">
              <TimelineStep dotColor={colors.accent} label="WARM-UP" text={workout.warmup} />
              <TimelineStep
                dotColor={colors.color.primary}
                label="MAIN SET"
                text={workout.mainset}
              />
              <TimelineStep
                dotColor={colors.color.tertiary}
                label="COOL-DOWN"
                text={workout.cooldown}
                isLast
              />
            </View>

            {zoneRows.length > 0 && (
              <View className="mt-lg border-t" style={{ borderColor: colors.border }}>
                {zoneRows}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
