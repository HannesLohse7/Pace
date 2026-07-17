import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText, Screen } from '@/shared/components';
import { ProgressIcon } from '@/shared/components/icons';
import { colors } from '@/shared/theme/colors';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

const AUTO_ADVANCE_MS = 1600;

/** Full-bleed dark splash — taps through immediately, or auto-advances after 1.6s, matching the source. */
export function SplashScreen() {
  const { goNext } = useOnboardingNavigation('splash');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [goNext]);

  return (
    <Screen edges={[]} className="bg-surface-dark">
      <Pressable onPress={goNext} className="flex-1 items-center justify-center gap-md">
        <ProgressIcon size={40} color={colors.color.inverse} strokeWidth={2.4} />
        <AppText className="text-[24px] font-bold tracking-[-0.4px] text-color-inverse">
          Pace
        </AppText>
        <AppText
          mono
          className="text-[11px] font-semibold tracking-[1.4px]"
          style={{ color: '#7C8493' }}
        >
          ADAPTIVE ENDURANCE COACHING
        </AppText>
      </Pressable>

      {/*
        Dev-only bypass for testing tabs/Home without re-walking the whole
        onboarding flow each time. Stripped from production builds by the
        __DEV__ check — never shipped. Deliberately only on Splash, not
        every onboarding screen.
      */}
      {__DEV__ && (
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          className="items-center pb-lg"
          hitSlop={12}
        >
          <AppText className="text-[12px] text-color-tertiary" style={{ color: '#7C8493' }}>
            Skip to Home (dev)
          </AppText>
        </Pressable>
      )}
    </Screen>
  );
}
