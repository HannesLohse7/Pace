import { useState } from 'react';
import { View } from 'react-native';

import { AppText, TabBar, type TabKey } from '@/shared/components';
import { HomeScreen } from '@/features/home/screens/HomeScreen';

const COMING_SOON_LABEL: Record<Exclude<TabKey, 'home'>, string> = {
  training: 'Training',
  coach: 'Coach',
  progress: 'Progress',
  profile: 'Profile',
};

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        {activeTab === 'home' ? (
          <HomeScreen />
        ) : (
          <View className="flex-1 items-center justify-center bg-background">
            <AppText className="text-body text-color-tertiary">
              {COMING_SOON_LABEL[activeTab]} — coming in a later milestone
            </AppText>
          </View>
        )}
      </View>
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
