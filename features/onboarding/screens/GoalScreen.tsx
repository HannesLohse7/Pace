import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components';
import { CheckIcon } from '@/shared/components/icons';
import { colors } from '@/shared/theme/colors';
import { useOnboardingStore } from '@/shared/store';
import type { OnboardingGoal } from '@/shared/store';

import { OnboardingStepShell } from '../components/OnboardingStepShell';

const GOAL_OPTIONS: OnboardingGoal[] = ['Sprint', 'Olympic', '70.3', 'Ironman', 'Custom'];

export function GoalScreen() {
  const goal = useOnboardingStore((s) => s.goal);
  const selectGoal = useOnboardingStore((s) => s.selectGoal);

  return (
    <OnboardingStepShell step="goal" title="What are you training for?">
      <View className="mt-[22px]">
        {GOAL_OPTIONS.map((option) => {
          const isSelected = goal === option;
          return (
            <Pressable
              key={option}
              onPress={() => selectGoal(option)}
              className="flex-row items-center justify-between border-t border-border px-[2px] py-md"
            >
              <AppText className="text-[16px] font-semibold text-color-primary">{option}</AppText>
              <View
                className="h-[20px] w-[20px] items-center justify-center rounded-full border-2"
                style={{
                  borderColor: isSelected ? colors.accent : colors.neutral[100],
                  backgroundColor: isSelected ? colors.accent : 'transparent',
                }}
              >
                {isSelected && <CheckIcon />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStepShell>
  );
}
