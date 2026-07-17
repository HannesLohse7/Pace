import { View } from 'react-native';

import { AppText } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';

import { OnboardingStepShell } from '../components/OnboardingStepShell';
import { OnboardingTextField } from '../components/OnboardingTextField';

export function RaceScreen() {
  const goal = useOnboardingStore((s) => s.goal);
  const raceName = useOnboardingStore((s) => s.raceName);
  const raceDate = useOnboardingStore((s) => s.raceDate);
  const setRaceName = useOnboardingStore((s) => s.setRaceName);
  const setRaceDate = useOnboardingStore((s) => s.setRaceDate);

  return (
    <OnboardingStepShell step="race" title="Set up your race">
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
        {/*
          Source uses a native HTML date input here. React Native has no
          built-in equivalent — a real date picker needs a dedicated
          library (e.g. @react-native-community/datetimepicker), which
          isn't installed. Plain text entry for now; flagged in the
          checkpoint report rather than silently picking a library or
          faking picker UI.
        */}
        <OnboardingTextField
          label="RACE DATE"
          value={raceDate}
          onChangeText={setRaceDate}
          placeholder="2026-10-06"
        />
      </View>
    </OnboardingStepShell>
  );
}
