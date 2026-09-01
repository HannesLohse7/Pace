import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './client';

export interface SessionState {
  session: Session | null;
  /** True until the first real answer comes back (from AsyncStorage, not the network) -- see `supabase.auth.getSession()`'s own doc comment in client.ts. */
  isLoading: boolean;
}

/**
 * Single source of truth for "is anyone signed in" -- `app/index.tsx`
 * (root routing) and any screen that needs the current athlete's id
 * (Home, Training, Progress, ...) share this instead of each running
 * their own `getSession()`/`onAuthStateChange()` pair.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
