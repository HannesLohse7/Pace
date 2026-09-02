import { useMutation } from '@tanstack/react-query';

import { syncAppleHealthRecoverySignals } from '@/lib/wearables/syncAppleHealthRecoverySignals';

/**
 * Thin TanStack wrapper around `syncAppleHealthRecoverySignals` — the
 * one real entry point for connecting Apple Health, used by
 * `features/onboarding/screens/WearablesScreen.tsx` today. Lives in its
 * own `features/wearables/` feature (not folded into `onboarding`)
 * specifically so Profile can reuse it later without onboarding-only
 * code needing to export anything — see docs/ROADMAP.md for why
 * Profile itself isn't wired to this yet.
 *
 * No `onSuccess` cache invalidation: nothing reads `recovery_signal` or
 * `wearable_connection` anywhere in the app yet, so there's no cached
 * view of this data to go stale. Add one here once a real reader
 * exists, rather than invalidating a query key nothing subscribes to.
 */
export function useConnectAppleHealth(athleteId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!athleteId) throw new Error('No signed-in athlete.');
      return syncAppleHealthRecoverySignals(athleteId);
    },
  });
}
