import { ScrollView, View } from 'react-native';

import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';
import type { WearableConnections } from '@/shared/store';

import { ConnectToggleBadge } from '../components/ConnectToggleBadge';
import { OnboardingContinueButton } from '../components/OnboardingContinueButton';
import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

const WEARABLE_DEFS: { key: keyof WearableConnections; name: string; benefit: string }[] = [
  { key: 'appleHealth', name: 'Apple Health', benefit: 'Syncs sleep and resting heart rate' },
  { key: 'garmin', name: 'Garmin', benefit: 'Pulls HRV and daily readiness' },
  { key: 'coros', name: 'COROS', benefit: 'Imports run and ride files automatically' },
  { key: 'strava', name: 'Strava', benefit: 'Cross-checks completed activities' },
  { key: 'zwift', name: 'Zwift', benefit: 'Sends structured indoor rides' },
];

/**
 * No gating, same reasoning as Calendar: wearable connections enhance
 * the plan ("The more Pace sees, the smarter your plan gets" is framed
 * as a bonus, not a requirement) rather than being needed to generate
 * one, and docs/PROJECT_RULES.md explicitly excludes "wearable analytics
 * beyond what is required" from MVP scope. canContinue is left at its
 * default (always true) — this is also the final onboarding step before
 * plan generation, so blocking it on an optional connection would be a
 * real funnel problem, not just a UX nitpick.
 */
export function WearablesScreen() {
  const wearables = useOnboardingStore((s) => s.wearables);
  const toggleWearable = useOnboardingStore((s) => s.toggleWearable);
  const { goNext } = useOnboardingNavigation('wearables');

  return (
    <OnboardingStepShell step="wearables" title="Connect your devices" showFooter={false}>
      <AppText className="mt-xs text-[13.5px] text-color-secondary">
        The more Pace sees, the smarter your plan gets.
      </AppText>

      <ScrollView className="mt-md flex-1" showsVerticalScrollIndicator={false}>
        {WEARABLE_DEFS.map((wearable) => {
          const connected = wearables[wearable.key];
          return (
            <View
              key={wearable.key}
              className="flex-row items-center gap-sm border-t border-border py-[14px]"
            >
              <View className="flex-1">
                <AppText className="text-[14.5px] font-semibold text-color-primary">
                  {wearable.name}
                </AppText>
                <AppText className="mt-[2px] text-[11.5px] text-color-tertiary">
                  {wearable.benefit}
                </AppText>
              </View>
              <ConnectToggleBadge
                connected={connected}
                onPress={() => toggleWearable(wearable.key)}
              />
            </View>
          );
        })}
      </ScrollView>

      <View className="mt-[14px]">
        <OnboardingContinueButton label="Build My Plan" goNext={goNext} />
      </View>
    </OnboardingStepShell>
  );
}
