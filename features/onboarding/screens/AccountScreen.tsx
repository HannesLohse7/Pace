import { View } from 'react-native';

import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';

import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { OnboardingTextField } from '../components/OnboardingTextField';

export function AccountScreen() {
  const accountName = useOnboardingStore((s) => s.accountName);
  const accountEmail = useOnboardingStore((s) => s.accountEmail);
  const setAccountName = useOnboardingStore((s) => s.setAccountName);
  const setAccountEmail = useOnboardingStore((s) => s.setAccountEmail);

  return (
    <OnboardingStepShell step="account" title="Create your account">
      <AppText className="mt-[6px] text-[13.5px] text-color-tertiary">
        Just enough to personalize your plan.
      </AppText>

      <View className="mt-[30px] gap-[22px]">
        <OnboardingTextField
          label="NAME"
          value={accountName}
          onChangeText={setAccountName}
          placeholder="Alex Rivera"
        />
        <OnboardingTextField
          label="EMAIL"
          value={accountEmail}
          onChangeText={setAccountEmail}
          placeholder="alex@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </OnboardingStepShell>
  );
}
