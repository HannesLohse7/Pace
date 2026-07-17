import { Stack } from 'expo-router';

/**
 * Onboarding's own layout — a plain Stack, not a Tabs navigator, since
 * these screens render without any tab bar chrome. Screens are pushed in
 * step order (splash → ... → generating) by useOnboardingNavigation, so
 * the native back gesture/button correctly pops to the previous step.
 */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="account" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="race" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="wearables" />
      <Stack.Screen name="generating" />
    </Stack>
  );
}
