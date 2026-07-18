import { create } from 'zustand';

import { athleteProfile } from '@/features/profile/data/mockProfileData';
import type { AthleteProfile } from '@/features/profile/types/profile';

/**
 * Wraps `mockProfileData.ts`'s static athlete profile in a Zustand store
 * so Edit Profile can actually mutate it and have the change reflect back
 * on ProfileScreen — a plain exported const wouldn't trigger a re-render
 * anywhere. Same pattern as `useSettingsStore` (Units): unpersisted, in-
 * memory only, resets to the mock default on every app restart.
 *
 * Deliberately scoped to Profile only — Home's greeting ("Alex.") comes
 * from its own separate `mockHomeData.ts` and is NOT wired to this store.
 * That's consistent with the Home-stays-mock precedent: Home's data has
 * never synced with anything the user enters elsewhere (not onboarding's
 * accountName, not this), and wiring it now would be a bigger, separate
 * change touching a mock dataset this checkpoint isn't scoped to touch.
 */
export interface ProfileState {
  profile: AthleteProfile;
}

export interface ProfileActions {
  setName: (name: string) => void;
}

export type ProfileStore = ProfileState & ProfileActions;

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: athleteProfile,
  setName: (name) => set((s) => ({ profile: { ...s.profile, name } })),
}));
