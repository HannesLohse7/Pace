import { View } from 'react-native';

export interface SportDotProps {
  color: string;
  /** Diameter in px. The source uses 6px most commonly, 9px in the week strip, 3px for tiny separators. */
  size?: number;
  className?: string;
}

export function SportDot({ color, size = 6, className }: SportDotProps) {
  return (
    <View
      className={className}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
    />
  );
}
