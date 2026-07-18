import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/shared/theme/ThemeProvider';
import { spacing } from '@/shared/theme/spacing';

import { AppText } from './AppText';
import { CoachIcon, HomeIcon, ProfileIcon, ProgressIcon, TrainingIcon } from './icons';
import type { IconProps } from './icons';

export type TabKey = 'home' | 'training' | 'coach' | 'progress' | 'profile';

export interface TabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; Icon: (props: IconProps) => ReactElement }[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'training', label: 'Training', Icon: TrainingIcon },
  { key: 'coach', label: 'Coach', Icon: CoachIcon },
  { key: 'progress', label: 'Progress', Icon: ProgressIcon },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon },
];

export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  // The source hardcodes a static 26px bottom padding to approximate the
  // home-indicator clearance of the one device it was designed against.
  // Real devices vary (notch/Dynamic Island/no inset at all on older
  // hardware or Android), so this uses the actual safe-area inset plus a
  // small fixed breathing space instead of that static guess.
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const paddingBottom = insets.bottom + spacing['2xs'];

  return (
    <View
      className="flex-row items-center justify-around border-t border-border bg-background px-[6px] pt-xs"
      style={{ paddingBottom }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const active = key === activeTab;
        const tint = active ? colors.accent : colors.color.quaternary;

        return (
          <Pressable
            key={key}
            onPress={() => onTabPress(key)}
            className="items-center gap-[5px] rounded-[14px] px-md py-xs"
            style={{ backgroundColor: active ? colors.tint : 'transparent' }}
          >
            <Icon size={22} color={tint} />
            <AppText className="text-micro-sm" style={{ color: tint }}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
