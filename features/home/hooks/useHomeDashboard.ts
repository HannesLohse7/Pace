import { useQuery } from '@tanstack/react-query';

import { fetchHomeDashboard } from '../services/fetchHomeDashboard';

export function useHomeDashboard(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['home-dashboard', athleteId],
    queryFn: () => fetchHomeDashboard(athleteId as string),
    enabled: Boolean(athleteId),
  });
}
