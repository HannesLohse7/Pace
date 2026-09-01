import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';
import { isValidEmail, isValidPassword } from '@/shared/utils/validation';

import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { OnboardingTextField } from '../components/OnboardingTextField';

export function AccountScreen() {
  const accountName = useOnboardingStore((s) => s.accountName);
  const accountEmail = useOnboardingStore((s) => s.accountEmail);
  const accountPassword = useOnboardingStore((s) => s.accountPassword);
  const authError = useOnboardingStore((s) => s.authError);
  const setAccountName = useOnboardingStore((s) => s.setAccountName);
  const setAccountEmail = useOnboardingStore((s) => s.setAccountEmail);
  const setAccountPassword = useOnboardingStore((s) => s.setAccountPassword);
  const setAuthError = useOnboardingStore((s) => s.setAuthError);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isNameValid = accountName.trim().length > 0;
  const isEmailValid = isValidEmail(accountEmail);
  const isPasswordValid = isValidPassword(accountPassword);
  const canContinue = isNameValid && isEmailValid && isPasswordValid;
  const emailError = emailTouched && !isEmailValid ? 'Enter a valid email address' : undefined;
  const passwordError =
    passwordTouched && !isPasswordValid ? 'Use at least 8 characters' : undefined;

  return (
    <OnboardingStepShell
      step="account"
      title="Create your account"
      canContinue={canContinue}
      onInvalidContinue={() => {
        setEmailTouched(true);
        setPasswordTouched(true);
      }}
    >
      <AppText className="mt-[6px] text-[13.5px] text-color-tertiary">
        Just enough to personalize your plan.
      </AppText>

      {authError && (
        <View className="mt-[18px] rounded-[10px] border border-danger px-[14px] py-[12px]">
          <AppText className="text-[13px] text-danger">{authError}</AppText>
        </View>
      )}

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
          onChangeText={(value) => {
            setAccountEmail(value);
            if (authError) setAuthError(null);
          }}
          onBlur={() => setEmailTouched(true)}
          placeholder="alex@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={emailError}
        />
        <OnboardingTextField
          label="PASSWORD"
          value={accountPassword}
          onChangeText={(value) => {
            setAccountPassword(value);
            if (authError) setAuthError(null);
          }}
          onBlur={() => setPasswordTouched(true)}
          placeholder="At least 8 characters"
          autoCapitalize="none"
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          error={passwordError}
        />
      </View>
    </OnboardingStepShell>
  );
}
