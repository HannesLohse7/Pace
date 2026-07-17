import { View } from 'react-native';

import { AppText, PrimaryButton, Screen } from '@/shared/components';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

export function WelcomeScreen() {
  const { goNext } = useOnboardingNavigation('welcome');

  return (
    <Screen edges={['top', 'bottom']} className="px-screen-x pb-[26px]">
      <View className="flex-1 justify-center">
        <AppText
          mono
          className="mb-md text-[11px] font-semibold tracking-[1.2px] text-color-tertiary"
        >
          WELCOME TO PACE
        </AppText>
        <AppText className="text-[32px] font-bold leading-[1.14] tracking-[-0.7px] text-color-primary">
          Training that adapts to your real life.
        </AppText>
        <AppText className="mt-md max-w-[300px] text-[14.5px] leading-[1.6] text-color-secondary">
          Pace rebuilds your swim, bike and run plan around your schedule, recovery, and progress —
          every single day.
        </AppText>
      </View>

      <PrimaryButton label="Get Started" onPress={goNext} fullWidth />

      <AppText className="mt-md text-center text-[13px] text-color-tertiary">
        I already have an account
      </AppText>
    </Screen>
  );
}
