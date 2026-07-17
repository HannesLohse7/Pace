import { View } from 'react-native';

import { AppText, PrimaryButton, Screen } from '@/shared/components';
import type { OnboardingStep } from '@/shared/store';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

export interface OnboardingStepPlaceholderProps {
  step: OnboardingStep;
}

/**
 * Temporary placeholder for onboarding steps that don't have real UI yet.
 * Delete each usage as its real screen is built (Checkpoint 2 onward) —
 * not a lasting design-system primitive, same as ComingSoonPlaceholder
 * was for the tab routes.
 */
export function OnboardingStepPlaceholder({ step }: OnboardingStepPlaceholderProps) {
  const { goNext, goBack, isFirstStep, isLastStep } = useOnboardingNavigation(step);

  return (
    <Screen className="items-center justify-center gap-lg">
      <AppText className="text-heading-1 text-color-primary">{step}</AppText>
      <View className="flex-row gap-md">
        {!isFirstStep && <PrimaryButton label="Back" onPress={goBack} />}
        {!isLastStep && <PrimaryButton label="Next" onPress={goNext} />}
      </View>
    </Screen>
  );
}
