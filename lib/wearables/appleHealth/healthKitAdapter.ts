import { Platform } from 'react-native';

/**
 * Thin wrapper around `@kingstinct/react-native-healthkit`'s native API
 * — isolated in this one file specifically so nothing else in this app
 * imports that package directly. Two independent reasons:
 *
 * 1. It's a native module (see docs/ROADMAP.md's HealthKit section) —
 *    it cannot run inside Expo Go, only a custom dev client (EAS Build
 *    or a local `expo run:ios`). Importing it anywhere outside this
 *    adapter would make every one of those files fail the same way in
 *    the wrong environment, instead of the failure being contained here.
 * 2. This session wrote this adapter from the package's published docs
 *    (https://kingstinct-react-native-healthkit.mintlify.app) and its
 *    README, not by compiling against it — there is no native build
 *    environment or physical iOS device available in this cloud
 *    session to verify the exact function names, HealthKit
 *    type-identifier strings, or `queryQuantitySamples` option shape
 *    against your installed package version. **Verify this file
 *    compiles and the authorization prompt/queries behave as expected
 *    the first time you build a dev client and run this on a real
 *    device.** If anything's off, it should only ever need fixing in
 *    this one file — every caller only sees the plain types below.
 *
 * Deliberately narrow: only resting heart rate and HRV (SDNN), both
 * `HKQuantityTypeIdentifier` samples — the best-documented, most stable
 * part of HealthKit's API surface. Sleep analysis was left out of this
 * round on purpose: it's a `HKCategoryTypeIdentifier` with a sleep-stage
 * value enum (inBed/asleepCore/asleepDeep/asleepREM/awake) that would
 * need its own real value-mapping logic this session couldn't verify
 * with any confidence — see docs/ROADMAP.md for that as an explicit
 * follow-up rather than guessed-at code shipped now.
 */

const RESTING_HR_IDENTIFIER = 'HKQuantityTypeIdentifierRestingHeartRate';
const HRV_SDNN_IDENTIFIER = 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN';

export interface QuantitySample {
  /** ISO 'YYYY-MM-DD' — the sample's own start date, truncated to a day. */
  date: string;
  value: number;
}

export async function isAppleHealthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const { isHealthDataAvailable } = await import('@kingstinct/react-native-healthkit');
  return isHealthDataAvailable();
}

export async function requestAppleHealthReadAccess(): Promise<void> {
  const { requestAuthorization } = await import('@kingstinct/react-native-healthkit');
  await requestAuthorization({
    toRead: [RESTING_HR_IDENTIFIER, HRV_SDNN_IDENTIFIER],
  });
}

/**
 * The most recent resting-heart-rate samples, newest first — callers
 * filter/aggregate by date themselves (see `syncAppleHealthRecoverySignals.ts`)
 * rather than this adapter guessing at a `startDate`/`endDate` filter
 * option this session couldn't confirm the exact shape of. `sampleLimit`
 * should be generous relative to the number of *days* actually wanted,
 * since some sources write more than one sample per day.
 */
export async function fetchRecentRestingHeartRate(sampleLimit: number): Promise<QuantitySample[]> {
  const { queryQuantitySamples } = await import('@kingstinct/react-native-healthkit');
  const samples = await queryQuantitySamples(RESTING_HR_IDENTIFIER, {
    limit: sampleLimit,
    ascending: false,
  });
  return toQuantitySamples(samples);
}

/** Same shape as `fetchRecentRestingHeartRate`, for HRV (SDNN, in milliseconds). */
export async function fetchRecentHrv(sampleLimit: number): Promise<QuantitySample[]> {
  const { queryQuantitySamples } = await import('@kingstinct/react-native-healthkit');
  const samples = await queryQuantitySamples(HRV_SDNN_IDENTIFIER, {
    limit: sampleLimit,
    ascending: false,
  });
  return toQuantitySamples(samples);
}

function toQuantitySamples(
  samples: readonly { quantity: number; startDate: string | Date }[],
): QuantitySample[] {
  return samples.map((sample) => ({
    date: new Date(sample.startDate).toISOString().slice(0, 10),
    value: sample.quantity,
  }));
}
