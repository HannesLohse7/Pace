import { useQuery } from '@tanstack/react-query';

import { fetchRecentAdaptationEvents } from '../services/fetchRecentAdaptationEvents';

export function useRecentAdaptationEvents(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['coach-adaptation-events', athleteId],
    queryFn: () => fetchRecentAdaptationEvents(athleteId as string),
    enabled: Boolean(athleteId),
  });
}
