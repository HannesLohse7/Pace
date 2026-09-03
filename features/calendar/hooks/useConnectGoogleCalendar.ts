import { useEffect, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { buildGoogleCalendarAuthUrl } from '@/lib/calendar/googleCalendarAuthUrl';

import { createCalendarConnectionRequest } from '../services/calendarConnectionRequest';
import { useGoogleCalendarConnectionStatus } from './useGoogleCalendarConnectionStatus';

const POLL_INTERVAL_MS = 3_000;
/**
 * How long to keep polling after opening the browser before giving up
 * and going quiet. `WebBrowser.openBrowserAsync` doesn't reliably signal
 * "the athlete finished" across platforms (Android resolves immediately
 * with `{type: 'opened'}` rather than waiting for a dismiss — confirmed
 * against Expo's own docs), so polling `calendar_connection` is the only
 * cross-platform way to notice a real connection landed. Deliberately no
 * distinct "timed out" UI state on top of this — the browser's own
 * success/error page (`google-calendar-oauth-callback`) already told the
 * athlete what happened; if they come back to Pace, the badge just
 * reflects the real status either way.
 */
const CONNECT_WINDOW_MS = 3 * 60 * 1000;

/**
 * Drives onboarding's Calendar step "Connect" flow for Google: creates a
 * short-lived correlation row, opens the consent screen in a system
 * browser (no dev client, no custom URL scheme needed — see
 * `googleCalendarAuthUrl.ts`), then polls the real connection status
 * until it flips to `'connected'` or the window above elapses.
 */
export function useConnectGoogleCalendar(athleteId: string | undefined) {
  const [waitingSince, setWaitingSince] = useState<number | null>(null);

  const statusQuery = useGoogleCalendarConnectionStatus(athleteId, {
    refetchInterval: waitingSince !== null ? POLL_INTERVAL_MS : false,
  });

  const status = statusQuery.data ?? null;

  useEffect(() => {
    if (waitingSince === null) return;
    if (status === 'connected') {
      setWaitingSince(null);
      return;
    }
    const elapsedMs = Date.now() - waitingSince;
    if (elapsedMs >= CONNECT_WINDOW_MS) {
      setWaitingSince(null);
      return;
    }
    const timer = setTimeout(() => setWaitingSince(null), CONNECT_WINDOW_MS - elapsedMs);
    return () => clearTimeout(timer);
  }, [waitingSince, status]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!athleteId) throw new Error('No signed-in athlete.');
      const requestId = await createCalendarConnectionRequest(athleteId);
      await WebBrowser.openBrowserAsync(buildGoogleCalendarAuthUrl(requestId));
    },
    onSuccess: () => setWaitingSince(Date.now()),
  });

  return {
    status,
    isWaiting: waitingSince !== null,
    connect: () => connectMutation.mutate(),
    isConnectPending: connectMutation.isPending,
    connectError: connectMutation.error,
  };
}
