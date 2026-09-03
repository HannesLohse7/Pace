import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useSession } from '@/lib/supabase/useSession';
import { AppText, ProgressRing, Screen } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import { NextRaceCard, TodayCard, UpcomingList, WeekStrip } from '../components';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import type { UpcomingWorkoutItem } from '../types/home';
import { buildHomeViewModel } from '../utils/buildHomeViewModel';

export interface HomeScreenProps {
  /** TODO(Milestone: Progress tab): navigate to Progress when the recovery ring is tapped. */
  onOpenRecovery?: () => void;
  /** TODO(Milestone: Coach tab): navigate to Coach when the message teaser is tapped. */
  onOpenCoach?: () => void;
}

/**
 * Home's recovery score, coach message, and personal-record line have no
 * real data source anywhere in the schema today -- not unpopulated,
 * nothing to query (recovery/PR tracking was never scoped; CTL/ATL/TSB-
 * style dashboards are explicitly postponed per docs/ROADMAP.md). Rather
 * than show a fabricated number here, or silently drop these sections,
 * they render an honest "not available yet" state. Replace with real
 * data once there's a real source for it (wearable recovery signals,
 * a PR-tracking table -- neither exists yet).
 */
const RECOVERY_UNAVAILABLE_LABEL = '—';
const COACH_MESSAGE_PLACEHOLDER =
  'Your coach will start sharing insights here once your plan has adapted to something.';
const PERSONAL_RECORD_PLACEHOLDER = 'Personal record tracking is coming soon.';

export function HomeScreen({ onOpenRecovery, onOpenCoach }: HomeScreenProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const { session } = useSession();
  const athleteId = session?.user.id;
  const { data, isLoading, isFetching, isError, refetch } = useHomeDashboard(athleteId);

  // `app/(tabs)/index.tsx` renders `<HomeScreen />` with no props, so
  // workout taps navigate directly rather than through an
  // `onOpenWorkout` callback prop nothing ever supplied (previously
  // dead code) -- same real `workout.id` Training/Workout Detail use.
  const openWorkout = (workoutId: string | undefined) => {
    if (!workoutId) return;
    router.push({ pathname: '/workout/[id]', params: { id: workoutId } });
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen className="items-center justify-center px-screen-x">
        <AppText className="text-center text-body text-color-secondary">
          Couldn’t load your dashboard right now.
        </AppText>
        <Pressable onPress={() => refetch()} className="mt-md">
          <AppText className="text-body-sm font-semibold text-accent">Try again</AppText>
        </Pressable>
      </Screen>
    );
  }

  const view = buildHomeViewModel(data, colors);

  return (
    <Screen scroll className="pb-lg pt-sm" refreshing={isFetching} onRefresh={refetch}>
      <View className="flex-row items-start justify-between px-screen-x">
        <View>
          <AppText mono className="mb-[10px] text-eyebrow-sm text-color-quaternary">
            {view.dateLabel}
          </AppText>
          <AppText className="text-display text-color-primary">
            {view.greeting},{'\n'}
            {view.athleteFirstName}.
          </AppText>
        </View>

        <Pressable onPress={onOpenRecovery} className="items-center gap-[4px]">
          <ProgressRing progress={0} color={colors['border-soft']}>
            <AppText mono className="text-[26px] font-bold text-color-quaternary">
              {RECOVERY_UNAVAILABLE_LABEL}
            </AppText>
          </ProgressRing>
          <AppText mono className="text-[9px] font-semibold tracking-[0.6px] text-color-tertiary">
            RECOVERY
          </AppText>
        </Pressable>
      </View>

      <Pressable
        onPress={onOpenCoach}
        className="mx-screen-x mt-[18px] border-t border-border-faint pt-[14px]"
      >
        <AppText className="text-body-sm text-color-secondary">{COACH_MESSAGE_PLACEHOLDER}</AppText>
      </Pressable>

      {!data.plan ? (
        <View className="mt-2xl border border-border-soft bg-surface px-[26px] py-[30px]">
          <AppText className="text-heading-2 text-color-primary">
            Your training plan isn’t ready yet
          </AppText>
          <AppText className="mt-sm text-body-sm text-color-secondary">
            Automatic plan generation currently covers Sprint and Olympic distance races. Other
            distances are coming soon.
          </AppText>
        </View>
      ) : view.todayWorkout ? (
        <TodayCard
          workout={view.todayWorkout}
          onPress={() => openWorkout(view.todayWorkout?.id)}
          onStartWorkout={() => openWorkout(view.todayWorkout?.id)}
        />
      ) : (
        <View className="mt-2xl border border-border-soft bg-surface px-[26px] py-[30px]">
          <AppText className="text-heading-2 text-color-primary">Rest day</AppText>
          <AppText className="mt-sm text-body-sm text-color-secondary">
            Nothing scheduled today — recovery is part of the plan too.
          </AppText>
        </View>
      )}

      {data.plan && (
        <>
          <Pressable onPress={() => router.push('/report')} className="mt-md px-screen-x">
            <AppText className="text-body-sm font-semibold text-accent">
              What’s going on today?
            </AppText>
          </Pressable>

          <WeekStrip days={view.weekStrip} summary={view.weekSummary} />
          <UpcomingList
            items={view.upcomingWorkouts}
            onPressItem={(item: UpcomingWorkoutItem) => openWorkout(item.id)}
          />
        </>
      )}

      {view.raceCountdown && <NextRaceCard race={view.raceCountdown} />}

      <AppText className="px-screen-x pb-[4px] pt-lg text-caption text-color-tertiary">
        {PERSONAL_RECORD_PLACEHOLDER}
      </AppText>
    </Screen>
  );
}
