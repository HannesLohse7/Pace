import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AppText, Screen } from '@/shared/components';

import { ChatInputBar, ChatMessageBubble, SuggestedPromptRow } from '../components';
import { cannedReplies, initialChatMessages, suggestedPrompts } from '../data/mockCoachData';
import type { ChatMessage } from '../types/coach';

/**
 * Coach — the last of the original 5 MVP milestone screens. Ported from
 * the design source's Coach tab: a scrolling chat transcript (with a
 * distinct "schedule adjustment" treatment for plan-change explanations,
 * separate from ordinary chat bubbles), a row of suggested prompts, and
 * a text composer.
 *
 * There is no real AI/LLM integration anywhere in this project yet (see
 * ARCHITECTURE.md — even the adaptive engine itself is still
 * unimplemented, deterministic-rules-only by design, not free-form
 * generation). Sending a message appends it to the transcript and
 * echoes back one of three scripted `cannedReplies`, exactly matching
 * the design source's own `canned()` mock — an honest placeholder, not
 * a disguised fake backend. Wiring this to a real assistant is a
 * separate, later milestone.
 *
 * Chat state is local `useState`, not a Zustand store — nothing else
 * reads it (unlike e.g. `useTrainingStore`, which Workout Detail also
 * consumes), matching the same "keep it local until something else
 * needs it" precedent as Profile's notification/connected-service
 * toggles. Expo Router's tab navigator keeps visited tabs mounted by
 * default, so this still survives switching tabs within a session.
 */
export function CoachScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
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
