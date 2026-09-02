import { useState } from 'react';
import { View } from 'react-native';

import { useConnectGoogleCalendar } from '@/features/calendar/hooks/useConnectGoogleCalendar';
import { useDisconnectGoogleCalendar } from '@/features/calendar/hooks/useDisconnectGoogleCalendar';
import { useSession } from '@/lib/supabase/useSession';
import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';

import { ConnectToggleBadge } from '../components/ConnectToggleBadge';
import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

/**
 * No gating: calendar connection is explicitly skippable in the source
 * (the "Skip for now" line below the button) and isn't required to
 * generate a first plan — matching docs/PROJECT_RULES.md's "avoid
 * unnecessary questions" UX rule. canContinue is left at its default
 * (always true).
 *
 * **Google Calendar is real as of this update** (see docs/ROADMAP.md) —
 * tapping its badge starts a genuine OAuth connect flow (opens Google's
 * consent screen in a system browser, then polls for the connection to
 * land — see `useConnectGoogleCalendar`'s own doc comment for why it has
 * to work this way without a dev client). Tapping again while connected
 * disconnects for real (revokes the token with Google, not just a local
 * toggle). **Apple Calendar is still exactly what it always was** — a
 * local `useOnboardingStore` boolean with no real connection behind it
 * (EventKit isn't built yet: it's a native module with the same Expo
 * Go/dev-client constraint Apple HealthKit already hit, so building it
 * now would stack a second untested native integration rather than
 * finishing one — see docs/ROADMAP.md).
 */
export function CalendarScreen() {
  const appleCalendarConnected = useOnboardingStore((s) => s.appleCalendarConnected);
  const toggleAppleCalendar = useOnboardingStore((s) => s.toggleAppleCalendar);
  const { goNext } = useOnboardingNavigation('calendar');

  const { session } = useSession();
  const athleteId = session?.user.id;
  const google = useConnectGoogleCalendar(athleteId);
  const disconnectGoogle = useDisconnectGoogleCalendar(athleteId);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const googleConnected = google.status === 'connected';
  const googleBusy = google.isConnectPending || google.isWaiting || disconnectGoogle.isPending;

  const handleGooglePress = () => {
    if (googleBusy) return;
    setGoogleError(null);
    if (googleConnected) {
      disconnectGoogle.mutate(undefined, {
        onError: () => setGoogleError("Couldn't disconnect — try again."),
      });
    } else {
      google.connect();
    }
  };

  const googleStatusLine = googleBusy
    ? 'Waiting for Google…'
    : (googleError ?? (google.connectError ? "Couldn't connect — try again." : null));

  return (
    <OnboardingStepShell
      step="calendar"
      title="Connect your calendar"
      footerExtra={
        <AppText onPress={goNext} className="mt-md text-center text-[13px] text-color-tertiary">
          Skip for now
        </AppText>
      }
    >
      <AppText className="mt-[14px] text-[13.5px] leading-[1.6] text-color-secondary">
        Pace reads your busy blocks — never event details — so it can schedule sessions around
        meetings and travel instead of on top of them.
      </AppText>

      <View className="mt-[18px]">
        <View className="border-t border-border py-md">
          <View className="flex-row items-center gap-sm">
            <AppText className="flex-1 text-[15px] font-semibold text-color-primary">
              Google Calendar
            </AppText>
            <ConnectToggleBadge connected={googleConnected} onPress={handleGooglePress} />
          </View>
          {googleStatusLine && (
            <AppText className="mt-[6px] text-[11.5px] text-color-tertiary">
              {googleStatusLine}
            </AppText>
          )}
        </View>
        <View className="flex-row items-center gap-sm border-t border-border py-md">
          <AppText className="flex-1 text-[15px] font-semibold text-color-primary">
            Apple Calendar
          </AppText>
          <ConnectToggleBadge connected={appleCalendarConnected} onPress={toggleAppleCalendar} />
        </View>
      </View>

      <AppText className="mt-[14px] text-[11.5px] leading-[1.5] text-color-tertiary">
        Pace only ever checks whether a time is free or busy — never event titles, locations, or
        guests.
      </AppText>
    </OnboardingStepShell>
  );
}
