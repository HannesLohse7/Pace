import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { TabBar, type TabKey } from '@/shared/components';

const ROUTE_NAME_TO_TAB: Record<string, TabKey> = {
  index: 'home',
  training: 'training',
  coach: 'coach',
  progress: 'progress',
  profile: 'profile',
};

const TAB_TO_ROUTE_NAME: Record<TabKey, string> = {
  home: 'index',
  training: 'training',
  coach: 'coach',
  progress: 'progress',
  profile: 'profile',
};

/**
 * Adapts react-navigation's bottom-tabs render props to the existing TabBar
 * component's simpler (activeTab, onTabPress) API, so the tab bar's visual
 * design — verified pixel-for-pixel in Checkpoint 4 — is reused unchanged
 * rather than rebuilt against the navigator's descriptor/options API.
 */
function ConnectedTabBar({ state, navigation }: BottomTabBarProps) {
  const activeTab = ROUTE_NAME_TO_TAB[state.routes[state.index]?.name ?? 'index'] ?? 'home';

  const handleTabPress = (tab: TabKey) => {
    navigation.navigate(TAB_TO_ROUTE_NAME[tab]);
  };

  return <TabBar activeTab={activeTab} onTabPress={handleTabPress} />;
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <ConnectedTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="training" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
