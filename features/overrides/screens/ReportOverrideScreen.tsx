import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { OnboardingBackButton } from '@/features/onboarding/components/OnboardingBackButton';
import { useSession } from '@/lib/supabase/useSession';
import { AppText, Screen } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import { OVERRIDE_OPTIONS } from '../data/overrideOptions';
import { useReportOverride } from '../hooks/useReportOverride';
import { useTodayWorkout } from '../hooks/useTodayWorkout';
import type { GeneralOverrideReason } from '../types/overrides';

/**
 * "What's going on?" — the 4 general override reasons (illness, travel,
 * poor sleep, extra time). "Move this workout," the 5th reason the
 * product spec lists, isn't here: it's inherently about one specific
 * workout and a target date, so it lives as an action on Workout Detail
 * instead (`WorkoutDetailScreen.tsx`), sharing `useReorderWorkout` with
 * Training's drag-reorder rather than duplicating the date-change logic
 * here.
 *
 * No design-export reference exists for this screen — there's no
 * mock/source for it at all, unlike every other screen in this app.
 * Mirrors `EditProfileScreen.tsx`'s layout (back button, title, content,
 * `PrimaryButton`-free since every row *is* the action) as the closest
 * existing "simple modal form" precedent, and `GoalScreen.tsx`'s
 * tap-a-row list styling for the options themselves.
 *
 * Each reason's real effect is intentionally thin — see
 * `reportOverride.ts`'s own doc comment, including what the adaptation
 * engine (v1, added 2026-09-01) does and doesn't do in response. This
 * screen's job is just: pick a reason, show what happened, get out of
 * the way — any engine adjustment shows up later, on whichever
 * workout it touched, not here.
 */
export function ReportOverrideScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { session } = useSession();
  const athleteId = session?.user.id;

  const { data: todayWorkout } = useTodayWorkout(athleteId);
  const reportMutation = useReportOverride(athleteId);
  const [activeReason, setActiveReason] = useState<GeneralOverrideReason | null>(null);
  const [errorReason, setErrorReason] = useState<GeneralOverrideReason | null>(null);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSelect = (reason: GeneralOverrideReason, summary: string) => {
    if (!athleteId || reportMutation.isPending) return;
    setActiveReason(reason);
    setErrorReason(null);
    reportMutation.mutate(
      { athleteId, reason, summary, todayWorkout },
      {
        onSuccess: (result) => {
          if (result.error) {
            setErrorReason(reason);
            setActiveReason(null);
            return;
          }
          goBack();
        },
        onError: () => {
          setErrorReason(reason);
          setActiveReason(null);
        },
      },
    );
  };

  return (
    <Screen edges={['top', 'bottom']} className="px-screen-x pt-screen-top pb-lg">
      <OnboardingBackButton onPress={goBack} />

      <AppText className="text-[25px] font-bold tracking-[-0.5px] text-color-primary">
        What’s going on?
      </AppText>
      <AppText className="mt-xs text-body-sm text-color-secondary">
        Let your coach know — this gets saved to your training history.
      </AppText>

      <View className="mt-2xl">
        {OVERRIDE_OPTIONS.map((option) => {
          const isActive = activeReason === option.reason;
          return (
            <View key={option.reason}>
              <Pressable
                onPress={() => handleSelect(option.reason, option.summary)}
                disabled={reportMutation.isPending}
                className="flex-row items-center justify-between border-t border-border px-[2px] py-md"
              >
                <AppText className="text-[16px] font-semibold text-color-primary">
                  {option.label}
                </AppText>
                {isActive && <ActivityIndicator color={colors.accent} />}
              </Pressable>
              {errorReason === option.reason && (
                <AppText className="pb-sm text-caption-sm text-danger">
                  Couldn’t save that — try again.
                </AppText>
              )}
            </View>
          );
        })}
        <View className="border-t border-border" />
      </View>
    </Screen>
  );
}
