import { useMutation } from '@tanstack/react-query';

import { requestAppleHealthAuthorization } from '@/lib/wearables/syncAppleHealthRecoverySignals';

/**
 * Onboarding-only entry point (`features/onboarding/screens/WearablesScreen.tsx`)
 * — requests HealthKit read authorization without writing anything to
 * Supabase, since onboarding's Wearables step runs before any real
 * athlete session exists. See `requestAppleHealthAuthorization`'s own
 * doc comment for the real-device bug this fixes (added 2026-09-09).
 * The real sync — and the only Supabase writes — happens once in
 * `GeneratingScreen.tsx`, gated on `useOnboardingStore`'s
 * `wearables.appleHealth` flag this hook's caller sets on success.
 */
export function useRequestAppleHealthAuthorization() {
  return useMutation({
    mutationFn: requestAppleHealthAuthorization,
  });
}
