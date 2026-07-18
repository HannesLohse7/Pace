import Svg, { Path } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { IconProps } from './types';

export function CheckIcon({ size = 10, color, strokeWidth = 3 }: IconProps) {
  const colors = useThemeColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5 9-11"
        stroke={color ?? colors.color.inverse}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
