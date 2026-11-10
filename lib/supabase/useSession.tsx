import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './client';

export interface SessionState {
  session: Session | null;
  /** True until the first real answer comes back (from AsyncStorage, not the network) -- see `supabase.auth.getSession()`'s own doc comment in client.ts. */
  isLoading: boolean;
}

const SessionContext = createContext<SessionState | null>(null);

/**
 * Real "single source of truth" for "is anyone signed in" (revised
 * 2026-09-09, real-device test) -- this file used to export only the
 * hook below, with EACH call site (`app/index.tsx`, `(tabs)/_layout.tsx`,
 * Home, Training, Coach, Progress, Profile, ...) running its OWN
 * independent `getSession()` call and its OWN independent
 * `onAuthStateChange` subscription. The doc comment here claimed
 * "single source of truth" while the code did the opposite -- and that
 * gap was the actual cause of a sign-out flicker that survived two
 * rounds of fixing the redirect logic itself (see
 * `(tabs)/_layout.tsx`'s doc comment for that history). Sign-out mounts
 * and unmounts several of those independent instances in quick
 * succession ((tabs) -> index -> (tabs) -> onboarding); each fresh
 * instance's own async `getSession()` read could land a beat out of
 * sync with the others, so two components could transiently disagree
 * about whether a session existed at the same real moment -- enough to
 * send `app/index.tsx` briefly back into `(tabs)` on a stale read
 * before the real sign-out caught up. Fixing the redirects couldn't
 * fix that; they weren't wrong, the shared assumption underneath them
 * was. `SessionProvider` (wrapped around the whole app in
 * `app/_layout.tsx`) now holds the ONE subscription that actually
 * exists; every consumer reads the same state at the same time,
 * because there's only one state to read.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo<SessionState>(() => ({ session, isLoading }), [session, isLoading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Reads `SessionProvider`'s shared state -- every existing call site
 * keeps calling this exactly the same way it always did; only where
 * the subscription actually lives changed. Throws if rendered outside
 * the provider (it shouldn't ever be: `app/_layout.tsx` wraps the
 * entire route tree) rather than silently returning a fake
 * signed-out state, which would be a much quieter, much worse bug.
 */
export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
