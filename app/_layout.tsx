import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { SessionProvider } from '@/lib/supabase/useSession';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

export default function RootLayout() {
  return (
    // Required by react-native-gesture-handler (Training's drag-reorder,
    // Milestone 3 Checkpoint 3) — must wrap the whole app, as close to
    // the true root as possible, per its own setup docs.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {/*
          Added 2026-09-09, real-device test -- as close to the root as
          GestureHandlerRootView/QueryClientProvider, for the same
          reason they are: everything in the route tree below needs to
          read the SAME session state, not each stand up its own. See
          `useSession.tsx`'s own doc comment for the sign-out bug this
          fixes.
        */}
        <SessionProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              {/*
                Overlay screens (edit-profile, workout detail now; celebration,
                coach review still to come in Milestone 3) are added as sibling
                Stack screens here with presentation: 'modal', so they layer
                above the tab bar instead of requiring another navigation-model
                rework. Everything else stays auto-discovered with default
                (push) behavior — only screens that need non-default
                presentation get an explicit entry.
              */}
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
                <Stack.Screen name="workout/[id]" options={{ presentation: 'modal' }} />
                <Stack.Screen name="report" options={{ presentation: 'modal' }} />
              </Stack>
            </SafeAreaProvider>
          </ThemeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
