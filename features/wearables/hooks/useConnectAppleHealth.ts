import { useMutation, useQueryClient } from '@tanstack/react-query';

import { syncAppleHealthRecoverySignals } from '@/lib/wearables/syncAppleHealthRecoverySignals';

import { appleHealthConnectionQueryKey } from './appleHealthConnectionQueryKey';

/**
 * Thin TanStack wrapper around `syncAppleHealthRecoverySignals` — the
 * full connect-and-write flow, for a caller that already has a real
 * signed-in athlete. **Not called by onboarding** — onboarding's
 * Wearables step runs before any session exists, so it uses the
 * permission-only `useRequestAppleHealthAuthorization` instead, and
 * `GeneratingScreen.tsx` calls `syncAppleHealthRecoverySignals` directly
 * (a plain async effect, not a mutation) once the real athlete exists —
 * see that screen's own comment for why.
 *
 * **Now wired into Profile's Connected Services (2026-09-09)** — the
 * real reader `onSuccess` used to have nothing to invalidate for is
 * `useAppleHealthConnectionStatus`, which is what Profile's Apple Health
 * row reads instead of the local mock boolean it used to. Also serves as
 * the real "Connect" action for an athlete who previously disconnected
 * (via `useDisconnectAppleHealth`) or whose first connect attempt failed.
 *
 * One honesty note worth keeping in mind for any caller: HealthKit read
 * authorization can't be introspected by any app (an OS privacy design,
 * not a gap in this adapter) — `requestAuthorization` generally resolves
 * without throwing even if the athlete denied or later revoked access,
 * and a revoked/denied read then just returns zero samples rather than
 * an error. That's why `result.daysSynced === 0` on an otherwise-`ok`
 * result is a real, distinct case worth surfacing in the UI (see
 * `ProfileScreen.tsx`) rather than treating any non-error result as an
 * unqualified "Connected."
 */
export function useConnectAppleHealth(athleteId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!athleteId) throw new Error('No signed-in athlete.');
      return syncAppleHealthRecoverySignals(athleteId);
    },
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: appleHealthConnectionQueryKey(athleteId) });
      }
    },
  });
}
