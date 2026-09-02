/**
 * Remaining mock data for the Coach screen. `initialChatMessages` (the
 * "Alex Rivera, recovery 72" scripted transcript) was removed in #16 —
 * Coach's opening transcript is now real, built from the athlete's own
 * `adaptation_event` history (`utils/buildCoachTranscript.ts`), not a
 * fabricated persona example.
 *
 * `suggestedPrompts` and `cannedReplies` are still exactly what they
 * were: ported from `design/Triathlon Coach App.dc.html`'s
 * `suggestedPrompts` and `canned()` method. There is no real AI/LLM
 * call anywhere in this project (per ARCHITECTURE.md, even the
 * adaptive engine itself is deterministic rules, not free-form
 * generation), so free-text chat send/reply stays an honest scripted
 * mock — wiring it to a real assistant is a separate, later milestone,
 * out of scope for #16 (which only made the *opening* explanations
 * real, not the ongoing conversation).
 */
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
