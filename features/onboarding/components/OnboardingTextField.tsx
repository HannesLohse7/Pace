import { TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

export interface OnboardingTextFieldProps extends Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'autoCapitalize' | 'onBlur'
> {
  label: string;
  /** When set, shows this message below the input and switches the underline to the danger color. */
  error?: string;
}

/** Mono label above a bottom-border-only input — used by account (name/email) and race (race name). */
export function OnboardingTextField({ label, error, ...inputProps }: OnboardingTextFieldProps) {
  const colors = useThemeColors();
  return (
    <View>
      <AppText
        mono
        className="mb-xs text-[10px] font-semibold tracking-[0.6px] text-color-tertiary"
      >
        {label}
      </AppText>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.color.quaternary}
        className={`border-b pb-[10px] pt-[6px] text-[16px] text-color-primary ${
          error ? 'border-danger' : 'border-border-strong'
        }`}
      />
      {error && <AppText className="mt-[6px] text-[12px] text-danger">{error}</AppText>}
    </View>
  );
}
