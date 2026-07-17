import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText, PrimaryButton, Screen } from '@/shared/components';
import type { OnboardingStep } from '@/shared/store';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';
import { OnboardingBackButton } from './OnboardingBackButton';
import { OnboardingProgressDots } from './OnboardingProgressDots';

export interface OnboardingStepShellProps {
  step: OnboardingStep;
  title: string;
  continueLabel?: string;
  children: ReactNode;
}

/**
 * Shared shell for the account/goal/race/availability/calendar/wearables
 * steps: back button, progress dots, title, then whatever content the
 * caller passes as children, then a flex spacer pushing the Continue
 * button to the bottom — matching the source's own repeated layout for
 * these six steps exactly.
 *
 * None of these steps have custom continue logic in the source (every
 * *Next handler just advances to the next step unconditionally), so this
 * shell owns the back/continue wiring itself via useOnboardingNavigation
 * rather than asking each screen to thread callbacks through.
 */
export function OnboardingStepShell({
  step,
  title,
  continueLabel = 'Continue',
  children,
}: OnboardingStepShellProps) {
  const { goNext, goBack, currentIndex } = useOnboardingNavigation(step);

  return (
    <Screen edges={['top', 'bottom']} className="px-screen-x pt-screen-top pb-lg">
      <OnboardingBackButton onPress={goBack} />
      <OnboardingProgressDots currentStepIndex={currentIndex} />
      <AppText className="text-[25px] font-bold tracking-[-0.5px] text-color-primary">
        {title}
      </AppText>
      {children}
      <View className="flex-1" />
      <PrimaryButton label={continueLabel} onPress={goNext} fullWidth />
    </Screen>
  );
}
