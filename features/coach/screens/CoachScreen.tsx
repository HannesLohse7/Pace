import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { useSession } from '@/lib/supabase/useSession';
import { AppText, Screen } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import { ChatInputBar, ChatMessageBubble, SuggestedPromptRow } from '../components';
import { cannedReplies, suggestedPrompts } from '../data/mockCoachData';
import { useRecentAdaptationEvents } from '../hooks/useRecentAdaptationEvents';
import type { ChatMessage } from '../types/coach';
import { buildCoachTranscript } from '../utils/buildCoachTranscript';

/**
 * Coach — the last of the original 5 MVP milestone screens, and the
 * last to move off mock data (#16). The chat mechanic itself still has
 * no real AI/LLM integration anywhere in this project (see
 * ARCHITECTURE.md — even the adaptive engine is deterministic rules,
 * not free-form generation): sending a message still echoes one of
 * three scripted `cannedReplies`, an honest placeholder, not a
 * disguised fake backend. That part is unchanged and out of scope here.
 *
 * What changed: the transcript this screen *opens* with is no longer
 * the hardcoded "Alex Rivera, recovery 72" mock persona. It's seeded
 * from the athlete's own real `adaptation_event` history via
 * `buildCoachTranscript.ts` — the same table Workout Detail's HISTORY
 * section reads, just across every workout instead of one. Real
 * schedule-adjustment explanations get the same "SCHEDULE ADJUSTMENT"
 * recommendation bubble the design source always had; they're just
 * genuine now instead of a scripted example.
 *
 * Split into this data-fetching wrapper (loading/error states, same
 * pattern as Home/Training/Progress) and `CoachChat` below, which owns
 * the interactive session and is only ever mounted once the real seed
 * transcript is in hand — its `useState` initializer reads that seed
 * exactly once on mount, so a later background refetch (e.g. tab
 * refocus) can't clobber messages the athlete has already sent this
 * session the way re-deriving from fresh query data on every render
 * would.
 */
export function CoachScreen() {
  const colors = useThemeColors();
  const { session } = useSession();
  const athleteId = session?.user.id;
  const { data: events, isLoading, isError, refetch } = useRecentAdaptationEvents(athleteId);

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom']} className="items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (isError || !events) {
    return (
      <Screen edges={['top', 'bottom']} className="items-center justify-center px-screen-x">
        <AppText className="text-center text-body text-color-secondary">
          Couldn’t load your coach right now.
        </AppText>
        <Pressable onPress={() => refetch()} className="mt-md">
          <AppText className="text-body-sm font-semibold text-accent">Try again</AppText>
        </Pressable>
      </Screen>
    );
  }

  return <CoachChat seedMessages={buildCoachTranscript(events)} />;
}

interface CoachChatProps {
  seedMessages: ChatMessage[];
}

function CoachChat({ seedMessages }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const reply = cannedReplies[Math.floor(Math.random() * cannedReplies.length)]!;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: reply },
    ]);
    setDraft('');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="px-screen-x pb-md pt-lg">
          <AppText className="text-[26px] font-bold tracking-[-0.5px] text-color-primary">
            Coach
          </AppText>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="gap-[14px] px-screen-x pb-md"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message, i) => (
            <ChatMessageBubble key={i} message={message} />
          ))}
        </ScrollView>

        <SuggestedPromptRow prompts={suggestedPrompts} onSelectPrompt={sendMessage} />
        <ChatInputBar value={draft} onChangeText={setDraft} onSend={() => sendMessage(draft)} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
