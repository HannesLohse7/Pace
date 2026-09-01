/**
 * Mock data for the Coach screen, ported from `state.chatMessages` and
 * `suggestedPrompts` on `design/Triathlon Coach App.dc.html`'s
 * `Component` class — same athlete/week as every other screen's mock
 * data (Alex Rivera, recovery 72, Wednesday's bike-threshold session).
 *
 * `cannedReplies` ports the source's own `canned()` method — a
 * hardcoded, randomly-picked reply used whenever the athlete sends a
 * message. There is no real AI/LLM call anywhere in this project yet
 * (per ARCHITECTURE.md, even the adaptive engine itself is still
 * unimplemented — deterministic rules by design, not free-form
 * generation), so this chat is, like the source, an honest scripted
 * mock rather than a fake backend pretending to be smarter than it is.
 */
import type { ChatMessage } from '../types/coach';

export const initialChatMessages: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'Good morning, Alex. Recovery is at 72 today — solid enough to keep today’s bike threshold session as planned.',
  },
  { role: 'user', text: 'Why did you move my long run?' },
  {
    role: 'assistant',
    text: 'Your recovery dropped from 81 to 68 after Sunday’s long run, mostly driven by lower HRV overnight.',
  },
  {
    role: 'recommendation',
    text: 'Move tomorrow’s long run to Friday because recovery is lower than expected.',
  },
];

export const suggestedPrompts = [
  'Why this workout today?',
  'Move my long run',
  'How’s my fitness trending?',
  'Am I ready for race day?',
];

export const cannedReplies = [
  'Got it — I’ll factor that into tomorrow’s plan.',
  'Noted. I’ll keep monitoring your recovery and adjust if needed.',
  'Good question — based on your last 4 weeks, you’re trending well toward race readiness.',
];
