import { useState } from 'react';
import { View } from 'react-native';

import { supabase } from '@/lib/supabase/client';
import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';
import { isValidEmail, isValidPassword } from '@/shared/utils/validation';

import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { OnboardingTextField } from '../components/OnboardingTextField';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';
import { describeAuthError } from '../utils/describeAuthError';

/**
 * Creates the real Supabase account right here, on Continue, rather
 * than waiting for `GeneratingScreen.tsx` at the very end of onboarding
 * (moved 2026-09-09, real-device test: a duplicate email wasn't
 * reported until after goal/race/availability/calendar/wearables had
 * all been filled in too — annoying to hit and to redo). Everything
 * downstream of this step now runs with a real signed-in athlete,
 * which also means `GeneratingScreen.tsx` no longer creates the
 * account itself, just reads the session this screen already
 * established.
 *
 * `accountCreated` (in `useOnboardingStore`) guards against re-calling
 * `signUp()` if the athlete backs up to this screen and taps Continue
 * again without changing anything — see that field's own doc comment
 * for why that would otherwise come back as a false "already
 * registered" on the athlete's own account.
 */
export function AccountScreen() {
  const accountName = useOnboardingStore((s) => s.accountName);
  const accountEmail = useOnboardingStore((s) => s.accountEmail);
  const accountPassword = useOnboardingStore((s) => s.accountPassword);
  const accountCreated = useOnboardingStore((s) => s.accountCreated);
  const authError = useOnboardingStore((s) => s.authError);
  const setAccountName = useOnboardingStore((s) => s.setAccountName);
  const setAccountEmail = useOnboardingStore((s) => s.setAccountEmail);
  const setAccountPassword = useOnboardingStore((s) => s.setAccountPassword);
  const setAccountCreated = useOnboardingStore((s) => s.setAccountCreated);
  const setAuthError = useOnboardingStore((s) => s.setAuthError);
  const { goNext } = useOnboardingNavigation('account');

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNameValid = accountName.trim().length > 0;
  const isEmailValid = isValidEmail(accountEmail);
  const isPasswordValid = isValidPassword(accountPassword);
  const canContinue = isNameValid && isEmailValid && isPasswordValid && !isSubmitting;
  const emailError = emailTouched && !isEmailValid ? 'Enter a valid email address' : undefined;
  const passwordError =
    passwordTouched && !isPasswordValid ? 'Use at least 8 characters' : undefined;

  const handleContinue = async () => {
    if (isSubmitting) return;
    if (accountCreated) {
      goNext();
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email: accountEmail,
      password: accountPassword,
      options: { data: { display_name: accountName } },
    });
    setIsSubmitting(false);

    if (error) {
      setAuthError(describeAuthError(error.message));
      return;
    }
    setAccountCreated(true);
    goNext();
  };

  return (
    <OnboardingStepShell
      step="account"
      title="Create your account"
      continueLabel={isSubmitting ? 'Creating account…' : undefined}
      canContinue={canContinue}
      onContinue={handleContinue}
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
