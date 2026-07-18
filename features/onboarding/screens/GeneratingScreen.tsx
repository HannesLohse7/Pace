import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText, Screen } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MESSAGES = [
  'Analyzing your schedule…',
  'Building your plan…',
  'Optimizing recovery…',
  'Finding available training windows…',
];

const MESSAGE_INTERVAL_MS = 950;
const FINAL_HOLD_MS = 1000;
/** Matches the source's own `transition: stroke-dashoffset/width 0.4s ease`. */
const PROGRESS_EASE_MS = 400;

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Standalone timed transition, not OnboardingStepShell — the source has no
 * back/continue affordance here, just a self-driving ring + message +
 * progress bar that plays through automatically, matching SplashScreen's
 * pattern of a bare auto-advancing screen rather than the step-shell one.
 *
 * The ring's stroke-dashoffset and the bar's width are driven by a single
 * Animated.Value, not by re-rendering with a freshly-computed prop on
 * every message-index tick — that was the original (jerky-on-device)
 * approach, and it had two compounding problems: no interpolation at all
 * (each tick hard-snapped the value, where the source CSS-transitions it
 * over 0.4s ease), and the snap itself ran as a full React re-render on
 * the JS thread, competing with whatever else is happening during app
 * launch. Animated.timing instead drives both via setNativeProps under
 * the hood, with proper easing, without re-rendering the component on
 * every frame. The message-text swap stays on its own plain JS timer —
 * text has no smooth-animation concern the way the ring/bar do — but it
 * only tells the Animated.Value what to ease toward next; it no longer
 * drives the visual animation directly.
 *
 * Tried react-native-reanimated first (already a project dependency), but
 * its web platform has an unimplemented SVG-animation stub (literally a
 * `// TODO: Add web support for SVG components` in its own source) and,
 * in this project's Expo-web setup, non-SVG useAnimatedStyle updates
 * didn't visibly apply either, even with the dependency-array workaround
 * its docs call for. Core Animated has none of that risk — it's the
 * long-established, first-class-on-web implementation — so it's the
 * safer choice here despite reanimated being installed.
 *
 * useNativeDriver is false for both: neither stroke-dashoffset nor width
 * is on the native driver's supported-property list (only transform and
 * opacity are) in either Animated implementation, so this isn't a
 * shortcut — there's no native-driver-eligible version of this specific
 * animation to opt into.
 */
export function GeneratingScreen() {
  useOnboardingNavigation('generating');
  const router = useRouter();
  const colors = useThemeColors();
  const [messageIndex, setMessageIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = (messageIndex + 1) / MESSAGES.length;
    Animated.timing(progress, {
      toValue: target,
      duration: PROGRESS_EASE_MS,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [messageIndex, progress]);

  useEffect(() => {
    if (messageIndex < MESSAGES.length - 1) {
      const timer = setTimeout(() => setMessageIndex((i) => i + 1), MESSAGE_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => router.replace('/(tabs)'), FINAL_HOLD_MS);
    return () => clearTimeout(timer);
  }, [messageIndex, router]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const widthPct = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
        <AnimatedCircle
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
        <Animated.View
          className="h-full rounded-full"
          style={{ width: widthPct, backgroundColor: colors.accent }}
        />
      </View>
    </Screen>
  );
}
