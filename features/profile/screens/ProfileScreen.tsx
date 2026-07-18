import { useState } from 'react';
import { View } from 'react-native';

import { ConnectToggleBadge } from '@/features/onboarding/components/ConnectToggleBadge';
import { AppText, Screen, SettingsRow, Switch } from '@/shared/components';
import { useSettingsStore } from '@/shared/store';
import { useThemeColors, useThemeOverride } from '@/shared/theme/ThemeProvider';

import { athleteProfile } from '../data/mockProfileData';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

type ConnectedServiceKey =
  'googleCalendar' | 'appleCalendar' | 'appleHealth' | 'garmin' | 'coros' | 'strava' | 'zwift';

const CONNECTED_SERVICE_DEFS: { key: ConnectedServiceKey; label: string }[] = [
  { key: 'googleCalendar', label: 'Google Calendar' },
  { key: 'appleCalendar', label: 'Apple Calendar' },
  { key: 'appleHealth', label: 'Apple Health' },
  { key: 'garmin', label: 'Garmin' },
  { key: 'coros', label: 'COROS' },
  { key: 'strava', label: 'Strava' },
  { key: 'zwift', label: 'Zwift' },
];

/**
 * Independent of `useOnboardingStore`'s calendar/wearable fields, even
 * though that store still holds real values from whatever the user
 * toggled during onboarding and nothing ever resets it. Deliberate, not
 * an oversight: every other piece of this screen (name, avatar, stats,
 * race goal) is still static mock data too, not derived from what the
 * user actually entered in onboarding (e.g. accountName). Wiring just
 * Connected Services to the real onboarding store while the rest of the
 * screen stays mock would recreate exactly the "half real, half fake"
 * inconsistency the Home-stays-mock decision was written to avoid —
 * here applied to Profile instead of Home. Seeded with a plausible mix
 * (matching the source's own `devices` mock: Garmin/Apple Health/Zwift
 * connected, COROS not) rather than all-disconnected, so the screen
 * reads as a populated profile rather than an empty one.
 */
const INITIAL_CONNECTED_SERVICES: Record<ConnectedServiceKey, boolean> = {
  googleCalendar: false,
  appleCalendar: false,
  appleHealth: true,
  garmin: true,
  coros: false,
  strava: false,
  zwift: true,
};

/**
 * Profile shell — Milestone 3 Checkpoint 1 built the header, Race Goal
 * card, and Dark Mode row. Checkpoint 2 adds the rest of the design
 * export's settings list: Units, Notifications, Connected Services, and
 * Privacy.
 *
 * Subscription isn't built — not asked for this checkpoint and there's
 * no real entitlement/subscription state to show yet.
 */
export function ProfileScreen() {
  const colors = useThemeColors();
  const { isDarkOverridden, setDarkOverride } = useThemeOverride();
  const units = useSettingsStore((s) => s.units);
  const setUnits = useSettingsStore((s) => s.setUnits);

  // Visual stub only — no real push-notification permission request or
  // wiring. Matches the same UI-only reasoning as onboarding's
  // Calendar/Wearables toggles: this just flips a local boolean.
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [connectedServices, setConnectedServices] = useState(INITIAL_CONNECTED_SERVICES);
  const toggleService = (key: ConnectedServiceKey) => {
    setConnectedServices((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <Screen scroll edges={['top', 'bottom']} className="pb-2xl pt-lg">
      <View className="flex-row items-center gap-md px-screen-x">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-tint">
          <AppText className="text-[20px] font-bold text-accent">
            {getInitials(athleteProfile.name)}
          </AppText>
        </View>
        <View>
          <AppText className="text-[19px] font-bold text-color-primary">
            {athleteProfile.name}
          </AppText>
          <AppText className="mt-[3px] text-caption text-color-tertiary">
            {athleteProfile.weeklyHours} hrs/wk · {athleteProfile.disciplines} disciplines
          </AppText>
          <AppText className="mt-[3px] text-caption-sm text-color-tertiary">
            Member since {athleteProfile.joinDate}
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
        <AppText className="text-[16px] font-bold text-color-inverse">
          {athleteProfile.raceName}
        </AppText>
        <AppText className="mt-[3px] text-[12px] text-color-inverse-secondary">
          {athleteProfile.raceDate} · {athleteProfile.daysToRace} days
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
    </Screen>
  );
}
