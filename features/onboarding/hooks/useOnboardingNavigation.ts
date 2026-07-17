import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { ONBOARDING_STEPS, useOnboardingStore } from '@/shared/store';
import type { OnboardingStep } from '@/shared/store';

/**
 * Keeps the onboarding store's `step` field and the actually-rendered
 * route in agreement — the store must never disagree with what's on
 * screen. Each onboarding route calls this with its own step identity.
 *
 * Two things make that hold:
 * 1. On every focus (not just mount — this also covers the OS back
 *    gesture / hardware back button, which pop the stack without ever
 *    calling goNext/goBack below), the store is synced to `currentStep`.
 *    The route is the source of truth; the store mirrors it.
 * 2. `goNext`/`goBack`/`goToAndNavigate` both navigate AND update the
 *    store together, so explicit forward/back actions can't drift either.
 *
 * The store itself stays free of any expo-router dependency (kept that
 * way deliberately — it's what let the whole store be verified with a
 * plain Node script, no React/RN involved, in Milestone 1). This hook is
 * the seam where store state and navigation meet instead.
 */
export function useOnboardingNavigation(currentStep: OnboardingStep) {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);

  useFocusEffect(
    useCallback(() => {
      goToStep(currentStep);
    }, [currentStep, goToStep]),
  );

  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;

  const goNext = useCallback(() => {
    if (isLastStep) return;
    const nextStep = ONBOARDING_STEPS[currentIndex + 1];
    if (!nextStep) return;
    router.push(`/${nextStep}`);
  }, [currentIndex, isLastStep, router]);

  const goBack = useCallback(() => {
    if (isFirstStep) return;
    router.back();
  }, [isFirstStep, router]);

  const goToAndNavigate = useCallback(
    (step: OnboardingStep) => {
      router.push(`/${step}`);
    },
    [router],
  );

  return { goNext, goBack, goToAndNavigate, isFirstStep, isLastStep, currentIndex };
}
