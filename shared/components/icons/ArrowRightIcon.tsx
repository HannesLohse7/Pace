import Svg, { Path } from 'react-native-svg';

import { colors } from '@/shared/theme/colors';

import type { IconProps } from './types';

export function ArrowRightIcon({ size = 14, color = colors.color.inverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
