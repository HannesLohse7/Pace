import { View } from 'react-native';

import { AppText } from '@/shared/components';

import type { RaceCountdown } from '../types/home';

export interface NextRaceCardProps {
  race: RaceCountdown;
}

/** Race countdown — dark card anchoring the training block to the goal race. */
export function NextRaceCard({ race }: NextRaceCardProps) {
  return (
    <View className="mt-3xl bg-surface-dark px-[26px] py-3xl">
      <AppText
        mono
        className="mb-[14px] text-[10.5px] font-semibold tracking-[1.4px] text-color-inverse-secondary"
      >
        NEXT RACE
      </AppText>

      <View className="flex-row items-end justify-between">
        <View>
          <AppText className="text-heading-2 text-color-inverse">{race.raceName}</AppText>
          <AppText className="mt-[5px] text-caption text-color-inverse-secondary">
            {race.raceDate}
          </AppText>
        </View>
        <View className="items-end">
          <AppText mono className="text-stat text-color-inverse">
            {race.daysToRace}
          </AppText>
          <AppText
            mono
            className="mt-[3px] text-[10px] tracking-[0.4px] text-color-inverse-secondary"
          >
            DAYS
          </AppText>
        </View>
      </View>

      <View className="mt-[22px] h-[3px] overflow-hidden rounded-full bg-white/10">
        <View
          className="h-full rounded-full bg-success-strong"
          style={{ width: `${race.progressPct}%` }}
        />
      </View>

      <AppText className="mt-[10px] text-[11.5px] text-color-inverse-secondary">
        {race.progressLabel}
      </AppText>
    </View>
  );
}
