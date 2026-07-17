import { TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/shared/components';
import { colors } from '@/shared/theme/colors';

export interface OnboardingTextFieldProps extends Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'autoCapitalize'
> {
  label: string;
}

/** Mono label above a bottom-border-only input — used by account (name/email) and race (race name). */
export function OnboardingTextField({ label, ...inputProps }: OnboardingTextFieldProps) {
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
        className="border-b border-border-strong pb-[10px] pt-[6px] text-[16px] text-color-primary"
      />
    </View>
  );
}
