import { View } from 'react-native';

import { colors } from '@/shared/theme/colors';

export interface OnboardingProgressDotsProps {
  /** Index into ONBOARDING_STEPS (0 = splash .. 8 = generating). */
  currentStepIndex: number;
}

const DOT_COUNT = 6;

/**
 * The 6-dot progress row shown on account/goal/race/availability/calendar/
 * wearables (not splash/welcome/generating). Dot i is filled once the
 * current step has reached or passed it — ported directly from the
 * source's `progressDots = [1..6].map(n => step >= n + 1 ...)`, which
 * lines up exactly with this project's ONBOARDING_STEPS index since both
 * enumerate the same 9 steps in the same order.
 */
export function OnboardingProgressDots({ currentStepIndex }: OnboardingProgressDotsProps) {
  return (
    <View className="mb-[22px] flex-row gap-[5px]">
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const filled = currentStepIndex >= i + 2;
        return (
          <View
            key={i}
            className="h-[3px] flex-1 rounded-full"
            style={{ backgroundColor: filled ? colors.accent : colors['border-strong'] }}
          />
        );
      })}
    </View>
  );
}
