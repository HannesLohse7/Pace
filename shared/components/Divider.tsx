import { View } from 'react-native';

import { colors } from '@/shared/theme/colors';

export interface DividerProps {
  color?: string;
  className?: string;
}

/** Full-width 1px hairline, matching the source's recurring `border-top:1px solid #F1F1EF`. */
export function Divider({ color = colors.border, className }: DividerProps) {
  return <View className={className} style={{ height: 1, backgroundColor: color }} />;
}
