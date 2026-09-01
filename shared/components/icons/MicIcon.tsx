import Svg, { Path, Rect } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { IconProps } from './types';

export function MicIcon({ size = 15, color, strokeWidth = 2 }: IconProps) {
  const colors = useThemeColors();
  const resolvedColor = color ?? colors.color.secondary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={9}
        y={2}
        width={6}
        height={12}
        rx={3}
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M5 11a7 7 0 0014 0M12 18v4"
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
