import { ActivityIndicator, Pressable, View } from 'react-native';

import { useSession } from '@/lib/supabase/useSession';
import { AppText, Screen } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import { ConsistencyGrid, FitnessChart } from '../components';
import { useProgress } from '../hooks/useProgress';
import { buildProgressViewModel } from '../utils/buildProgressViewModel';

/**
 * Progress — two real sections as of 2026-09-06: consistency
 * (`workout.status`/`scheduled_date`, since 2026-09-01) and the fitness
 * trend (CTL, derived from real `workout_completion` rows via
 * `lib/trainingLoad/` — see `fetchProgress.ts`). The rest — VO2 Max/
 * FTP/threshold-pace/CSS-pace stats, monthly mileage, personal records
 * — still has no real data source in the schema at all (not
 * unpopulated, genuinely nothing to query): the stats need a
 * performance-test table that doesn't exist yet, mileage needs a
 * distance field `workout` doesn't have, and PRs need a tracking table
 * that doesn't exist either. Per-user decision (2026-09-01, still
 * followed): wire what's real, honest "coming soon" notes for the rest
 * — not fabricated numbers on a screen that would otherwise look fully
 * real, and not silently hidden either.
 *
 * The fitness trend itself degrades the same way: `FitnessChart` only
 * renders once `buildProgressViewModel` reports at least 2 weekly
 * points (an athlete with zero or one logged completion has nothing
 * honest to plot a trend from yet) — otherwise this still shows the
 * same "coming soon" note, now naming the real reason ("log your first
 * workout") rather than "needs a connected wearable." `mockProgressData.ts`/
 * `MileageChart.tsx` are untouched, still available once there's a real
 * source to feed them.
 */
export function ProgressScreen() {
  const colors = useThemeColors();
  const { session } = useSession();
  const athleteId = session?.user.id;
  const { data, isLoading, isFetching, isError, refetch } = useProgress(athleteId);

  // `!athleteId` covers the moment session goes null (sign-out, or a
  // token that expired mid-session) -- the query is disabled rather
  // than errored in that case (see `useProgress`'s `enabled`), so
  // without this it fell through to the `isError || !data` branch
  // below and showed a "couldn't load, try again" message for a state
  // that isn't a fetch failure at all. `(tabs)/_layout.tsx`'s guard is
  // about to navigate away regardless -- this just keeps that instant
  // honest (still loading) instead of scary (something broke).
  if (isLoading || !athleteId) {
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
          Couldn’t load your progress right now.
        </AppText>
        <Pressable onPress={() => refetch()} className="mt-md">
          <AppText className="text-body-sm font-semibold text-accent">Try again</AppText>
        </Pressable>
      </Screen>
    );
  }

  const view = buildProgressViewModel(data);

  return (
    <Screen
      edges={['top', 'bottom']}
      scroll
      className="pb-2xl pt-lg"
      refreshing={isFetching}
      onRefresh={refetch}
    >
      <AppText className="px-screen-x text-[26px] font-bold tracking-[-0.5px] text-color-primary">
        Progress
      </AppText>

      <View className="mt-xl px-screen-x">
        <AppText className="mb-sm text-caption-sm text-color-tertiary">
          {view.consistencyLabel}
        </AppText>
        <ConsistencyGrid values={view.weeklyConsistency} />
      </View>

      <View className="mt-2xl px-screen-x">
        <AppText className="mb-[2px] text-eyebrow text-color-tertiary">FITNESS TREND</AppText>
        {view.weeklyFitness ? (
          <FitnessChart values={view.weeklyFitness} />
        ) : (
          <AppText className="mt-xs text-body-sm text-color-secondary">
            Log your first completed workout to start seeing your fitness trend here.
          </AppText>
        )}
      </View>

      <View className="mt-2xl px-screen-x">
        <AppText className="mb-[2px] text-eyebrow text-color-tertiary">PERFORMANCE</AppText>
        <AppText className="mt-xs text-body-sm text-color-secondary">
          VO₂ Max, FTP, threshold pace, and CSS aren’t tracked yet — coming soon.
        </AppText>
      </View>

      <View className="mt-2xl px-screen-x">
        <AppText className="mb-[2px] text-eyebrow text-color-tertiary">MONTHLY MILEAGE</AppText>
        <AppText className="mt-xs text-body-sm text-color-secondary">
          Distance tracking isn’t available yet — coming soon.
        </AppText>
      </View>

      <View className="mt-2xl px-screen-x">
        <AppText className="mb-[2px] text-eyebrow text-color-tertiary">PERSONAL RECORDS</AppText>
        <AppText className="mt-xs text-body-sm text-color-secondary">
          Personal record tracking is coming soon.
        </AppText>
      </View>
    </Screen>
  );
}
