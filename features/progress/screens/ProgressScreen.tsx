import { ActivityIndicator, Pressable, View } from 'react-native';

import { useSession } from '@/lib/supabase/useSession';
import { AppText, Screen } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import { ConsistencyGrid } from '../components';
import { useProgress } from '../hooks/useProgress';
import { buildProgressViewModel } from '../utils/buildProgressViewModel';

/**
 * Progress — real data as of 2026-09-01, but only partly: consistency
 * is the one section anywhere on this screen with a real source
 * (`workout.status`/`scheduled_date`, see `fetchProgress.ts`). The rest
 * — fitness/fatigue trend, VO2 Max/FTP/threshold-pace/CSS-pace stats,
 * monthly mileage, personal records — has no real data source in the
 * schema at all (not unpopulated, genuinely nothing to query): the
 * fitness trend chart is explicitly on ROADMAP.md's postponed list
 * (CTL/ATL/TSB-style dashboards), the stats need a performance-test
 * table that doesn't exist yet, mileage needs a distance field
 * `workout` doesn't have, and PRs need a tracking table that doesn't
 * exist either. Per-user decision (2026-09-01): wire what's real,
 * honest "coming soon" notes for the rest — not fabricated numbers on
 * a screen that would otherwise look fully real, and not silently
 * hidden either. `mockProgressData.ts`/`FitnessChart.tsx`/
 * `MileageChart.tsx` are untouched, still available once there's a
 * real source to feed them.
 */
export function ProgressScreen() {
  const colors = useThemeColors();
  const { session } = useSession();
  const athleteId = session?.user.id;
  const { data, isLoading, isFetching, isError, refetch } = useProgress(athleteId);

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
        <AppText className="mt-xs text-body-sm text-color-secondary">
          Fitness and form tracking needs a connected wearable or logged effort data — coming soon.
        </AppText>
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
