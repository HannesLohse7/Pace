import Svg, { Circle, Path } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { IconProps } from './types';

export function ProfileIcon({ size = 22, color }: IconProps) {
  const colors = useThemeColors();
  const resolvedColor = color ?? colors.color.quaternary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.4} stroke={resolvedColor} strokeWidth={2} />
      <Path
        d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6"
        stroke={resolvedColor}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
