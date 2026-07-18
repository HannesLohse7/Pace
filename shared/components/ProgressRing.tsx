import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

export interface ProgressRingProps {
  /** Rendered width/height in px. Defaults to 58 (the recovery ring size). */
  size?: number;
  /** Ring radius in the ring's internal 100x100 coordinate space. */
  radius?: number;
  strokeWidth?: number;
  /** 0-100 */
  progress: number;
  color?: string;
  trackColor?: string;
  /** Centered content, e.g. a score label. */
  children?: ReactNode;
}

export function ProgressRing({
  size = 58,
  radius = 42,
  strokeWidth = 7,
  progress,
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const colors = useThemeColors();
  const resolvedColor = color ?? colors.success;
  const resolvedTrackColor = trackColor ?? colors['border-soft'];
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * Math.min(Math.max(progress, 0), 100)) / 100;
  const offset = circumference - dash;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </Svg>
      {children ? (
        <View className="absolute inset-0 items-center justify-center">{children}</View>
      ) : null}
    </View>
  );
}
