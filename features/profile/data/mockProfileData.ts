/**
 * Mock data for the Profile shell, matching `athlete.*` on the
 * `design/Triathlon Coach App.dc.html` export's `Component` class — same
 * mock athlete as Home's `mockHomeData.ts` (Alex Rivera, Ironman Lake
 * Placid), since it's the same persona.
 *
 * `joinDate` has no source equivalent — there's no real account-creation
 * timestamp yet (no auth/persistence), so this is a placeholder value,
 * not derived from anything real.
 */
import type { AthleteProfile } from '../types/profile';

export const athleteProfile: AthleteProfile = {
  name: 'Alex Rivera',
  weeklyHours: 9,
  disciplines: 3,
  joinDate: 'March 2026',
  raceName: 'Ironman Lake Placid',
  raceDate: 'Oct 6, 2026',
  daysToRace: 82,
};
