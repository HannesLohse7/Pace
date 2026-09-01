import { useQuery } from '@tanstack/react-query';

import { fetchTrainingWeek } from '../services/fetchTrainingWeek';

export function useTrainingWeek(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['training-week', athleteId],
    queryFn: () => fetchTrainingWeek(athleteId as string),
    enabled: Boolean(athleteId),
  });
}
