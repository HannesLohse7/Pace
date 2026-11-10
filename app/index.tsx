import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { useSession } from '@/lib/supabase/useSession';
import { Screen } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

/**
 * Session-gated entry point. A signed-in athlete lands in the app;
 * everyone else goes to onboarding. This is the "has this user
 * onboarded" check the original placeholder comment here was waiting
 * on — it isn't onboarding-completion-aware yet (a session with no
 * athlete_profile row, e.g. from an unconfirmed signup, still lands in
 * (tabs) today), but it does close the actual gap this route was
 * flagged for: a returning athlete now has a way back into their
 * account.
 *
 * Resets `useOnboardingStore` on the way to onboarding (added
 * 2026-09-09, real-device test) — that store is deliberately
 * unpersisted (see its own doc comment) but is still one in-memory
 * Zustand instance that outlives any single onboarding attempt within
 * the same app session; signing out doesn't touch it. A second signup
 * in the same session was starting with the PREVIOUS athlete's
 * leftover values still set -- confirmed on device as onboarding's
 * Wearables screen showing Apple Health as already "Connected" with no
 * permission prompt, because `wearables.appleHealth` was still `true`
 * from the last account. Doing the reset here rather than in
 * `SplashScreen` itself is what keeps this from also firing on an
 * ordinary back-navigation to Splash mid-onboarding: this route only
 * re-runs when the athlete arrives at onboarding through the root gate
 * -- a genuinely fresh start (first launch) -- never as a stop along an
 * already-in-progress flow.
 *
 * **No longer the path sign-out takes** (2026-09-09, real-device fix):
 * `app/(tabs)/_layout.tsx`'s session guard used to call
 * `router.replace('/')` to get back here, but that's ambiguous --
 * `app/(tabs)/index.tsx` also claims `/`, and Expo Router resolved it
 * against the tabs navigator instead of escaping to this route (see
 * that file's own doc comment for the confirmed mechanism). The guard
 * now targets `/(onboarding)/splash` directly and duplicates the
 * store-reset above for that path. This route is still the sole gate
 * for a cold launch.
 */
export default function RootIndexRoute() {
  const colors = useThemeColors();
  const { session, isLoading } = useSession();
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  useEffect(() => {
    if (!isLoading && !session) {
      resetOnboarding();
    }
  }, [isLoading, session, resetOnboarding]);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return <Redirect href={session ? '/(tabs)' : '/(onboarding)/splash'} />;
}
