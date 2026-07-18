import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { OnboardingBackButton } from '@/features/onboarding/components/OnboardingBackButton';
import { OnboardingTextField } from '@/features/onboarding/components/OnboardingTextField';
import { AppText, PrimaryButton, Screen } from '@/shared/components';
import { useProfileStore } from '@/shared/store';

import { getInitials } from '../utils/getInitials';

/**
 * Modal-presented (see the `edit-profile` Stack.Screen in app/_layout.tsx)
 * so it layers above the tab bar instead of pushing within it — the
 * pattern that file's own comment already anticipated for Milestone 3
 * overlay screens. No design-export reference exists for an edit-profile
 * screen, so this mirrors OnboardingStepShell's layout (back button,
 * title, content, px-screen-x/pt-screen-top spacing) rather than
 * inventing a new one — the closest existing "edit basic profile text"
 * pattern already in this codebase (onboarding's Account screen).
 *
 * Edits happen in local draft state; nothing commits to `useProfileStore`
 * until Save is tapped, so backing out via the header button discards
 * changes cleanly.
 *
 * Fields: name only. Avatar isn't a separate field — it's derived
 * initials, matching Checkpoint 1's fallback approach, so it just
 * updates live as the name is typed. No other profile fields (weekly
 * hours, disciplines, race goal) are editable here — the design export
 * doesn't show them as user-editable anywhere, and the task scoped this
 * to "at minimum name and avatar."
 */
export function EditProfileScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const setName = useProfileStore((s) => s.setName);
  const [draftName, setDraftName] = useState(profile.name);

  const trimmedName = draftName.trim();
  const canSave = trimmedName.length > 0;

  // Falls back to a direct route when there's no history to pop —
  // reachable if this screen is ever entered via a deep link rather than
  // the in-app "Edit Profile" tap, which always pushes a real back entry.
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    setName(trimmedName);
    goBack();
  };

  return (
    <Screen edges={['top', 'bottom']} className="px-screen-x pt-screen-top pb-lg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <OnboardingBackButton onPress={goBack} />

        <AppText className="text-[25px] font-bold tracking-[-0.5px] text-color-primary">
          Edit Profile
        </AppText>

        <View className="mt-2xl items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-tint">
            <AppText className="text-[24px] font-bold text-accent">
              {getInitials(draftName || profile.name)}
            </AppText>
          </View>
        </View>

        <View className="mt-2xl">
          <OnboardingTextField
            label="NAME"
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Alex Rivera"
            error={canSave ? undefined : 'Name can’t be empty'}
          />
        </View>

        <View className="flex-1" />

        <PrimaryButton label="Save" onPress={handleSave} disabled={!canSave} fullWidth />
      </KeyboardAvoidingView>
    </Screen>
  );
}
