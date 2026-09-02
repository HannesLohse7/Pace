import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useConnectAppleHealth } from '@/features/wearables/hooks/useConnectAppleHealth';
import { useSession } from '@/lib/supabase/useSession';
import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';
import type { WearableConnections } from '@/shared/store';

import { ConnectToggleBadge } from '../components/ConnectToggleBadge';
import { OnboardingContinueButton } from '../components/OnboardingContinueButton';
import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

const WEARABLE_DEFS: { key: keyof WearableConnections; name: string; benefit: string }[] = [
  { key: 'appleHealth', name: 'Apple Health', benefit: 'Syncs resting heart rate and HRV' },
  { key: 'garmin', name: 'Garmin', benefit: 'Pulls HRV and daily readiness' },
  { key: 'coros', name: 'COROS', benefit: 'Imports run and ride files automatically' },
  { key: 'strava', name: 'Strava', benefit: 'Cross-checks completed activities' },
  { key: 'zwift', name: 'Zwift', benefit: 'Sends structured indoor rides' },
];

function appleHealthErrorMessage(
  reason: 'unavailable' | 'authorization_denied' | 'write_failed',
): string {
  switch (reason) {
    case 'unavailable':
      return 'Apple Health isn’t available on this device.';
    case 'authorization_denied':
      return 'Permission wasn’t granted — you can allow it later in iOS Settings.';
    case 'write_failed':
      return 'Connected, but saving your data failed — try again.';
  }
}

/**
 * No gating, same reasoning as Calendar: wearable connections enhance
 * the plan ("The more Pace sees, the smarter your plan gets" is framed
 * as a bonus, not a requirement) rather than being needed to generate
 * one, and docs/PROJECT_RULES.md explicitly excludes "wearable analytics
 * beyond what is required" from MVP scope. canContinue is left at its
 * default (always true) — this is also the final onboarding step before
 * plan generation, so blocking it on an optional connection would be a
 * real funnel problem, not just a UX nitpick.
 *
 * **Apple Health is real as of this update (see docs/ROADMAP.md); the
 * other four are still exactly what they've always been** — a local
 * `useOnboardingStore` boolean with no real connection behind it
 * (Garmin/COROS/Strava/Zwift integrations don't exist yet). Tapping
 * Apple Health's badge now requests a real HealthKit read-authorization
 * prompt and, on success, syncs recent resting-HR/HRV data via
 * `useConnectAppleHealth` — only then does it flip to "Connected," so
 * the badge never claims a permission that wasn't actually granted. No
 * real "disconnect" here (HealthKit permissions can only be revoked in
 * iOS Settings, not by an app) — once really connected, tapping again
 * is a no-op, unlike the other four rows, which still freely toggle
 * on/off since they're not backed by anything real to begin with.
 */
export function WearablesScreen() {
  const wearables = useOnboardingStore((s) => s.wearables);
  const toggleWearable = useOnboardingStore((s) => s.toggleWearable);
  const { goNext } = useOnboardingNavigation('wearables');

  const { session } = useSession();
  const connectAppleHealth = useConnectAppleHealth(session?.user.id);
  const [appleHealthError, setAppleHealthError] = useState<string | null>(null);

  const handlePress = (key: keyof WearableConnections) => {
    if (key !== 'appleHealth') {
      toggleWearable(key);
      return;
    }
    if (wearables.appleHealth || connectAppleHealth.isPending) return;

    setAppleHealthError(null);
    connectAppleHealth.mutate(undefined, {
      onSuccess: (result) => {
        if (result.ok) {
          toggleWearable('appleHealth');
        } else {
          setAppleHealthError(appleHealthErrorMessage(result.reason));
        }
      },
      onError: () => setAppleHealthError(appleHealthErrorMessage('write_failed')),
    });
  };

  return (
    <OnboardingStepShell step="wearables" title="Connect your devices" showFooter={false}>
      <AppText className="mt-xs text-[13.5px] text-color-secondary">
        The more Pace sees, the smarter your plan gets.
      </AppText>

      <ScrollView className="mt-md flex-1" showsVerticalScrollIndicator={false}>
        {WEARABLE_DEFS.map((wearable) => {
          const connected = wearables[wearable.key];
          const isAppleHealth = wearable.key === 'appleHealth';
          return (
            <View key={wearable.key} className="border-t border-border py-[14px]">
              <View className="flex-row items-center gap-sm">
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
                  onPress={() => handlePress(wearable.key)}
                />
              </View>
              {isAppleHealth && appleHealthError && (
                <AppText className="mt-[6px] text-[11.5px] text-danger">{appleHealthError}</AppText>
              )}
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
