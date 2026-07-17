import { Pressable, View } from 'react-native';

import { AppText, ProgressRing, Screen } from '@/shared/components';

import { NextRaceCard, TodayCard, UpcomingList, WeekStrip } from '../components';
import {
  athleteFirstName,
  coachMessage,
  dateLabel,
  personalRecordLine,
  raceCountdown,
  recoveryScore,
  todayWorkout,
  upcomingWorkouts,
  weekStrip,
  weekSummary,
} from '../data/mockHomeData';

export interface HomeScreenProps {
  /** TODO(Milestone: Progress tab): navigate to Progress when the recovery ring is tapped. */
  onOpenRecovery?: () => void;
  /** TODO(Milestone: Coach tab): navigate to Coach when the message teaser is tapped. */
  onOpenCoach?: () => void;
  /** TODO(Milestone: Workout detail): open the workout detail overlay. */
  onOpenWorkout?: () => void;
}

export function HomeScreen({ onOpenRecovery, onOpenCoach, onOpenWorkout }: HomeScreenProps) {
  return (
    <Screen scroll className="pb-lg pt-sm">
      <View className="flex-row items-start justify-between px-screen-x">
        <View>
          <AppText mono className="mb-[10px] text-eyebrow-sm text-color-quaternary">
            {dateLabel}
          </AppText>
          <AppText className="text-display text-color-primary">
            Good morning,{'\n'}
            {athleteFirstName}.
          </AppText>
        </View>

        <Pressable onPress={onOpenRecovery} className="items-center gap-[4px]">
          <ProgressRing progress={recoveryScore}>
            <AppText mono className="text-[26px] font-bold text-color-primary">
              {recoveryScore}
            </AppText>
          </ProgressRing>
          <AppText mono className="text-[9px] font-semibold tracking-[0.6px] text-color-tertiary">
            RECOVERY
          </AppText>
        </Pressable>
      </View>

      <Pressable onPress={onOpenCoach} className="mx-screen-x mt-[18px] border-t border-border-faint pt-[14px]">
        <AppText className="text-body-sm text-color-secondary">{coachMessage}</AppText>
      </Pressable>

      <TodayCard workout={todayWorkout} onPress={onOpenWorkout} onStartWorkout={onOpenWorkout} />

      <WeekStrip days={weekStrip} summary={weekSummary} />

      <UpcomingList items={upcomingWorkouts} onPressItem={onOpenWorkout} />

      <NextRaceCard race={raceCountdown} />

      <AppText className="px-screen-x pb-[4px] pt-lg text-caption text-color-tertiary">
        {personalRecordLine}
      </AppText>
    </Screen>
  );
}
