import { Pressable } from 'react-native';

import { ChevronLeftIcon } from '@/shared/components/icons';

export interface OnboardingBackButtonProps {
  onPress: () => void;
}

/** Circular back button used at the top of every step screen after welcome. */
export function OnboardingBackButton({ onPress }: OnboardingBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-lg h-[34px] w-[34px] items-center justify-center rounded-full border border-border bg-surface"
    >
      <ChevronLeftIcon />
    </Pressable>
  );
}
