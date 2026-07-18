import { create } from 'zustand';

/**
 * General app settings — currently just display units. Lives in its own
 * store (not `useOnboardingStore`, which is specifically the onboarding
 * flow's step data) since this is a general, ongoing app preference, not
 * part of a one-time intake flow.
 *
 * Global rather than local to ProfileScreen: unlike Notifications (a
 * pure UI stub nothing else will ever read) and Connected Services
 * (deliberately independent of everything else — see ProfileScreen),
 * Units is a real preference other screens will eventually need to read
 * to format distances/paces. Home doesn't consume this yet — wiring
 * actual unit conversion into its displayed values is a separate,
 * larger change touching every mockHomeData consumer, flagged as a
 * follow-up rather than guessed at here — but the toggle itself needs to
 * live somewhere screens other than Profile can reach, so it's global
 * now rather than needing a later refactor out of component-local state.
 *
 * Not persisted (no AsyncStorage), matching the same no-persistence-
 * until-actually-needed pattern as the onboarding store and the dark
 * mode override: resets to the default on every app restart.
 */

export type Units = 'mi' | 'km';

export interface SettingsState {
  units: Units;
}

export interface SettingsActions {
  setUnits: (units: Units) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set) => ({
  units: 'mi',
  setUnits: (units) => set({ units }),
}));
