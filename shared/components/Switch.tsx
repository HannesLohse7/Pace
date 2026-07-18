import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

import { lightColors } from '@/shared/theme/colors';
import { shadows } from '@/shared/theme/shadows';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TRACK_WIDTH = 42;
const TRACK_HEIGHT = 25;
const KNOB_SIZE = 19;
const KNOB_INSET = 3;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2;
const ANIMATION_MS = 200;

/**
 * Track+knob switch matching the source's Dark Mode/Notifications rows
 * exactly (`width:42px;height:25px`, `19px` knob, `0.2s ease` transition).
 *
 * The track's on/off colors are deliberately `lightColors.color.primary`/
 * `lightColors.neutral[100]` (near-black/light-gray), not the live-theme-
 * resolved palette: this is the same reasoning as SplashScreen — the
 * track's own on-state color is meant to read as "dark" regardless of
 * which theme is currently active (if it resolved to the dark palette's
 * `color.primary`, an "on" switch while already in dark mode would
 * render near-white, undermining what the color is supposed to signal).
 */
export function Switch({ value, onValueChange }: SwitchProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, KNOB_TRAVEL] });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={{
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        backgroundColor: value ? lightColors.color.primary : lightColors.neutral[100],
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: KNOB_SIZE / 2,
            backgroundColor: '#FFFFFF',
            marginLeft: KNOB_INSET,
            transform: [{ translateX }],
          },
          shadows.switchKnob,
        ]}
      />
    </Pressable>
  );
}
