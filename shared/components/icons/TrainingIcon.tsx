import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/shared/theme/colors';

import type { IconProps } from './types';

export function TrainingIcon({ size = 22, color = colors.color.quaternary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={5} width={16} height={15} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M4 9.5h16M8 3v4M16 3v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
