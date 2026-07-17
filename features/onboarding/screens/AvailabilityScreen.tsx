import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/shared/components';
import { colors } from '@/shared/theme/colors';
import { useOnboardingStore } from '@/shared/store';
import type { PreferredTimeOfDay, TrainingDay } from '@/shared/store';

import { OnboardingContinueButton } from '../components/OnboardingContinueButton';
import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

const DAY_DEFS: { id: TrainingDay; letter: string }[] = [
  { id: 'mon', letter: 'M' },
  { id: 'tue', letter: 'T' },
  { id: 'wed', letter: 'W' },
  { id: 'thu', letter: 'T' },
  { id: 'fri', letter: 'F' },
  { id: 'sat', letter: 'S' },
  { id: 'sun', letter: 'S' },
];

const TIME_DEFS: { id: PreferredTimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'midday', label: 'Midday' },
  { id: 'evening', label: 'Evening' },
];

const MIN_HOURS = 3;
const MAX_HOURS = 20;

function capitalize(day: TrainingDay): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

/**
 * Note on the "don't let the picker allow an inconsistent state"
 * requirement for longWorkoutDay: this screen only ever renders chips
 * for currently-selected training days (selectedDayDefs below, mirroring
 * the source's own longDayOptions = trainDays.filter(...)), and the
 * store's toggleTrainingDay keeps longWorkoutDay a member of
 * trainingDays automatically. Together those two mean an inconsistent
 * selection is structurally impossible to reach through this UI, rather
 * than something caught after the fact — no separate error message is
 * needed for it the way the "select at least one day" case needs one.
 */
export function AvailabilityScreen() {
  const weeklyHours = useOnboardingStore((s) => s.weeklyHours);
  const trainingDays = useOnboardingStore((s) => s.trainingDays);
  const longWorkoutDay = useOnboardingStore((s) => s.longWorkoutDay);
  const preferredTimeOfDay = useOnboardingStore((s) => s.preferredTimeOfDay);
  const setWeeklyHours = useOnboardingStore((s) => s.setWeeklyHours);
  const toggleTrainingDay = useOnboardingStore((s) => s.toggleTrainingDay);
  const setLongWorkoutDay = useOnboardingStore((s) => s.setLongWorkoutDay);
  const setPreferredTimeOfDay = useOnboardingStore((s) => s.setPreferredTimeOfDay);

  const { goNext } = useOnboardingNavigation('availability');
  const [attemptedContinue, setAttemptedContinue] = useState(false);

  const canContinue = trainingDays.length > 0;
  const showNoDaysError = attemptedContinue && !canContinue;
  const selectedDayDefs = DAY_DEFS.filter((d) => trainingDays.includes(d.id));

  return (
    <OnboardingStepShell step="availability" title="How much time do you have?" showFooter={false}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-[26px] flex-row items-center justify-center gap-xl">
          <Pressable
            onPress={() => setWeeklyHours(Math.max(MIN_HOURS, weeklyHours - 1))}
            className="h-[38px] w-[38px] items-center justify-center rounded-full border border-border-strong"
          >
            <AppText className="text-[20px] text-color-primary">−</AppText>
          </Pressable>
          <View className="items-center">
            <AppText mono className="text-[36px] font-bold text-color-primary">
              {weeklyHours}
            </AppText>
            <AppText className="text-[11px] text-color-tertiary">hrs / week</AppText>
          </View>
          <Pressable
            onPress={() => setWeeklyHours(Math.min(MAX_HOURS, weeklyHours + 1))}
            className="h-[38px] w-[38px] items-center justify-center rounded-full border border-border-strong"
          >
            <AppText className="text-[20px] text-color-primary">+</AppText>
          </Pressable>
        </View>

        <AppText
          mono
          className="mt-3xl text-[10px] font-semibold tracking-[0.6px] text-color-tertiary"
        >
          TRAINING DAYS
        </AppText>
        <View className="mt-sm flex-row justify-between">
          {DAY_DEFS.map((day) => {
            const selected = trainingDays.includes(day.id);
            return (
              <Pressable
                key={day.id}
                onPress={() => toggleTrainingDay(day.id)}
                className="h-[36px] w-[36px] items-center justify-center rounded-full"
                style={{ backgroundColor: selected ? colors.accent : colors.surface }}
              >
                <AppText
                  className="text-[12px] font-bold"
                  style={{ color: selected ? colors.color.inverse : colors.color.tertiary }}
                >
                  {day.letter}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {showNoDaysError && (
          <AppText className="mt-xs text-[12px] text-danger">
            Select at least one training day
          </AppText>
        )}

        <AppText
          mono
          className="mt-[26px] text-[10px] font-semibold tracking-[0.6px] text-color-tertiary"
        >
          LONG WORKOUT DAY
        </AppText>
        <View className="mt-[10px] flex-row flex-wrap gap-xs">
          {selectedDayDefs.map((day) => {
            const selected = longWorkoutDay === day.id;
            return (
              <Pressable
                key={day.id}
                onPress={() => setLongWorkoutDay(day.id)}
                className="rounded-full px-[14px] py-[9px]"
                style={{ backgroundColor: selected ? colors.accent : colors.surface }}
              >
                <AppText
                  className="text-[13px] font-semibold"
                  style={{ color: selected ? colors.color.inverse : colors.color.secondary }}
                >
                  {capitalize(day.id)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText
          mono
          className="mt-[26px] text-[10px] font-semibold tracking-[0.6px] text-color-tertiary"
        >
          PREFERRED TIME
        </AppText>
        <View className="mt-[10px] flex-row gap-xs">
          {TIME_DEFS.map((time) => {
            const selected = preferredTimeOfDay === time.id;
            return (
              <Pressable
                key={time.id}
                onPress={() => setPreferredTimeOfDay(time.id)}
                className="flex-1 items-center rounded-[12px] py-[11px]"
                style={{ backgroundColor: selected ? colors.accent : colors.surface }}
              >
                <AppText
                  className="text-[13px] font-semibold"
                  style={{ color: selected ? colors.color.inverse : colors.color.secondary }}
                >
                  {time.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-[30px]">
          <OnboardingContinueButton
            goNext={goNext}
            canContinue={canContinue}
            onInvalidContinue={() => setAttemptedContinue(true)}
          />
        </View>
      </ScrollView>
    </OnboardingStepShell>
  );
}
