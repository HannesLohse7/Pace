import { useQuery } from '@tanstack/react-query';

import { fetchWorkoutHistory } from '../services/fetchWorkoutHistory';

export function useWorkoutHistory(workoutId: string | undefined) {
  return useQuery({
    queryKey: ['workout-history', workoutId],
    queryFn: () => fetchWorkoutHistory(workoutId as string),
    enabled: Boolean(workoutId),
  });
}
