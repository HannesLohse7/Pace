import { useMutation, useQueryClient } from '@tanstack/react-query';

import { disconnectGoogleCalendar } from '../services/disconnectGoogleCalendar';

export function useDisconnectGoogleCalendar(athleteId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection', athleteId] });
    },
  });
}
