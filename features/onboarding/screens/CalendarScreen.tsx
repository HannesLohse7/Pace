import { View } from 'react-native';

import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';

import { ConnectToggleBadge } from '../components/ConnectToggleBadge';
import { OnboardingStepShell } from '../components/OnboardingStepShell';

/**
 * No gating: calendar connection is explicitly skippable in the source
 * (the inert "Skip for now" line below the button) and isn't required to
 * generate a first plan — matching docs/PROJECT_RULES.md's "avoid
 * unnecessary questions" UX rule. canContinue is left at its default
 * (always true).
 */
export function CalendarScreen() {
  const googleCalendarConnected = useOnboardingStore((s) => s.googleCalendarConnected);
  const appleCalendarConnected = useOnboardingStore((s) => s.appleCalendarConnected);
  const toggleGoogleCalendar = useOnboardingStore((s) => s.toggleGoogleCalendar);
  const toggleAppleCalendar = useOnboardingStore((s) => s.toggleAppleCalendar);

  return (
    <OnboardingStepShell
      step="calendar"
      title="Connect your calendar"
      footerExtra={
        <AppText className="mt-md text-center text-[13px] text-color-tertiary">
          Skip for now
        </AppText>
      }
    >
      <AppText className="mt-[14px] text-[13.5px] leading-[1.6] text-color-secondary">
        Pace reads your busy blocks — never event details — so it can schedule sessions around
        meetings and travel instead of on top of them.
      </AppText>

      <View className="mt-[18px]">
        <View className="flex-row items-center gap-sm border-t border-border py-md">
          <AppText className="flex-1 text-[15px] font-semibold text-color-primary">
            Google Calendar
          </AppText>
          <ConnectToggleBadge connected={googleCalendarConnected} onPress={toggleGoogleCalendar} />
        </View>
        <View className="flex-row items-center gap-sm border-t border-border py-md">
          <AppText className="flex-1 text-[15px] font-semibold text-color-primary">
            Apple Calendar
          </AppText>
          <ConnectToggleBadge connected={appleCalendarConnected} onPress={toggleAppleCalendar} />
        </View>
      </View>

      <AppText className="mt-[14px] text-[11.5px] leading-[1.5] text-color-tertiary">
        Your calendar data stays on-device and is never shared with third parties.
      </AppText>
    </OnboardingStepShell>
  );
}
