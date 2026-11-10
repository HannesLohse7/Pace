import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useSession } from '@/lib/supabase/useSession';
import { TabBar, type TabKey } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';

const ROUTE_NAME_TO_TAB: Record<string, TabKey> = {
  index: 'home',
  training: 'training',
  coach: 'coach',
  progress: 'progress',
  profile: 'profile',
};

const TAB_TO_ROUTE_NAME: Record<TabKey, string> = {
  home: 'index',
  training: 'training',
  coach: 'coach',
  progress: 'progress',
  profile: 'profile',
};

/**
 * Adapts react-navigation's bottom-tabs render props to the existing TabBar
 * component's simpler (activeTab, onTabPress) API, so the tab bar's visual
 * design — verified pixel-for-pixel in Checkpoint 4 — is reused unchanged
 * rather than rebuilt against the navigator's descriptor/options API.
 */
function ConnectedTabBar({ state, navigation }: BottomTabBarProps) {
  const activeTab = ROUTE_NAME_TO_TAB[state.routes[state.index]?.name ?? 'index'] ?? 'home';

  const handleTabPress = (tab: TabKey) => {
    navigation.navigate(TAB_TO_ROUTE_NAME[tab]);
  };

  return <TabBar activeTab={activeTab} onTabPress={handleTabPress} />;
}

/**
 * Session guard added 2026-09-09, first real-device test, revised four
 * times the same day. This layout mounts once when an athlete first
 * enters the tabs and stays mounted across every tab switch, but until
 * now nothing here ever re-checked whether that athlete was still
 * signed in -- only the root `app/index.tsx` gate did, and only on its
 * own mount. That gap was already flagged in `ProfileScreen.tsx`'s doc
 * comment as the reason Sign Out needed an explicit redirect of its
 * own; this closes the gap properly instead of leaving it as a single
 * point of failure.
 *
 * This is the ONLY place that navigates away from tabs when session
 * goes null -- `ProfileScreen.tsx`'s Sign Out just calls
 * `supabase.auth.signOut()` and nothing else (see its own doc comment
 * for the double-navigation race that caused when both places tried).
 * `useSession()` itself was also a real bug (see its own doc comment
 * for the `SessionProvider` fix) but not the whole story: fixing it
 * turned what had been a silent flicker into an explicit React crash
 * -- "Maximum update depth exceeded" inside react-navigation's
 * `PreventRemoveProvider` -- which is what finally pinned down the
 * actual mechanism.
 *
 * This used to ALSO conditionally `return null` here instead of
 * `<Tabs>` once signed out, on top of the `useEffect` below calling
 * `router.replace(...)`. That was two independent things tearing down
 * the same subtree at once: React unmounting all 5 tab screens (each
 * wraps its content in react-navigation's own `PreventRemoveProvider`,
 * whether or not this app uses `usePreventRemove` itself) via the
 * conditional render, *while* the router was separately replacing the
 * route out from under them. Each unmounting provider notifies its
 * parent's `setPreventedRoutesMap`, and with five unmounting at once
 * plus the router already mid-navigation, that cascaded past React's
 * nested-update limit. The fix is to stop fighting the navigator:
 * `<Tabs>` always renders, unconditionally, and the `router.replace(...)`
 * below is the ONLY thing that ever removes `(tabs)` from the tree --
 * exactly how `SignInScreen.tsx`, `GeneratingScreen.tsx`, and
 * `EditProfileScreen.tsx` already replace routes elsewhere in this app
 * without incident, since none of them also swap out their own render
 * output mid-navigation. The brief instant between session going null
 * and the replace landing may show the outgoing tab's last frame
 * rather than a blank screen -- an acceptable trade against a hard
 * crash, and it's genuinely brief (the effect fires the same commit).
 *
 * **`router.replace('/')` itself was the remaining bug** (found
 * 2026-09-09 via console logging, confirmed on device): `app/index.tsx`
 * and `app/(tabs)/index.tsx` both formally claim the path `/` --
 * Expo Router resolves an absolute `/` target against the CURRENT
 * navigator first when one of its own screens also matches, so calling
 * this from inside `(tabs)` landed on the sibling `(tabs)/index.tsx`
 * (Home) instead of escaping to the root gate. Logged evidence: after
 * the replace, `useSegments()` read `["(tabs)"]`, not `[]`, and
 * `app/index.tsx` never mounted again -- Home then rendered signed-out
 * forever, the exact "stuck spinner" symptom. Fix: target the real,
 * unambiguous destination directly (`/(onboarding)/splash` -- the same
 * literal `app/index.tsx` itself uses for a null session) instead of
 * bouncing through `/`. This also means `app/index.tsx`'s own
 * onboarding-store reset (see its doc comment) never runs for this
 * path anymore, so it's duplicated here -- both are "arriving at
 * onboarding via a genuinely fresh entry point," just two different
 * ones (cold launch vs. sign-out).
 */
export default function TabsLayout() {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  useEffect(() => {
    if (!isLoading && !session && !hasRedirected.current) {
      hasRedirected.current = true;
      resetOnboarding();
      router.replace('/(onboarding)/splash');
    }
  }, [isLoading, session, router, resetOnboarding]);

  return (
    <Tabs tabBar={(props) => <ConnectedTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="training" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
