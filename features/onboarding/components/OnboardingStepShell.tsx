import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { AppText, Screen } from '@/shared/components';
import type { OnboardingStep } from '@/shared/store';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';
import { OnboardingBackButton } from './OnboardingBackButton';
import { OnboardingContinueButton } from './OnboardingContinueButton';
import { OnboardingProgressDots } from './OnboardingProgressDots';

export interface OnboardingStepShellProps {
  step: OnboardingStep;
  title: string;
  continueLabel?: string;
  children: ReactNode;
  canContinue?: boolean;
  onInvalidContinue?: () => void;
  /**
   * Renders the default fixed-footer Continue button (spacer-pinned to
   * the bottom) after children. Set false when the screen renders its
   * own OnboardingContinueButton itself instead — e.g. Availability
   * (button scrolls together with its taller content, per the source)
   * and Wearables (button sits fixed after an independently-scrolling
   * row list, not spacer-pinned). Defaults to true.
   */
  showFooter?: boolean;
  /** Extra content rendered after the footer button — e.g. Calendar's inert "Skip for now" line. */
  footerExtra?: ReactNode;
}

/**
 * Shared shell for the account/goal/race/availability/calendar/wearables
 * steps: back button, progress dots, title, then whatever content the
 * caller passes as children — matching the source's own repeated layout
 * for these six steps exactly.
 *
 * Wrapped in KeyboardAvoidingView so the keyboard doesn't cover the
 * active field or the Continue button on the steps with text input
 * (account, race) — a no-op on steps with nothing to focus.
 */
export function OnboardingStepShell({
  step,
  title,
  continueLabel,
  children,
  canContinue = true,
  onInvalidContinue,
  showFooter = true,
  footerExtra,
}: OnboardingStepShellProps) {
  const { goNext, goBack, currentIndex } = useOnboardingNavigation(step);

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
        {showFooter && (
          <>
            <View className="flex-1" />
            <OnboardingContinueButton
              label={continueLabel}
              goNext={goNext}
              canContinue={canContinue}
              onInvalidContinue={onInvalidContinue}
            />
            {footerExtra}
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
