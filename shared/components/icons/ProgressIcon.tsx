import Svg, { Path } from 'react-native-svg';

import { colors } from '@/shared/theme/colors';

import type { IconProps } from './types';

export function ProgressIcon({ size = 22, color = colors.color.quaternary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 20V12M12 20V6M19 20v-9" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
