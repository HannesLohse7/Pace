import { useQuery } from '@tanstack/react-query';

import { fetchProgress } from '../services/fetchProgress';

export function useProgress(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['progress', athleteId],
    queryFn: () => fetchProgress(athleteId as string),
    enabled: Boolean(athleteId),
  });
}
