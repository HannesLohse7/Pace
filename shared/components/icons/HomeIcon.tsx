import Svg, { Path } from 'react-native-svg';

import { colors } from '@/shared/theme/colors';

import type { IconProps } from './types';

export function HomeIcon({ size = 22, color = colors.color.quaternary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
