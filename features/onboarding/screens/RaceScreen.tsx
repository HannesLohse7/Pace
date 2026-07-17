import { View } from 'react-native';

import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';

import { OnboardingDateField } from '../components/OnboardingDateField';
import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { OnboardingTextField } from '../components/OnboardingTextField';

export function RaceScreen() {
  const goal = useOnboardingStore((s) => s.goal);
  const raceName = useOnboardingStore((s) => s.raceName);
  const raceDate = useOnboardingStore((s) => s.raceDate);
  const setRaceName = useOnboardingStore((s) => s.setRaceName);
  const setRaceDate = useOnboardingStore((s) => s.setRaceDate);

  const canContinue = raceName.trim().length > 0 && raceDate.length > 0;

  return (
    <OnboardingStepShell step="race" title="Set up your race" canContinue={canContinue}>
      <View className="mt-[14px] self-start rounded-full bg-tint px-sm py-[6px]">
        <AppText mono className="text-[11px] font-bold text-accent">
          {goal ?? 'Ironman'}
        </AppText>
      </View>

      <View className="mt-xl gap-[22px]">
        <OnboardingTextField
          label="RACE NAME"
          value={raceName}
          onChangeText={setRaceName}
          placeholder="Ironman Lake Placid"
        />
        <OnboardingDateField
          label="RACE DATE"
          value={raceDate}
          onChange={setRaceDate}
          placeholder="2026-10-06"
        />
      </View>
    </OnboardingStepShell>
  );
}
