import { useQuery } from '@tanstack/react-query';

import { fetchWorkoutDetail } from '../services/fetchWorkoutDetail';

export function useWorkoutDetail(workoutId: string | undefined) {
  return useQuery({
    queryKey: ['workout-detail', workoutId],
    queryFn: () => fetchWorkoutDetail(workoutId as string),
    enabled: Boolean(workoutId),
  });
}
