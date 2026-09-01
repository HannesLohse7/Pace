import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { supabase } from '@/lib/supabase/client';
import { Screen } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

/**
 * Session-gated entry point. `getSession()` resolves once the client has
 * finished reading whatever session AsyncStorage holds (see
 * lib/supabase/client.ts) — until then there's nothing to redirect on,
 * so this briefly renders a bare loading state rather than guessing.
 *
 * A signed-in athlete lands in the app; everyone else goes to onboarding,
 * same as before this existed. This is the "has this user onboarded"
 * check the original placeholder comment here was waiting on — it isn't
 * onboarding-completion-aware yet (a session with no athlete_profile row,
 * e.g. from an unconfirmed signup, still lands in (tabs) today), but it
 * does close the actual gap this route was flagged for: a returning
 * athlete now has a way back into their account.
 */
export default function RootIndexRoute() {
  const colors = useThemeColors();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setHasSession(data.session !== null);
    });

    // Keeps this decision current if a session appears/disappears while
    // this route happens to be the one mounted (e.g. a token refresh
    // failure) — cheap to keep in sync, and avoids a stale redirect
    // decision baked in from a single point-in-time check.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setHasSession(session !== null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (hasSession === null) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return <Redirect href={hasSession ? '/(tabs)' : '/(onboarding)/splash'} />;
}
