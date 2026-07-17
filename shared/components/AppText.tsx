import { Platform, Text, type TextProps } from 'react-native';

const MONO_FONT_FAMILY = Platform.select({
  ios: 'ui-monospace',
  android: 'monospace',
  default: 'monospace',
});

export interface AppTextProps extends TextProps {
  /**
   * Selects the monospace family used throughout the source for figures,
   * labels, and stats (`ui-monospace,'SF Mono',monospace`). On iOS this
   * resolves to the real SF Mono system font. Defaults to the system
   * sans-serif family (unset `fontFamily`, i.e. SF Pro on iOS / Roboto on
   * Android) when omitted.
   */
  mono?: boolean;
}

export function AppText({ mono = false, style, ...props }: AppTextProps) {
  return <Text style={[mono && { fontFamily: MONO_FONT_FAMILY }, style]} {...props} />;
}
