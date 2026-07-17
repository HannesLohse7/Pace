import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText, Screen } from '@/shared/components';
import { colors } from '@/shared/theme/colors';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

const MESSAGES = [
  'Analyzing your schedule…',
  'Building your plan…',
  'Optimizing recovery…',
  'Finding available training windows…',
];

const MESSAGE_INTERVAL_MS = 950;
const FINAL_HOLD_MS = 1000;

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Standalone timed transition, not OnboardingStepShell — the source has no
 * back/continue affordance here, just a self-driving ring + message +
 * progress bar that plays through automatically, matching SplashScreen's
 * pattern of a bare auto-advancing screen rather than the step-shell one.
 */
export function GeneratingScreen() {
  useOnboardingNavigation('generating');
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messageIndex < MESSAGES.length - 1) {
      const timer = setTimeout(() => setMessageIndex((i) => i + 1), MESSAGE_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => router.replace('/(tabs)'), FINAL_HOLD_MS);
    return () => clearTimeout(timer);
  }, [messageIndex, router]);

  const progressPct = Math.round(((messageIndex + 1) / MESSAGES.length) * 100);
  const dashOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * progressPct) / 100;

  return (
    <Screen edges={['top', 'bottom']} className="items-center justify-center gap-xl px-[40px]">
      <Svg width={52} height={52} viewBox="0 0 52 52">
        <Circle
          cx={26}
          cy={26}
          r={RING_RADIUS}
          fill="none"
          stroke={colors['border-soft']}
          strokeWidth={3}
        />
        <Circle
          cx={26}
          cy={26}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.accent}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 26 26)"
        />
      </Svg>

      <AppText className="text-center text-[16px] font-semibold text-color-primary">
        {MESSAGES[messageIndex]}
      </AppText>

      <View
        className="h-[3px] w-full overflow-hidden rounded-full"
        style={{ backgroundColor: colors['border-soft'] }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${progressPct}%`, backgroundColor: colors.accent }}
        />
      </View>
    </Screen>
  );
}
