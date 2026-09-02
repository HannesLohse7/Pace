import type { RecentAdaptationEvent } from '../services/fetchRecentAdaptationEvents';
import type { ChatMessage } from '../types/coach';

const GREETING: ChatMessage = {
  role: 'assistant',
  text: 'Here’s what’s changed in your plan recently — ask me anything below.',
};

const NO_HISTORY_NOTE: ChatMessage = {
  role: 'assistant',
  text: 'No schedule changes yet. This is where I’ll explain anything that adjusts your plan.',
};

/**
 * Seeds Coach's transcript from the athlete's real `adaptation_event`
 * history (#16) instead of the old hardcoded "Alex Rivera, recovery 72"
 * mock — that mock's specific numbers were fabricated for a persona
 * that isn't the signed-in athlete, which is exactly the kind of thing
 * this app avoids everywhere else real data exists (see Home/Training/
 * Progress's own "honest placeholder, never a fabricated number" rule).
 *
 * `events` arrives newest-first (query order, matches Workout Detail's
 * own HISTORY reader); reversed here so the transcript reads like a
 * normal chat log, oldest at the top. Every event becomes a
 * `recommendation`-role message — the same "SCHEDULE ADJUSTMENT"
 * treatment the design source always had for this role, just backed by
 * real rows now (both engine adjustments and manual reschedules log a
 * real athlete-facing `summary`, so nothing here needs to distinguish
 * trigger types). `reasoning` is appended on its own line when present,
 * matching how Workout Detail's HISTORY section renders it.
 *
 * A fixed `GREETING` opens every transcript — not fabricated (no
 * athlete-specific claim), just a stable intro so the screen doesn't
 * open on a bare list. An athlete with no adaptation history yet gets
 * `NO_HISTORY_NOTE` instead of a fabricated example, matching the
 * "coming soon" honesty pattern used elsewhere rather than pretending a
 * scripted example ever happened.
 */
export function buildCoachTranscript(events: RecentAdaptationEvent[]): ChatMessage[] {
  if (events.length === 0) return [GREETING, NO_HISTORY_NOTE];

  const chronological = [...events].reverse();
  const recommendations: ChatMessage[] = chronological.map((event) => ({
    role: 'recommendation',
    text: event.reasoning ? `${event.summary}\n${event.reasoning}` : event.summary,
  }));

  return [GREETING, ...recommendations];
}
