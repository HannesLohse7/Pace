import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

import { shadows } from '@/shared/theme/shadows';

import { AppText } from './AppText';

export interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  /** Optional trailing icon slot, e.g. <ArrowRightIcon /> */
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function PrimaryButton({ label, onPress, icon, disabled, className }: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        className={`flex-row items-center justify-center gap-[9px] rounded-full bg-accent px-xl py-[14px] ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
        style={shadows.button}
      >
        <AppText className="text-label-lg text-color-inverse">{label}</AppText>
        {icon}
      </Pressable>
    </Animated.View>
  );
}
