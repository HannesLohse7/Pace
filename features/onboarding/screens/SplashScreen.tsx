import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { AppText, Screen } from '@/shared/components';
import { ProgressIcon } from '@/shared/components/icons';
import { colors } from '@/shared/theme/colors';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

const AUTO_ADVANCE_MS = 1600;

/** Full-bleed dark splash — taps through immediately, or auto-advances after 1.6s, matching the source. */
export function SplashScreen() {
  const { goNext } = useOnboardingNavigation('splash');

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
    </Screen>
  );
}
