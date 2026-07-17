import { PrimaryButton } from '@/shared/components';

export interface OnboardingContinueButtonProps {
  label?: string;
  goNext: () => void;
  canContinue?: boolean;
  onInvalidContinue?: () => void;
}

/**
 * The Continue/CTA button shared by every onboarding step past welcome.
 * Deliberately not wired through PrimaryButton's native `disabled` — that
 * blocks Pressable.onPress from firing at all, which would make it
 * impossible to react to an attempted tap (e.g. to surface a validation
 * error). Instead it stays tappable, dims when canContinue is false, and
 * its own onPress branches: valid navigates, invalid calls
 * onInvalidContinue.
 *
 * Extracted out of OnboardingStepShell so a screen whose Continue button
 * doesn't sit in the shell's default fixed footer (e.g. Availability,
 * whose button scrolls together with its taller content per the source)
 * can render it directly inside its own layout instead.
 */
export function OnboardingContinueButton({
  label = 'Continue',
  goNext,
  canContinue = true,
  onInvalidContinue,
}: OnboardingContinueButtonProps) {
  const handlePress = () => {
    if (canContinue) {
      goNext();
    } else {
      onInvalidContinue?.();
    }
  };

  return (
    <PrimaryButton
      label={label}
      onPress={handlePress}
      fullWidth
      className={canContinue ? undefined : 'opacity-50'}
    />
  );
}
