import { Platform, Pressable, TextInput, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { AppText } from '@/shared/components';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

export interface OnboardingDateFieldProps {
  label: string;
  /** ISO 'YYYY-MM-DD', or '' if unset — same shape the free-text field stored before this. */
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromIsoDate(value: string): Date {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y ?? new Date().getFullYear(), (m ?? 1) - 1, d ?? 1);
}

/**
 * Native date picker, wired to the onboarding store's raceDate field —
 * still an ISO 'YYYY-MM-DD' string, same shape as the free-text field
 * this replaces, just populated by a real picker now instead of typing.
 *
 * iOS and Android present this library very differently:
 * - iOS's "compact" display is a small always-visible native control
 *   that owns its own popover calendar, so it IS the field itself.
 * - Android has no inline/compact mode — DateTimePicker only exists as
 *   an imperative dialog (DateTimePickerAndroid.open()), so the field
 *   there is a plain pressable showing the current value that opens the
 *   dialog on tap.
 * - The library has no web implementation at all (it renders null +
 *   warns there); this falls back to plain text entry there so it stays
 *   testable in a browser, since web isn't a real target platform for
 *   this app anyway.
 */
export function OnboardingDateField({
  label,
  value,
  onChange,
  placeholder,
}: OnboardingDateFieldProps) {
  const colors = useThemeColors();
  const dateValue = fromIsoDate(value);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      onChange(toIsoDate(selectedDate));
    }
  };

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({ value: dateValue, mode: 'date', onChange: handleChange });
  };

  return (
    <View>
      <AppText
        mono
        className="mb-xs text-[10px] font-semibold tracking-[0.6px] text-color-tertiary"
      >
        {label}
      </AppText>

      {Platform.OS === 'ios' && (
        <View className="flex-row items-center border-b border-border-strong pb-[10px] pt-[6px]">
          <DateTimePicker value={dateValue} mode="date" display="compact" onChange={handleChange} />
        </View>
      )}

      {Platform.OS === 'android' && (
        <Pressable
          onPress={openAndroidPicker}
          className="border-b border-border-strong pb-[10px] pt-[6px]"
        >
          <AppText
            className={`text-[16px] ${value ? 'text-color-primary' : 'text-color-quaternary'}`}
          >
            {value || placeholder}
          </AppText>
        </Pressable>
      )}

      {Platform.OS !== 'ios' && Platform.OS !== 'android' && (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.color.quaternary}
          className="border-b border-border-strong pb-[10px] pt-[6px] text-[16px] text-color-primary"
        />
      )}
    </View>
  );
}
