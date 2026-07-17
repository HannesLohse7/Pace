import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

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
}

export function Screen({ children, scroll = false, className, edges = ['top'] }: ScreenProps) {
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? { contentContainerClassName: className, className: 'flex-1' }
    : { className: `flex-1 ${className ?? ''}` };

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      <Container {...containerProps}>{children}</Container>
    </SafeAreaView>
  );
}
