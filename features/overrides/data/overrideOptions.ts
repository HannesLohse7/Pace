import type { OverrideOption } from '../types/overrides';

/**
 * The 4 general override reasons, in the order the product spec lists
 * them. No design-export reference exists for this screen (there's no
 * mock/source for it, unlike every other screen in this app) — see
 * `ReportOverrideScreen.tsx`'s doc comment for the layout this borrows
 * instead.
 */
export const OVERRIDE_OPTIONS: OverrideOption[] = [
  { reason: 'illness', label: 'I’m sick', summary: 'Reported feeling sick.' },
  { reason: 'travel', label: 'I’m traveling', summary: 'Reported traveling.' },
  { reason: 'poor_recovery', label: 'I slept poorly', summary: 'Reported poor sleep.' },
  {
    reason: 'extra_time',
    label: 'I have extra time today',
    summary: 'Reported having extra time available today.',
  },
];
