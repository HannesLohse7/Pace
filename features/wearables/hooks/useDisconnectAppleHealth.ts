import { useMutation, useQueryClient } from '@tanstack/react-query';

import { disconnectAppleHealth } from '../services/disconnectAppleHealth';
import { appleHealthConnectionQueryKey } from './appleHealthConnectionQueryKey';

export function useDisconnectAppleHealth(athleteId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!athleteId) throw new Error('No signed-in athlete.');
      return disconnectAppleHealth(athleteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appleHealthConnectionQueryKey(athleteId) });
    },
  });
}
