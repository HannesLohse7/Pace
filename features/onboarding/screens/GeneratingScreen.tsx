import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { generateTrainingPlan } from '@/lib/planGenerator/generatePlan';
import { supabase } from '@/lib/supabase/client';
import { syncAppleHealthRecoverySignals } from '@/lib/wearables/syncAppleHealthRecoverySignals';
import { AppText, Screen } from '@/shared/components';
import { useOnboardingStore } from '@/shared/store';
import { useThemeColors } from '@/shared/theme/ThemeProvider';
import { toIsoDate } from '@/shared/utils/date';

import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';

/**
 * Onboarding's `goal` values read naturally as UI labels ("70.3",
 * "Ironman"); `race.distance` is a fixed check-constraint vocabulary.
 * "Custom" has no equivalent on the race side, so it maps to 'other'.
 */
const GOAL_TO_RACE_DISTANCE: Record<string, string> = {
  Sprint: 'sprint',
  Olympic: 'olympic',
  '70.3': '70.3',
  Ironman: 'ironman',
  Custom: 'other',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MESSAGES = [
  'Analyzing your schedule…',
  'Building your plan…',
  'Optimizing recovery…',
  'Finding available training windows…',
];

const MESSAGE_INTERVAL_MS = 950;
const FINAL_HOLD_MS = 1000;
/** Matches the source's own `transition: stroke-dashoffset/width 0.4s ease`. */
const PROGRESS_EASE_MS = 400;

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Standalone timed transition, not OnboardingStepShell — the source has no
 * back/continue affordance here, just a self-driving ring + message +
 * progress bar that plays through automatically, matching SplashScreen's
 * pattern of a bare auto-advancing screen rather than the step-shell one.
 *
 * The ring's stroke-dashoffset and the bar's width are driven by a single
 * Animated.Value, not by re-rendering with a freshly-computed prop on
 * every message-index tick — that was the original (jerky-on-device)
 * approach, and it had two compounding problems: no interpolation at all
 * (each tick hard-snapped the value, where the source CSS-transitions it
 * over 0.4s ease), and the snap itself ran as a full React re-render on
 * the JS thread, competing with whatever else is happening during app
 * launch. Animated.timing instead drives both via setNativeProps under
 * the hood, with proper easing, without re-rendering the component on
 * every frame. The message-text swap stays on its own plain JS timer —
 * text has no smooth-animation concern the way the ring/bar do — but it
 * only tells the Animated.Value what to ease toward next; it no longer
 * drives the visual animation directly.
 *
 * Tried react-native-reanimated first (already a project dependency), but
 * its web platform has an unimplemented SVG-animation stub (literally a
 * `// TODO: Add web support for SVG components` in its own source) and,
 * in this project's Expo-web setup, non-SVG useAnimatedStyle updates
 * didn't visibly apply either, even with the dependency-array workaround
 * its docs call for. Core Animated has none of that risk — it's the
 * long-established, first-class-on-web implementation — so it's the
 * safer choice here despite reanimated being installed.
 *
 * useNativeDriver is false for both: neither stroke-dashoffset nor width
 * is on the native driver's supported-property list (only transform and
 * opacity are) in either Animated implementation, so this isn't a
 * shortcut — there's no native-driver-eligible version of this specific
 * animation to opt into.
 *
 * **No longer creates the Supabase account itself** (moved to
 * `AccountScreen.tsx`, 2026-09-09, real-device test) — a duplicate
 * email needs to fail immediately on the Account step, not after the
 * rest of onboarding plays out. This screen just reads the session
 * Account already established and finishes provisioning (the
 * `athlete_profile` row, the wearables sync, and race/plan/phase/
 * workout rows once goal/race/availability are known — none of that
 * could happen any earlier since it depends on answers from steps
 * after Account).
 */
export function GeneratingScreen() {
  useOnboardingNavigation('generating');
  const router = useRouter();
  const colors = useThemeColors();
  const [messageIndex, setMessageIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const accountName = useOnboardingStore((s) => s.accountName);
  const accountEmail = useOnboardingStore((s) => s.accountEmail);
  const goal = useOnboardingStore((s) => s.goal);
  const raceName = useOnboardingStore((s) => s.raceName);
  const raceDate = useOnboardingStore((s) => s.raceDate);
  const weeklyHours = useOnboardingStore((s) => s.weeklyHours);
  const trainingDays = useOnboardingStore((s) => s.trainingDays);
  const longWorkoutDay = useOnboardingStore((s) => s.longWorkoutDay);
  const wearables = useOnboardingStore((s) => s.wearables);

  // 'pending' while provisioning is in flight, 'ready' once the athlete
  // has something worth landing them in the app for -- the final-
  // message timer below waits on this before navigating to (tabs).
  const [accountOutcome, setAccountOutcome] = useState<'pending' | 'ready'>('pending');
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function provisionAthlete() {
      // The real signup already happened back on the Account step --
      // this reads that session rather than creating it. `getSession()`
      // reads the locally-cached session (no network round trip), so
      // this resolves immediately in the normal case.
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;

      const user = sessionData.session?.user;
      if (!user) {
        // No session despite Account's signUp succeeding -- either this
        // Supabase project requires email confirmation (a real account
        // exists, but this device can't write RLS-protected rows
        // (athlete_profile, race) until it holds a session, and there's
        // no sign-in screen yet to obtain one -- see docs/ROADMAP.md's
        // status note) or something cleared the session between steps.
        // Either way there's no user id to provision against, so land
        // the athlete in the app rather than getting stuck here --
        // `app/index.tsx` already tolerates a session with no
        // `athlete_profile` row.
        if (!cancelled) setAccountOutcome('ready');
        return;
      }

      {
        const { error: profileError } = await supabase.from('athlete_profile').insert({
          id: user.id,
          display_name: accountName,
          email: accountEmail,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        if (profileError) {
          console.error('[onboarding] athlete_profile insert failed:', profileError.message);
        } else {
          // Real athlete session exists from this point on -- the one
          // moment `syncAppleHealthRecoverySignals` can actually write.
          // Gated on the store flag `WearablesScreen.tsx` set after a
          // real HealthKit authorization grant (2026-09-09 fix -- see
          // that screen's own doc comment: attempting this write earlier,
          // during onboarding's Wearables step, always failed with no
          // signed-in athlete yet). Best-effort, same as every other
          // write in this effect -- a sync failure here shouldn't block
          // account creation or plan generation below.
          if (wearables.appleHealth) {
            try {
              const result = await syncAppleHealthRecoverySignals(user.id);
              if (!result.ok) {
                console.error('[onboarding] Apple Health sync failed:', result.reason);
              }
            } catch (err) {
              console.error('[onboarding] Apple Health sync threw:', err);
            }
          }

          if (goal && raceName.trim() && raceDate) {
            const raceDistance = GOAL_TO_RACE_DISTANCE[goal] ?? 'other';
            const { data: raceRow, error: raceError } = await supabase
              .from('race')
              .insert({
                athlete_id: user.id,
                name: raceName.trim(),
                race_date: raceDate,
                distance: raceDistance,
              })
              .select()
              .single();

            if (raceError || !raceRow) {
              console.error('[onboarding] race insert failed:', raceError?.message);
            } else {
              // generateTrainingPlan covers Sprint, Olympic, 70.3 and Ironman.
              // It returns null for 'other' (onboarding's "Custom"), which is
              // correct: there's no template for an unspecified distance, so
              // nothing is inserted rather than guessing.
              // This is also the only place today's availability answers
              // (weeklyHours/trainingDays/longWorkoutDay) get used -- there's
              // no `availability_rule` table yet to persist them separately,
              // so a plan can only be generated right here, while they're
              // still in memory from onboarding.
              const plan = generateTrainingPlan({
                raceDistance,
                raceDate,
                startDate: toIsoDate(new Date()),
                weeklyHours,
                trainingDays,
                longWorkoutDay,
              });

              if (plan) {
                if (plan.warnings.length > 0) {
                  console.warn('[onboarding] plan generation warnings:', plan.warnings);
                }
                const { data: planRow, error: planError } = await supabase
                  .from('training_plan')
                  .insert({
                    athlete_id: user.id,
                    race_id: raceRow.id,
                    start_date: plan.startDate,
                    end_date: plan.endDate,
                    weeks: plan.weeks,
                    status: 'active',
                  })
                  .select()
                  .single();

                if (planError || !planRow) {
                  console.error('[onboarding] training_plan insert failed:', planError?.message);
                } else {
                  const { error: phaseError } = await supabase.from('training_phase').insert(
                    plan.phases.map((phase) => ({
                      training_plan_id: planRow.id,
                      athlete_id: user.id,
                      name: phase.name,
                      sequence: phase.sequence,
                      start_date: phase.startDate,
                      end_date: phase.endDate,
                    })),
                  );
                  if (phaseError) {
                    console.error('[onboarding] training_phase insert failed:', phaseError.message);
                  }

                  const { error: workoutError } = await supabase.from('workout').insert(
                    plan.workouts.map((workout) => ({
                      training_plan_id: planRow.id,
                      athlete_id: user.id,
                      scheduled_date: workout.scheduledDate,
                      discipline: workout.discipline,
                      title: workout.title,
                      planned_duration_min: workout.plannedDurationMin,
                      intensity: workout.intensity,
                      description: workout.description,
                      status: 'planned',
                    })),
                  );
                  if (workoutError) {
                    console.error('[onboarding] workout insert failed:', workoutError.message);
                  }
                }
              }
            }
          }
        }
      }

      if (!cancelled) setAccountOutcome('ready');
    }

    provisionAthlete();
    return () => {
      cancelled = true;
    };
    // Intentionally onboarding-store fields only — this call must fire
    // exactly once on mount, not re-run as the athlete's own typing
    // elsewhere in the flow changes these values after the fact.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const target = (messageIndex + 1) / MESSAGES.length;
    Animated.timing(progress, {
      toValue: target,
      duration: PROGRESS_EASE_MS,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [messageIndex, progress]);

  useEffect(() => {
    if (messageIndex < MESSAGES.length - 1) {
      const timer = setTimeout(() => setMessageIndex((i) => i + 1), MESSAGE_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setIsAnimationDone(true), FINAL_HOLD_MS);
    return () => clearTimeout(timer);
  }, [messageIndex]);

  // Navigate once BOTH the visual sequence has played through and the
  // real signup call has resolved — whichever finishes last. A fast
  // network shouldn't cut the animation short, and a slow one shouldn't
  // dump the athlete into the app before their account actually exists.
  useEffect(() => {
    if (isAnimationDone && accountOutcome === 'ready') {
      router.replace('/(tabs)');
    }
  }, [isAnimationDone, accountOutcome, router]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const widthPct = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Screen edges={['top', 'bottom']} className="items-center justify-center gap-xl px-[40px]">
      <Svg width={52} height={52} viewBox="0 0 52 52">
        <Circle
          cx={26}
          cy={26}
          r={RING_RADIUS}
          fill="none"
          stroke={colors['border-soft']}
          strokeWidth={3}
        />
        <AnimatedCircle
          cx={26}
          cy={26}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.accent}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 26 26)"
        />
      </Svg>

      <AppText className="text-center text-[16px] font-semibold text-color-primary">
        {MESSAGES[messageIndex]}
      </AppText>

      <View
        className="h-[3px] w-full overflow-hidden rounded-full"
        style={{ backgroundColor: colors['border-soft'] }}
      >
        <Animated.View
          className="h-full rounded-full"
          style={{ width: widthPct, backgroundColor: colors.accent }}
        />
      </View>
    </Screen>
  );
}
