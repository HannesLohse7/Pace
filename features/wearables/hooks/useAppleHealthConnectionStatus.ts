import { useQuery } from '@tanstack/react-query';

import { fetchAppleHealthConnectionStatus } from '../services/fetchAppleHealthConnectionStatus';
import { appleHealthConnectionQueryKey } from './appleHealthConnectionQueryKey';

/**
 * Real Apple Health connection status for a signed-in athlete, read from
 * `wearable_connection` — this is what Profile's "Apple Health" row
 * should show instead of the local mock boolean it used to (see
 * `ProfileScreen.tsx`'s Connected Services section). One-shot fetch, no
 * polling: unlike Google Calendar's OAuth round trip, there's no
 * external redirect to wait for here, and HealthKit gives no
 * notification Pace could poll for if the athlete revokes access from
 * iOS Settings — so this only ever reflects what Pace itself last wrote,
 * refreshed on refetch/invalidate, not a live OS-permission check.
 */
export function useAppleHealthConnectionStatus(athleteId: string | undefined) {
  return useQuery({
    queryKey: appleHealthConnectionQueryKey(athleteId),
    queryFn: () => fetchAppleHealthConnectionStatus(athleteId!),
    enabled: Boolean(athleteId),
  });
}
