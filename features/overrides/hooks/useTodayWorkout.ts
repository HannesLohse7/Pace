import { useQuery } from '@tanstack/react-query';

import { fetchTodayWorkout } from '../services/fetchTodayWorkout';

export function useTodayWorkout(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['today-workout', athleteId],
    queryFn: () => fetchTodayWorkout(athleteId as string),
    enabled: Boolean(athleteId),
  });
}
