import Svg, { Circle } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { IconProps } from './types';

/**
 * The six-dot grab handle from the design export's Training row markup
 * (`opacity:0.35`, six 1.6px-radius dots in a 2x3 grid) — already present
 * in the source as a visual affordance, just unused until this checkpoint
 * gave it something to do.
 */
export function DragHandleIcon({ size = 14, color }: IconProps) {
  const colors = useThemeColors();
  const dotColor = color ?? colors.color.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={0.35}>
      <Circle cx={9} cy={6} r={1.6} fill={dotColor} />
      <Circle cx={15} cy={6} r={1.6} fill={dotColor} />
      <Circle cx={9} cy={12} r={1.6} fill={dotColor} />
      <Circle cx={15} cy={12} r={1.6} fill={dotColor} />
      <Circle cx={9} cy={18} r={1.6} fill={dotColor} />
      <Circle cx={15} cy={18} r={1.6} fill={dotColor} />
    </Svg>
  );
}
