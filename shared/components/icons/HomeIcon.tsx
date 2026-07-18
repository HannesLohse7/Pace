import Svg, { Path } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { IconProps } from './types';

export function HomeIcon({ size = 22, color }: IconProps) {
  const colors = useThemeColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z"
        stroke={color ?? colors.color.quaternary}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
