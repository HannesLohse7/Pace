import Svg, { Path } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { IconProps } from './types';

export function ChevronLeftIcon({ size = 14, color, strokeWidth = 2.3 }: IconProps) {
  const colors = useThemeColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5l-8 7 8 7"
        stroke={color ?? colors.color.primary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
