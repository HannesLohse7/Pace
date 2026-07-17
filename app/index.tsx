import { Redirect } from 'expo-router';

/**
 * Unconditionally sends "/" into onboarding instead of letting
 * (tabs)/index.tsx's own claim on "/" win by default. This is a
 * placeholder, not a final product decision: there's no auth or
 * persistence yet, so there's no real "has this user onboarded" state to
 * check. Once real user records exist (Milestone 5), this should become a
 * conditional redirect based on onboarding-completion state instead of an
 * unconditional one.
 */
export default function RootIndexRoute() {
  return <Redirect href="/(onboarding)/splash" />;
}
