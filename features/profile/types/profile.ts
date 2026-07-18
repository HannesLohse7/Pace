/** Lean type covering only what the Profile shell renders this checkpoint. */
export interface AthleteProfile {
  name: string;
  weeklyHours: number;
  disciplines: number;
  /** e.g. "March 2026" — no real account-creation timestamp exists yet. */
  joinDate: string;
  raceName: string;
  raceDate: string;
  daysToRace: number;
}
