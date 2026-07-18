import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from './AppText';

export interface SettingsRowProps {
  label: string;
  /** Trailing control — a Switch, ConnectToggleBadge, mi/km pair, or a static caption. */
  children?: ReactNode;
}

/**
 * Label-left, control-right settings row — the shared chrome behind Dark
 * Mode, Units, Notifications, every Connected Services entry, and
 * Privacy on the Profile screen. Extracted once a second/third row
 * needed the exact same border-top/padding/label layout; not worth it
 * for a single row (Checkpoint 1's Dark Mode didn't get it), worth it
 * now that ~10 rows share it.
 */
export function SettingsRow({ label, children }: SettingsRowProps) {
  return (
    <View className="flex-row items-center border-t border-border px-screen-x py-md">
      <AppText className="flex-1 text-[14px] text-color-primary">{label}</AppText>
      {children}
    </View>
  );
}
