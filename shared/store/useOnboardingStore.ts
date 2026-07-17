import { create } from 'zustand';

/**
 * Onboarding flow state — the multi-step form data that needs to persist
 * across the splash → welcome → account → goal → race → availability →
 * calendar → wearables → generating flow (the approved design export's
 * step machine), so it survives navigating between those steps.
 *
 * This store only holds shape + setters for Milestone 2 to build the
 * onboarding screens against — no screens consume it yet.
 *
 * Not persisted (no AsyncStorage): whether onboarding progress should
 * survive an app restart isn't decided anywhere in docs/PRODUCT_SPEC.md,
 * docs/PROJECT_RULES.md, or docs/ARCHITECTURE.md as of this milestone.
 * Flagging rather than guessing — add persistence once that's an explicit
 * product decision, not before.
 */

export const ONBOARDING_STEPS = [
  'splash',
  'welcome',
  'account',
  'goal',
  'race',
  'availability',
  'calendar',
  'wearables',
  'generating',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingGoal = 'Sprint' | 'Olympic' | '70.3' | 'Ironman' | 'Custom';

export type TrainingDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type PreferredTimeOfDay = 'morning' | 'midday' | 'evening';

export interface WearableConnections {
  appleHealth: boolean;
  garmin: boolean;
  coros: boolean;
  strava: boolean;
  zwift: boolean;
}

export interface OnboardingState {
  step: OnboardingStep;

  // account
  accountName: string;
  accountEmail: string;

  // goal + race
  goal: OnboardingGoal | null;
  raceName: string;
  raceDate: string;

  // availability
  weeklyHours: number;
  trainingDays: TrainingDay[];
  longWorkoutDay: TrainingDay;
  preferredTimeOfDay: PreferredTimeOfDay;

  // connect
  googleCalendarConnected: boolean;
  appleCalendarConnected: boolean;
  wearables: WearableConnections;
}

export interface OnboardingActions {
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  setAccountName: (name: string) => void;
  setAccountEmail: (email: string) => void;

  selectGoal: (goal: OnboardingGoal) => void;
  setRaceName: (name: string) => void;
  setRaceDate: (date: string) => void;

  setWeeklyHours: (hours: number) => void;
  toggleTrainingDay: (day: TrainingDay) => void;
  setLongWorkoutDay: (day: TrainingDay) => void;
  setPreferredTimeOfDay: (time: PreferredTimeOfDay) => void;

  toggleGoogleCalendar: () => void;
  toggleAppleCalendar: () => void;
  toggleWearable: (key: keyof WearableConnections) => void;

  reset: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;

/**
 * Defaults match the approved design export's own starting values (9
 * hrs/week, training Mon/Wed/Fri/Sat/Sun, long day Saturday, morning
 * preference) — a pre-filled reasonable starting point for a new athlete,
 * not placeholder mock data, per docs/PROJECT_RULES.md's "make
 * recommendations instead of asking unnecessary questions" UX rule.
 */
const initialState: OnboardingState = {
  step: 'splash',
  accountName: '',
  accountEmail: '',
  goal: null,
  raceName: '',
  raceDate: '',
  weeklyHours: 9,
  trainingDays: ['mon', 'wed', 'fri', 'sat', 'sun'],
  longWorkoutDay: 'sat',
  preferredTimeOfDay: 'morning',
  googleCalendarConnected: false,
  appleCalendarConnected: false,
  wearables: {
    appleHealth: false,
    garmin: false,
    coros: false,
    strava: false,
    zwift: false,
  },
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...initialState,

  goToStep: (step) => set({ step }),
  nextStep: () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(get().step);
    const nextIndex = Math.min(currentIndex + 1, ONBOARDING_STEPS.length - 1);
    set({ step: ONBOARDING_STEPS[nextIndex] });
  },
  prevStep: () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(get().step);
    const prevIndex = Math.max(currentIndex - 1, 0);
    set({ step: ONBOARDING_STEPS[prevIndex] });
  },

  setAccountName: (accountName) => set({ accountName }),
  setAccountEmail: (accountEmail) => set({ accountEmail }),

  selectGoal: (goal) => set({ goal }),
  setRaceName: (raceName) => set({ raceName }),
  setRaceDate: (raceDate) => set({ raceDate }),

  setWeeklyHours: (weeklyHours) => set({ weeklyHours }),
  toggleTrainingDay: (day) =>
    set((s) => ({
      trainingDays: s.trainingDays.includes(day)
        ? s.trainingDays.filter((d) => d !== day)
        : [...s.trainingDays, day],
    })),
  setLongWorkoutDay: (longWorkoutDay) => set({ longWorkoutDay }),
  setPreferredTimeOfDay: (preferredTimeOfDay) => set({ preferredTimeOfDay }),

  toggleGoogleCalendar: () => set((s) => ({ googleCalendarConnected: !s.googleCalendarConnected })),
  toggleAppleCalendar: () => set((s) => ({ appleCalendarConnected: !s.appleCalendarConnected })),
  toggleWearable: (key) =>
    set((s) => ({ wearables: { ...s.wearables, [key]: !s.wearables[key] } })),

  reset: () => set(initialState),
}));
