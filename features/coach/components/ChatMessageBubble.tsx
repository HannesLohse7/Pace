import { View } from 'react-native';

import { AppText } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { ChatMessage } from '../types/coach';

export interface ChatMessageBubbleProps {
  message: ChatMessage;
}

/**
 * Renders one chat turn. `recommendation` messages (Pace explaining a
 * schedule change) get their own distinct treatment — a left accent
 * border plus a "SCHEDULE ADJUSTMENT" label, not a chat bubble — matching
 * the design source's `m.isRec` branch exactly. `user`/`assistant`
 * messages (`m.isNormal`) get the ordinary bubble treatment, aligned and
 * colored by who sent them.
 *
 * The assistant bubble background (`colors.surface`) is a deliberate
 * substitution for the source's literal `#F5F5F3` — close enough to be
 * visually equivalent to the source's one-off value, but a real token
 * with a proper dark-mode counterpart, unlike a bare hardcoded hex.
 */
export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const colors = useThemeColors();

  if (message.role === 'recommendation') {
    return (
      <View
        className="max-w-[88%] self-start border-l-2 py-[2px] pl-[14px]"
        style={{ borderColor: colors.success }}
      >
        <AppText
          mono
          className="mb-[5px] text-[10px] font-bold tracking-[0.6px]"
          style={{ color: colors.success }}
        >
          SCHEDULE ADJUSTMENT
        </AppText>
        <AppText className="text-[13.5px] leading-[1.5] text-color-primary">{message.text}</AppText>
      </View>
    );
  }

  const isUser = message.role === 'user';
  return (
    <View
      className="max-w-[82%] rounded-[18px] px-[15px] py-[11px]"
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser ? colors['surface-dark'] : colors.surface,
      }}
    >
      <AppText
        className="text-[13.5px] leading-[1.48]"
        style={{ color: isUser ? colors.color.inverse : colors.color.primary }}
      >
        {message.text}
      </AppText>
    </View>
  );
}
