import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

/**
 * The one real field on Profile's header (added 2026-09-09, real-device
 * test) -- everything else there (stats, race goal, join date) is still
 * `useProfileStore`'s mock data, deliberately, per that store's own doc
 * comment. The name is different: it's real, already-collected data
 * (onboarding's Account step writes it to `athlete_profile.display_name`
 * -- see `GeneratingScreen.tsx`) that was simply never read back here,
 * so Profile showed a fabricated "Alex Rivera" over a real signed-in
 * athlete's own name. Same query `features/home/services/fetchHomeDashboard.ts`
 * already runs for Home's greeting, just scoped down to the one column
 * this screen needs.
 */
export function useAthleteDisplayName(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['athlete-display-name', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_profile')
        .select('display_name')
        .eq('id', athleteId as string)
        .maybeSingle();
      if (error) throw error;
      return data?.display_name ?? null;
    },
    enabled: Boolean(athleteId),
  });
}
