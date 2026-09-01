import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { useSession } from '@/lib/supabase/useSession';
import { Screen } from '@/shared/components';
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
 */
export default function RootIndexRoute() {
  const colors = useThemeColors();
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return <Redirect href={session ? '/(tabs)' : '/(onboarding)/splash'} />;
}
