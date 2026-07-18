import Svg, { Path } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { IconProps } from './types';

export function CoachIcon({ size = 22, color }: IconProps) {
  const colors = useThemeColors();
  const resolvedColor = color ?? colors.color.quaternary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a7 7 0 00-7 7c0 2.4 1.2 4.4 3 5.7V19a1 1 0 001 1h6a1 1 0 001-1v-3.3c1.8-1.3 3-3.3 3-5.7a7 7 0 00-7-7z"
        stroke={resolvedColor}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M10 22h4" stroke={resolvedColor} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
