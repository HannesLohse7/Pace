import { View } from 'react-native';

import { AppText, Screen, Switch } from '@/shared/components';
import { useThemeOverride } from '@/shared/theme/ThemeProvider';

import { athleteProfile } from '../data/mockProfileData';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Profile shell — Milestone 3 Checkpoint 1: static athlete display plus
 * the Dark Mode manual-override row (its real home, deferred from the
 * dark-mode checkpoint specifically for this screen).
 *
 * Scope note: the design export's Profile screen also has Devices,
 * Notifications, Units, and Privacy rows below Dark Mode. Those aren't
 * built here — they'd each need either real state that doesn't exist yet
 * (device connections, notification permissions, unit preference) or
 * would just be inert decoration, neither of which fits "shell + static
 * display." Only Dark Mode is built because it's explicitly functional
 * this checkpoint. The header (name/avatar/stats) and Race Goal card are
 * included since they're genuinely static "basic info," matching what
 * the source's Profile screen shows.
 */
export function ProfileScreen() {
  const { isDarkOverridden, setDarkOverride } = useThemeOverride();

  return (
    <Screen scroll edges={['top', 'bottom']} className="pt-lg">
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

      <View className="mt-sm">
        <View className="flex-row items-center border-t border-border px-screen-x py-md">
          <AppText className="flex-1 text-[14px] text-color-primary">Dark Mode</AppText>
          <Switch value={isDarkOverridden} onValueChange={setDarkOverride} />
        </View>
      </View>
    </Screen>
  );
}
