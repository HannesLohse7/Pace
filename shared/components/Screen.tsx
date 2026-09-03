import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

export interface ScreenProps {
  children: ReactNode;
  /** Wraps content in a ScrollView. Defaults to false. */
  scroll?: boolean;
  /** Extra NativeWind classes for the inner content container. */
  className?: string;
  /**
   * Safe-area edges to apply. Defaults to `['top']` — the source pads every
   * screen ~58px for status-bar clearance, but that's a static approximation
   * for one simulated device; real safe-area insets adapt correctly across
   * notch/Dynamic Island sizes instead, so screens should layer any extra
   * breathing room on top of this via spacing tokens rather than the source's
   * literal 58px.
   */
  edges?: Edge[];
  /**
   * Pull-to-refresh. Only meaningful (and only rendered) when `scroll` is
   * true, and only when `onRefresh` is supplied — a scrolling screen with
   * nothing worth manually re-fetching (Coach's chat log, say) should leave
   * both unset rather than wiring a spinner that would do nothing. Pass a
   * query's own `isFetching`/`refetch` straight through; `refreshing`
   * defaults to false so passing `onRefresh` alone still renders correctly.
   */
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  scroll = false,
  className,
  edges = ['top'],
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const colors = useThemeColors();
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        contentContainerClassName: className,
        className: 'flex-1',
        ...(onRefresh && {
          refreshControl: (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          ),
        }),
      }
    : { className: `flex-1 ${className ?? ''}` };

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      <Container {...containerProps}>{children}</Container>
    </SafeAreaView>
  );
}
