import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useConnectGoogleCalendar } from '@/features/calendar/hooks/useConnectGoogleCalendar';
import { useDisconnectGoogleCalendar } from '@/features/calendar/hooks/useDisconnectGoogleCalendar';
import { ConnectToggleBadge } from '@/features/onboarding/components/ConnectToggleBadge';
import { useAthleteDisplayName } from '@/features/profile/hooks/useAthleteDisplayName';
import { useAppleHealthConnectionStatus } from '@/features/wearables/hooks/useAppleHealthConnectionStatus';
import { useConnectAppleHealth } from '@/features/wearables/hooks/useConnectAppleHealth';
import { useDisconnectAppleHealth } from '@/features/wearables/hooks/useDisconnectAppleHealth';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/lib/supabase/useSession';
import { AppText, Screen, SettingsRow, Switch } from '@/shared/components';
import { useProfileStore, useSettingsStore } from '@/shared/store';
import { useThemeColors, useThemeOverride } from '@/shared/theme/ThemeProvider';

import { getInitials } from '../utils/getInitials';

type ConnectedServiceKey = 'appleCalendar' | 'garmin' | 'coros' | 'strava' | 'zwift';

const CONNECTED_SERVICE_DEFS: { key: ConnectedServiceKey; label: string }[] = [
  { key: 'appleCalendar', label: 'Apple Calendar' },
  { key: 'garmin', label: 'Garmin' },
  { key: 'coros', label: 'COROS' },
  { key: 'strava', label: 'Strava' },
  { key: 'zwift', label: 'Zwift' },
];

/**
 * Independent of `useOnboardingStore`'s calendar/wearable fields (that
 * store is reset on the way into a fresh onboarding attempt as of
 * 2026-09-09 — see `app/index.tsx` — but is still a separate piece of
 * state from this section's own local toggles regardless). Deliberate,
 * not an oversight: avatar, stats, and race goal below are still static
 * mock data, not derived from anything the athlete actually entered.
 * The header name is the one exception — see `useAthleteDisplayName`
 * below. Wiring just Connected Services to the real onboarding store
 * while the rest of the screen stays mock would recreate exactly the
 * "half real, half fake" inconsistency the Home-stays-mock decision was
 * written to avoid — here applied to Profile instead of Home. Seeded
 * with a plausible mix (matching the source's own `devices` mock:
 * Garmin/Zwift connected, COROS not) rather than all-disconnected, so
 * the screen reads as a populated profile rather than an empty one.
 *
 * Google Calendar and Apple Health are deliberately NOT in this map —
 * both now have a real backend behind them (Google Calendar since
 * 2026-09-02; Apple Health as of 2026-09-09, see below), so leaving
 * either badge wired to this same local mock state would itself become
 * the "looks connected but isn't" problem this comment is about, just
 * inverted — which is exactly the real-device bug that got Apple Health
 * pulled out of this map (it used to be seeded `true` here regardless of
 * anything real, and toggling it did nothing). Every remaining row here
 * is still genuinely mock: no real backend exists for Apple Calendar/
 * Garmin/COROS/Strava/Zwift yet.
 */
const INITIAL_CONNECTED_SERVICES: Record<ConnectedServiceKey, boolean> = {
  appleCalendar: false,
  garmin: true,
  coros: false,
  strava: false,
  zwift: true,
};

function appleHealthErrorMessage(
  reason: 'unavailable' | 'authorization_denied' | 'write_failed',
): string {
  switch (reason) {
    case 'unavailable':
      return 'Apple Health isn’t available on this device.';
    case 'authorization_denied':
      return 'Permission wasn’t granted — you can allow it later in iOS Settings.';
    case 'write_failed':
      return "Connected, but couldn't save — try again.";
  }
}

/**
 * Profile shell — Milestone 3 Checkpoint 1 built the header, Race Goal
 * card, and Dark Mode row. Checkpoint 2 added Units, Notifications,
 * Connected Services, and Privacy. Checkpoint 3 adds Edit Profile (real —
 * navigates to a modal, actually mutates `useProfileStore`) and Sign Out.
 *
 * **Sign Out is real now** (2026-09-02) — it used to be an inert tap
 * target because no auth/session concept existed yet; that's no longer
 * true (Google Calendar's real `useSession()` below proves it). Leaving
 * it inert once a real session existed would have been actively
 * misleading rather than an honest placeholder — a signed-in athlete
 * with no way to sign out. It only calls `supabase.auth.signOut()`
 * (2026-09-09, revised on second real-device test) — it does NOT
 * navigate itself. `(tabs)/_layout.tsx` holds a session guard that
 * redirects to `/` the moment `useSession()` reports no session,
 * mounted for as long as any tab is; this screen navigating too, on
 * the same event, raced that guard and produced a confirmed,
 * real-device blank-screen bounce between routes. One place reacting
 * to "session is gone" is correct; two competing on the same signal is
 * the bug this replaced.
 *
 * Subscription isn't built — not asked for this checkpoint and there's
 * no real entitlement/subscription state to show yet.
 *
 * **Google Calendar's row is real** (added 2026-09-02) — this is now its
 * permanent home, not just onboarding's Calendar step. Onboarding's real
 * account-creation call (`supabase.auth.signUp`) only fires on the very
 * last onboarding screen (Generating), which comes *after* onboarding's
 * own Calendar step — so there is never a signed-in athlete yet at the
 * point onboarding shows that Connect button, and it can't succeed from
 * there. Profile is reached only once an athlete is actually signed in,
 * so it's the one place "Connect Google Calendar" can work today, and
 * it's also the sensible long-term home for reconnect/disconnect (an
 * athlete revoking access from Google's side, say). Onboarding's own
 * Calendar step is unchanged — still real, still there, just can't be
 * exercised until this screen exists, which is what this change is for.
 *
 * **Apple Health's row is real too now (fixed 2026-09-09, real-device
 * bug)** — it used to sit in the same mock `connectedServices` map as
 * Garmin/COROS/Strava/Zwift, hardcoded `true` regardless of anything
 * real, and toggling it just flipped a local boolean. Confirmed on a
 * real device: revoking HealthKit access in iOS Settings never updated
 * it (nothing here ever read the real state), and tapping it just
 * flipped the label back and forth with no real behavior underneath.
 * It now reads `wearable_connection.status` via
 * `useAppleHealthConnectionStatus` and drives the same real
 * connect/disconnect hooks onboarding's Wearables step and
 * `GeneratingScreen.tsx` already use — see those hooks' own doc comments
 * for one HealthKit-specific honesty note worth reading before touching
 * this again: unlike Google Calendar, there is no OS-level notification
 * Pace could listen for if the athlete revokes access later, and a
 * revoked/denied read authorization generally doesn't throw, it just
 * silently returns zero samples — so "Connected" here means "Pace's own
 * record says connected," not "HealthKit access is definitely still
 * granted right now." `daysSynced === 0` on a fresh connect is surfaced
 * in the status line below specifically because of that gap.
 */
export function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { isDarkOverridden, setDarkOverride } = useThemeOverride();
  const profile = useProfileStore((s) => s.profile);
  const units = useSettingsStore((s) => s.units);
  const setUnits = useSettingsStore((s) => s.setUnits);

  const { session } = useSession();
  const athleteId = session?.user.id;
  // Falls back to the mock name until the real one loads (or if the
  // query has no session / errors) rather than a blank header -- see
  // `useAthleteDisplayName`'s own doc comment for why this is the one
  // field on this screen worth this vs. staying mock.
  const { data: displayName } = useAthleteDisplayName(athleteId);
  const name = displayName ?? profile.name;
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

  const appleHealthStatus = useAppleHealthConnectionStatus(athleteId);
  const connectAppleHealth = useConnectAppleHealth(athleteId);
  const disconnectAppleHealth = useDisconnectAppleHealth(athleteId);
  const [appleHealthError, setAppleHealthError] = useState<string | null>(null);

  const appleHealthConnected = appleHealthStatus.data === 'connected';
  const appleHealthBusy = connectAppleHealth.isPending || disconnectAppleHealth.isPending;

  const handleAppleHealthPress = () => {
    if (appleHealthBusy) return;
    setAppleHealthError(null);
    if (appleHealthConnected) {
      disconnectAppleHealth.mutate(undefined, {
        onError: () => setAppleHealthError("Couldn't disconnect — try again."),
      });
      return;
    }
    connectAppleHealth.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.ok) setAppleHealthError(appleHealthErrorMessage(result.reason));
      },
      onError: () => setAppleHealthError(appleHealthErrorMessage('unavailable')),
    });
  };

  const connectResult = connectAppleHealth.data;
  const appleHealthSyncedNothing =
    appleHealthConnected &&
    connectResult !== undefined &&
    connectResult.ok &&
    connectResult.daysSynced === 0;

  const appleHealthStatusLine = appleHealthBusy
    ? disconnectAppleHealth.isPending
      ? 'Disconnecting…'
      : 'Connecting…'
    : (appleHealthError ??
      (appleHealthSyncedNothing
        ? 'Connected, but no recent data came back — check it’s still allowed in iOS Settings.'
        : null));

  // Visual stub only — no real push-notification permission request or
  // wiring. Matches the same UI-only reasoning as onboarding's
  // Calendar/Wearables toggles: this just flips a local boolean.
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [connectedServices, setConnectedServices] = useState(INITIAL_CONNECTED_SERVICES);
  const toggleService = (key: ConnectedServiceKey) => {
    setConnectedServices((s) => ({ ...s, [key]: !s[key] }));
  };

  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    // Revised 2026-09-09, second real-device test. The first fix here
    // added a try/catch/finally so a `signOut()` rejection couldn't
    // leave `isSigningOut` stuck forever -- that part was right, kept
    // below. But its `finally` also called `router.replace('/')`
    // itself, in addition to the session guard just added to
    // `(tabs)/_layout.tsx` (which redirects on its own the moment
    // session goes null). Both fire off the same sign-out: the guard
    // reacts immediately to `onAuthStateChange`, then this `finally`'s
    // own `replace('/')` lands a moment later on whatever route the
    // guard had already navigated to, replacing it right back to `/`
    // and re-triggering the whole redirect chain again -- a real,
    // confirmed-on-device navigation race, not hypothetical (it showed
    // up as a blank screen bouncing between routes after sign-out).
    // Two places independently navigating on the same event is the bug,
    // not which of the two. Fix: exactly one place does it. The layout
    // guard is the right owner -- it already has to exist as a backstop
    // for the case `signOut()` throws before the local session clears,
    // so this screen no longer calls `router.replace` at all and just
    // lets that guard react once, like everything else that depends on
    // `useSession()`.
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[profile] signOut returned an error:', error.message);
      }
    } catch (err) {
      console.error('[profile] signOut threw:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} className="pb-2xl pt-lg">
      <View className="flex-row items-center gap-md px-screen-x">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-tint">
          <AppText className="text-[20px] font-bold text-accent">{getInitials(name)}</AppText>
        </View>
        <View>
          <AppText className="text-[19px] font-bold text-color-primary">{name}</AppText>
          <AppText className="mt-[3px] text-caption text-color-tertiary">
            {profile.weeklyHours} hrs/wk · {profile.disciplines} disciplines
          </AppText>
          <AppText className="mt-[3px] text-caption-sm text-color-tertiary">
            Member since {profile.joinDate}
          </AppText>
        </View>
      </View>

      <View className="mt-2xl bg-surface-dark-alt px-screen-x py-xl">
        <AppText
          mono
          className="mb-xs text-[10px] font-semibold tracking-[1px] text-color-inverse-secondary"
        >
          RACE GOAL
        </AppText>
        <AppText className="text-[16px] font-bold text-color-inverse">{profile.raceName}</AppText>
        <AppText className="mt-[3px] text-[12px] text-color-inverse-secondary">
          {profile.raceDate} · {profile.daysToRace} days
        </AppText>
      </View>

      <AppText className="mb-xs mt-2xl px-screen-x text-eyebrow text-color-tertiary">
        SETTINGS
      </AppText>
      <View>
        <SettingsRow label="Dark Mode">
          <Switch value={isDarkOverridden} onValueChange={setDarkOverride} />
        </SettingsRow>

        <SettingsRow label="Units">
          <View className="flex-row gap-md">
            <AppText
              onPress={() => setUnits('mi')}
              className="text-[13px] font-semibold"
              style={{ color: units === 'mi' ? colors.color.primary : colors.neutral[300] }}
            >
              mi
            </AppText>
            <AppText
              onPress={() => setUnits('km')}
              className="text-[13px] font-semibold"
              style={{ color: units === 'km' ? colors.color.primary : colors.neutral[300] }}
            >
              km
            </AppText>
          </View>
        </SettingsRow>

        <SettingsRow label="Notifications">
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </SettingsRow>
      </View>

      <AppText className="mb-xs mt-2xl px-screen-x text-eyebrow text-color-tertiary">
        CONNECTED SERVICES
      </AppText>
      <View>
        <View className="border-t border-border px-screen-x py-md">
          <View className="flex-row items-center gap-sm">
            <AppText className="flex-1 text-[14px] text-color-primary">Google Calendar</AppText>
            <ConnectToggleBadge connected={googleConnected} onPress={handleGooglePress} />
          </View>
          {googleStatusLine && (
            <AppText className="mt-[6px] text-[11.5px] text-color-tertiary">
              {googleStatusLine}
            </AppText>
          )}
        </View>
        <View className="border-t border-border px-screen-x py-md">
          <View className="flex-row items-center gap-sm">
            <AppText className="flex-1 text-[14px] text-color-primary">Apple Health</AppText>
            <ConnectToggleBadge connected={appleHealthConnected} onPress={handleAppleHealthPress} />
          </View>
          {appleHealthStatusLine && (
            <AppText className="mt-[6px] text-[11.5px] text-color-tertiary">
              {appleHealthStatusLine}
            </AppText>
          )}
        </View>
        {CONNECTED_SERVICE_DEFS.map((service) => (
          <SettingsRow key={service.key} label={service.label}>
            <ConnectToggleBadge
              connected={connectedServices[service.key]}
              onPress={() => toggleService(service.key)}
            />
          </SettingsRow>
        ))}
      </View>

      <View className="mt-2xl">
        <SettingsRow label="Privacy">
          <AppText className="text-[12.5px] text-color-quaternary">Coming soon</AppText>
        </SettingsRow>
      </View>

      <AppText className="mb-xs mt-2xl px-screen-x text-eyebrow text-color-tertiary">
        ACCOUNT
      </AppText>
      <View>
        <SettingsRow label="Edit Profile" onPress={() => router.push('/edit-profile')}>
          <AppText className="text-[16px] text-color-quaternary">›</AppText>
        </SettingsRow>

        <Pressable
          onPress={handleSignOut}
          disabled={isSigningOut}
          className="border-t border-border px-screen-x py-md"
        >
          <AppText className="text-center text-[14px] font-semibold text-danger">
            {isSigningOut ? 'Signing out…' : 'Sign Out'}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
