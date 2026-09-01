import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components';
import { MicIcon } from '@/shared/components/icons';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

export interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

/**
 * Message composer. The mic icon is decorative only (no onPress),
 * matching the design source's own markup, which never wires it to
 * anything — real voice input isn't scoped here. "Send" is disabled
 * (dimmed, no-op) rather than hidden while the draft is empty, so the
 * layout never shifts.
 */
export function ChatInputBar({ value, onChangeText, onSend }: ChatInputBarProps) {
  const colors = useThemeColors();
  const canSend = value.trim().length > 0;

  return (
    <View className="flex-row items-center gap-sm border-t border-border px-screen-x pb-[22px] pt-[10px]">
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.surface }}
      >
        <MicIcon />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Message your coach"
        placeholderTextColor={colors.color.quaternary}
        className="flex-1 border-b border-border-strong px-[2px] py-xs text-[14px] text-color-primary"
        onSubmitEditing={onSend}
        returnKeyType="send"
      />

      <Pressable onPress={onSend} disabled={!canSend} hitSlop={8}>
        <AppText
          className="text-[14px] font-semibold"
          style={{ color: canSend ? colors.accent : colors.color.quaternary }}
        >
          Send
        </AppText>
      </Pressable>
    </View>
  );
}
