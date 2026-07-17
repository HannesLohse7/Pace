import '../global.css';

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/*
        (tabs) is the only route today. Future overlay screens (workout
        detail, celebration, coach review — Milestone 3) should be added as
        sibling Stack screens here with options={{ presentation: 'modal' }}
        (or 'transparentModal'/'containedModal'), so they layer above the
        tab bar instead of requiring another navigation-model rework.
      */}
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
