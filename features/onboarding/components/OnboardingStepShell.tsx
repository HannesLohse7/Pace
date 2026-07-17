import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

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
  /**
   * When false, Continue is visually dimmed and tapping it calls
   * onInvalidContinue instead of navigating. Defaults to true (always
   * continuable), matching steps with no validation.
   *
   * Deliberately not wired through PrimaryButton's `disabled` prop —
   * that sets RN's native Pressable `disabled`, which blocks onPress
   * from firing at all. That would make it impossible for a screen to
   * react to an attempted tap (e.g. to surface a validation error), so
   * this only dims the button and leaves it tappable.
   */
  canContinue?: boolean;
  /** Called when Continue is tapped while canContinue is false. */
  onInvalidContinue?: () => void;
}

/**
 * Shared shell for the account/goal/race/availability/calendar/wearables
 * steps: back button, progress dots, title, then whatever content the
 * caller passes as children, then a flex spacer pushing the Continue
 * button to the bottom — matching the source's own repeated layout for
 * these six steps exactly.
 *
 * Wrapped in KeyboardAvoidingView so the keyboard doesn't cover the
 * active field or the Continue button on the two steps with text input
 * (account, race) — a no-op on steps with nothing to focus.
 */
export function OnboardingStepShell({
  step,
  title,
  continueLabel = 'Continue',
  children,
  canContinue = true,
  onInvalidContinue,
}: OnboardingStepShellProps) {
  const { goNext, goBack, currentIndex } = useOnboardingNavigation(step);

  const handleContinuePress = () => {
    if (canContinue) {
      goNext();
    } else {
      onInvalidContinue?.();
    }
  };

  return (
    <Screen edges={['top', 'bottom']} className="px-screen-x pt-screen-top pb-lg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <OnboardingBackButton onPress={goBack} />
        <OnboardingProgressDots currentStepIndex={currentIndex} />
        <AppText className="text-[25px] font-bold tracking-[-0.5px] text-color-primary">
          {title}
        </AppText>
        {children}
        <View className="flex-1" />
        <PrimaryButton
          label={continueLabel}
          onPress={handleContinuePress}
          fullWidth
          className={canContinue ? undefined : 'opacity-50'}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
