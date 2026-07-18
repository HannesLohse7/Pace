import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from './AppText';

export interface SettingsRowProps {
  label: string;
  /** Trailing control — a Switch, ConnectToggleBadge, mi/km pair, a chevron, or a static caption. */
  children?: ReactNode;
  /** When set, the whole row becomes a single tap target (e.g. "Edit Profile" navigating out), not just its trailing control. */
  onPress?: () => void;
}

const rowClassName = 'flex-row items-center border-t border-border px-screen-x py-md';

/**
 * Label-left, control-right settings row — the shared chrome behind Dark
 * Mode, Units, Notifications, every Connected Services entry, Privacy,
 * and Edit Profile on the Profile screen. Extracted once a second/third
 * row needed the exact same border-top/padding/label layout; not worth
 * it for a single row (Checkpoint 1's Dark Mode didn't get it), worth it
 * now that ~10 rows share it.
 */
export function SettingsRow({ label, children, onPress }: SettingsRowProps) {
  const content = (
    <>
      <AppText className="flex-1 text-[14px] text-color-primary">{label}</AppText>
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={rowClassName}>
        {content}
      </Pressable>
    );
  }

  return <View className={rowClassName}>{content}</View>;
}
