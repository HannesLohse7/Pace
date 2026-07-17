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
  /**
   * Stretches to fill its container with uniform 16px padding, matching
   * the onboarding CTA buttons (Get Started/Continue), instead of the
   * default content-hugging 14px/24px padding used by e.g. Home's
   * "Start Workout".
   */
  fullWidth?: boolean;
  className?: string;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  fullWidth,
  className,
}: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const sizeClasses = fullWidth ? 'w-full px-md py-md' : 'px-xl py-[14px]';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        className={`flex-row items-center justify-center gap-[9px] rounded-full bg-accent ${sizeClasses} ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
        style={shadows.button}
      >
        <AppText className="text-label-lg text-color-inverse">{label}</AppText>
        {icon}
      </Pressable>
    </Animated.View>
  );
}
