/** The 4 general "what's going on" reasons — "move this workout" is handled separately, on Workout Detail (see `ReportOverrideScreen.tsx`'s doc comment for why). */
export type GeneralOverrideReason = 'illness' | 'travel' | 'poor_recovery' | 'extra_time';

export interface OverrideOption {
  reason: GeneralOverrideReason;
  /** Button label, first-person, matching the product spec's own phrasing ("I'm sick," "I have extra time"). */
  label: string;
  /** Stored as the `adaptation_event.summary` — short and athlete-facing. */
  summary: string;
}
