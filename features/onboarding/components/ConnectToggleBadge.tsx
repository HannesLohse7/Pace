import { Pressable } from 'react-native';

import { AppText } from '@/shared/components';
import { colors } from '@/shared/theme/colors';

export interface ConnectToggleBadgeProps {
  connected: boolean;
  onPress: () => void;
}

/**
 * The "Connect"/"Connected" pill badge used by both Calendar's two rows
 * and Wearables' five rows — identical styling in the source, so shared
 * rather than duplicated seven times.
 */
export function ConnectToggleBadge({ connected, onPress }: ConnectToggleBadgeProps) {
  return (
    <Pressable
      onPress={onPress}
      className="shrink-0 rounded-full px-[14px] py-[7px]"
      style={{ backgroundColor: connected ? colors['success-bg'] : colors.surface }}
    >
      <AppText
        className="text-[12px] font-bold"
        style={{ color: connected ? colors.success : colors.color.secondary }}
      >
        {connected ? 'Connected' : 'Connect'}
      </AppText>
    </Pressable>
  );
}
