import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase/client';
import { AppText, PrimaryButton, Screen } from '@/shared/components';
import { ChevronLeftIcon } from '@/shared/components/icons';
import { useThemeColors } from '@/shared/theme/ThemeProvider';
import { isValidEmail } from '@/shared/utils/validation';

/**
 * Turns a Supabase Auth error into copy an athlete can act on. The two
 * cases worth naming specifically: a wrong email/password (by far the
 * most common real mistake) and an unconfirmed email (the account exists
 * but signUp's confirmation step, if this project has it on, hasn't
 * happened yet) — everything else falls back to Supabase's own message
 * rather than guessing at a friendlier one.
 */
function describeSignInError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'Incorrect email or password.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirm your email before signing in.';
  }
  return message;
}

/**
 * The returning-athlete counterpart to onboarding's Account step, reached
 * from Welcome's "I already have an account" link — not part of the
 * onboarding step machine (ONBOARDING_STEPS/useOnboardingNavigation),
 * since it isn't a step in that flow and shouldn't advance or be tracked
 * by it. Its own back button just pops the stack.
 */
export function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = isValidEmail(email);
  const isPasswordValid = password.length > 0;
  const isFormValid = isEmailValid && isPasswordValid;
  const emailError = emailTouched && !isEmailValid ? 'Enter a valid email address' : undefined;
  const passwordError = passwordTouched && !isPasswordValid ? 'Enter your password' : undefined;

  async function signIn() {
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (signInError) {
      setError(describeSignInError(signInError.message));
      return;
    }
    router.replace('/(tabs)');
  }

  // Mirrors OnboardingContinueButton's own pattern: stays tappable rather
  // than using PrimaryButton's native `disabled` when the form is merely
  // invalid, so a tap can still surface which field needs attention.
  // `isSubmitting` is the one case where a real disable is right — that's
  // debouncing a duplicate network call, not validation feedback.
  function handlePress() {
    if (isSubmitting) return;
    if (!isFormValid) {
      setEmailTouched(true);
      setPasswordTouched(true);
      return;
    }
    void signIn();
  }

  return (
    <Screen edges={['top', 'bottom']} className="px-screen-x pt-screen-top pb-lg">
      <Pressable
        onPress={() => router.back()}
        className="mb-lg h-[34px] w-[34px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <ChevronLeftIcon />
      </Pressable>

      <AppText className="text-[25px] font-bold tracking-[-0.5px] text-color-primary">
        Welcome back
      </AppText>
      <AppText className="mt-[6px] text-[13.5px] text-color-tertiary">
        Sign in to pick up your plan where you left off.
      </AppText>

      {error && (
        <View className="mt-[18px] rounded-[10px] border border-danger px-[14px] py-[12px]">
          <AppText className="text-[13px] text-danger">{error}</AppText>
        </View>
      )}

      <View className="mt-[30px] gap-[22px]">
        <View>
          <AppText
            mono
            className="mb-xs text-[10px] font-semibold tracking-[0.6px] text-color-tertiary"
          >
            EMAIL
          </AppText>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError(null);
            }}
            onBlur={() => setEmailTouched(true)}
            placeholder="alex@email.com"
            placeholderTextColor={colors.color.quaternary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            className={`border-b pb-[10px] pt-[6px] text-[16px] text-color-primary ${
              emailError ? 'border-danger' : 'border-border-strong'
            }`}
          />
          {emailError && (
            <AppText className="mt-[6px] text-[12px] text-danger">{emailError}</AppText>
          )}
        </View>

        <View>
          <AppText
            mono
            className="mb-xs text-[10px] font-semibold tracking-[0.6px] text-color-tertiary"
          >
            PASSWORD
          </AppText>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) setError(null);
            }}
            onBlur={() => setPasswordTouched(true)}
            placeholder="Your password"
            placeholderTextColor={colors.color.quaternary}
            autoCapitalize="none"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            className={`border-b pb-[10px] pt-[6px] text-[16px] text-color-primary ${
              passwordError ? 'border-danger' : 'border-border-strong'
            }`}
          />
          {passwordError && (
            <AppText className="mt-[6px] text-[12px] text-danger">{passwordError}</AppText>
          )}
        </View>
      </View>

      <View className="flex-1" />

      <PrimaryButton
        label={isSubmitting ? 'Signing in…' : 'Sign in'}
        onPress={handlePress}
        disabled={isSubmitting}
        fullWidth
        className={isFormValid ? undefined : 'opacity-50'}
      />
    </Screen>
  );
}
