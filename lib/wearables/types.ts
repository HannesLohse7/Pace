/** Matches `wearable_connection.provider`'s CHECK constraint — see docs/DATABASE.md. */
export type WearableProvider =
  'apple_health' | 'garmin' | 'coros' | 'strava' | 'zwift' | 'google_health_connect';

/**
 * Matches `recovery_signal.source`'s own (narrower) CHECK constraint —
 * only providers that actually supply recovery-relevant biometrics
 * (resting HR, HRV, sleep) belong here, unlike `WearableProvider` above,
 * which also covers pure activity sources (Strava, Zwift) that have
 * nothing to do with recovery_signal.
 */
export type RecoverySignalSource = 'apple_health' | 'garmin' | 'coros' | 'manual';

export type WearableConnectionStatus = 'connected' | 'disconnected';
