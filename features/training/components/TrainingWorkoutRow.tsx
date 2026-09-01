import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { AppText, SportDot } from '@/shared/components';
import { CheckIcon, DragHandleIcon } from '@/shared/components/icons';
import { isSwappable } from '@/shared/store';
import { shadows } from '@/shared/theme/shadows';
import { useThemeColors } from '@/shared/theme/ThemeProvider';

import type { PlannedWorkout } from '../types/training';

/**
 * Fixed row height (measured from the row's own 2-line content at 79px,
 * rounded to the 4px spacing grid). This is the load-bearing constant
 * of the whole custom drag-reorder model below, not just a cosmetic
 * choice: every row's position is `index * ROW_HEIGHT`, and the drag
 * gesture converts the dragged row's live Y position back into a
 * target index by dividing by this same constant — both directions of
 * that math require every row to be exactly this tall, always,
 * regardless of content (paired with `numberOfLines={1}` below on both
 * text lines so no row can ever grow or shrink and throw the math off).
 */
export const ROW_HEIGHT = 80;

/** How long a press must hold on the drag handle before a drag activates — matches the pre-existing long-press-to-pick-up interaction. */
const DRAG_ACTIVATION_MS = 250;

export interface TrainingWorkoutRowProps {
  workout: PlannedWorkout;
  index: number;
  /** Whether this row's calendar day is today -- computed by the parent from the real current date, not a mock-data constant. */
  isToday: boolean;
  /** Total row count, used to clamp the computed target index in range. */
  rowCount: number;
  /** Index of the row currently being dragged, or -1 when none is. Shared across all rows so only one can ever render elevated. */
  activeIndex: SharedValue<number>;
  /** Live Y offset of the currently-dragged row, read only by the row whose own index matches `activeIndex`. */
  dragTranslationY: SharedValue<number>;
  onDragEnd: (from: number, to: number) => void;
}

/**
 * A single Training row — Milestone 3 Checkpoint 3, replacing
 * react-native-draggable-flatlist entirely after three rounds of
 * on-device bugs that all traced back to that library's internal
 * position-tracking cache going stale relative to the actual array
 * state. This is a hand-built alternative with no such cache:
 *
 * - Every row is absolutely positioned at `index * ROW_HEIGHT`, via a
 *   *plain* (non-Reanimated) style object recomputed directly from the
 *   current array on every render. This is deliberate, not an
 *   oversight: it guarantees the resting position of all 7 rows is
 *   always correct regardless of any Reanimated timing/platform quirk
 *   (this project has already hit one such quirk — see
 *   GeneratingScreen.tsx's doc comment on web-specific useAnimatedStyle
 *   gaps) — Reanimated is only involved in the *live* drag feedback,
 *   layered on top via a separate animated style.
 * - The drag handle (rendered only for `isSwappable` workouts, same
 *   rule as before) carries a `Gesture.Pan()` that activates after a
 *   long press, exactly mirroring the previous long-press-to-pick-up
 *   interaction. While dragging, only *this* row's rendered position
 *   follows the gesture (via the shared `activeIndex`/`dragTranslationY`
 *   values) — every other row stays exactly at its own fixed
 *   `index * ROW_HEIGHT`, never influenced by someone else's drag.
 * - The target index is computed fresh every gesture update and again
 *   on release, straight from `(index * ROW_HEIGHT + translationY) /
 *   ROW_HEIGHT`, clamped to the row range — never cached, never
 *   tracked as separate state that could drift from this calculation.
 * - On release, the actual reorder decision (validate + commit or
 *   reject) is delegated to `onDragEnd`, which is `useTrainingStore`'s
 *   `reorderWeek` — kept out of this component per the project's
 *   UI/business-logic separation, same as every previous round.
 */
export function TrainingWorkoutRow({
  workout,
  index,
  isToday,
  rowCount,
  activeIndex,
  dragTranslationY,
  onDragEnd,
}: TrainingWorkoutRowProps) {
  const router = useRouter();
  const colors = useThemeColors();

  const isRest = workout.discipline === 'rest';
  const draggable = isSwappable(workout);

  // Always returns every key it ever sets (transform/zIndex/shadow*),
  // with explicit "off" values when inactive — never an empty `{}`.
  // useAnimatedStyle omitting a key between evaluations is a known
  // native-only footgun: RN's style diffing only patches keys that are
  // actually present in the new style object, so a key that's simply
  // *absent* (rather than explicitly reset) can leave the view's
  // previous native transform/elevation/shadow in place indefinitely —
  // invisible on web (where an absent inline-style key does reset,
  // which is exactly why this wasn't caught here), but on a real device
  // this is a plausible, well-documented explanation for a dragged tile
  // staying visually "stuck" mid-air after release.
  const dragOverlayStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;
    return {
      transform: [{ translateY: isActive ? dragTranslationY.value : 0 }],
      zIndex: isActive ? 10 : 0,
      elevation: isActive ? shadows.dragged.elevation : 0,
      shadowColor: shadows.dragged.shadowColor,
      shadowOffset: isActive ? shadows.dragged.shadowOffset : { width: 0, height: 0 },
      shadowOpacity: isActive ? shadows.dragged.shadowOpacity : 0,
      shadowRadius: isActive ? shadows.dragged.shadowRadius : 0,
    };
  });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(DRAG_ACTIVATION_MS)
    .onStart(() => {
      activeIndex.value = index;
      dragTranslationY.value = 0;
    })
    .onUpdate((event) => {
      dragTranslationY.value = event.translationY;
    })
    .onEnd((event) => {
      const currentY = index * ROW_HEIGHT + event.translationY;
      const targetIndex = Math.min(rowCount - 1, Math.max(0, Math.round(currentY / ROW_HEIGHT)));
      runOnJS(onDragEnd)(index, targetIndex);
    })
    .onFinalize(() => {
      // Synchronous, unconditional resets — deliberately not animated.
      // The previous version eased dragTranslationY back to 0 via
      // withTiming and only cleared activeIndex inside that animation's
      // completion callback once it reported `finished`. That's an
      // avoidable async dependency for state whose entire job is
      // guaranteeing cleanup: if that callback is ever skipped or
      // interrupted (a second drag starting before the first's ease-out
      // finishes, a dropped frame, anything) on a real device, the row
      // never got un-marked as active — plausible root cause for the
      // reported "stuck" symptom. Resetting both values directly here
      // means cleanup can never depend on an animation callback firing.
      activeIndex.value = -1;
      dragTranslationY.value = 0;
    });

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: index * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT },
        dragOverlayStyle,
      ]}
    >
      <Pressable
        // Synthesized "Rest Day" placeholders (`isReal: false`) have no
        // backing `workout` row for the detail screen to look up --
        // guard navigation rather than pushing a route that will only
        // ever show "Workout not found."
        onPress={
          workout.isReal
            ? () => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })
            : undefined
        }
        className="h-full flex-row items-center gap-sm border-t border-border px-screen-x"
        // Opaque (colors.background), not 'transparent' — rows can now
        // visually pass over one another while a drag is in progress
        // (they never overlap at rest), and a transparent row would let
        // whatever's underneath show through mid-drag.
        style={{ backgroundColor: isToday ? colors.surface : colors.background }}
      >
        <View className="w-[38px]">
          <AppText mono className="text-[10px] font-semibold text-color-tertiary">
            {workout.short}
          </AppText>
          <AppText mono className="mt-[2px] text-[13px] font-semibold text-color-primary">
            {workout.dateNum}
          </AppText>
        </View>

        <SportDot color={colors.sport[workout.discipline]} />

        <View className="flex-1">
          <AppText
            numberOfLines={1}
            className="text-[15px] font-semibold"
            style={{ color: isRest ? colors.color.quaternary : colors.color.primary }}
          >
            {workout.title}
          </AppText>
          <AppText numberOfLines={1} className="mt-[2px] text-[12px] text-color-tertiary">
            {workout.duration} · {workout.intensity}
          </AppText>
        </View>

        {workout.status === 'completed' && (
          <View
            className="h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: colors['success-bg'] }}
          >
            <CheckIcon size={10} color={colors.success} strokeWidth={2.6} />
          </View>
        )}
        {workout.status === 'missed' && (
          <AppText className="text-[11px] font-semibold text-danger">Missed</AppText>
        )}
        {draggable && (
          <GestureDetector gesture={panGesture}>
            <View hitSlop={12} className="pl-1">
              <DragHandleIcon />
            </View>
          </GestureDetector>
        )}
      </Pressable>
    </Animated.View>
  );
}
