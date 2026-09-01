/** Lean types covering only what the Coach screen renders. */

/**
 * `recommendation` is a distinct visual treatment from ordinary chat —
 * Pace explaining a schedule change, not a conversational turn — matching
 * the design source's `m.isRec` / `m.isNormal` split.
 */
export type ChatMessageRole = 'user' | 'assistant' | 'recommendation';

export interface ChatMessage {
  role: ChatMessageRole;
  text: string;
}
