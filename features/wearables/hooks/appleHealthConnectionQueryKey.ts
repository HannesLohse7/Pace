/**
 * The one query key every reader/writer of the athlete's Apple Health
 * connection status should use — `useAppleHealthConnectionStatus`,
 * `useConnectAppleHealth`, and `useDisconnectAppleHealth` all share this
 * so a connect or disconnect from Profile invalidates the same cache
 * entry Profile itself reads, instead of each hook holding its own copy.
 * Same split `google-calendar-connection` uses for the same reason.
 */
export function appleHealthConnectionQueryKey(athleteId: string | undefined) {
  return ['apple-health-connection', athleteId] as const;
}
