import { Pressable, ScrollView } from 'react-native';

import { AppText } from '@/shared/components';

export interface SuggestedPromptRowProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

/**
 * Horizontal row of tappable suggested-question chips above the chat
 * input, matching the design source's `suggestedPrompts` row. Chip
 * styling mirrors the equipment tags on Workout Detail
 * (`border-border-strong`, full-radius pill) — the closest existing
 * "small tappable pill" pattern already in this codebase.
 */
export function SuggestedPromptRow({ prompts, onSelectPrompt }: SuggestedPromptRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-xs px-screen-x py-sm"
    >
      {prompts.map((prompt) => (
        <Pressable
          key={prompt}
          onPress={() => onSelectPrompt(prompt)}
          className="rounded-full border border-border-strong px-[14px] py-xs"
        >
          <AppText className="text-[12px] font-medium text-color-secondary">{prompt}</AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
