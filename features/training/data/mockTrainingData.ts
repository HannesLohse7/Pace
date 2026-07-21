/**
 * Mock data for the Training week view, ported from the same `plan`
 * array on `design/Triathlon Coach App.dc.html`'s `Component` class that
 * `mockHomeData.ts` already draws its today/upcoming subsets from — same
 * week, same athlete, same workouts, so Training's week agrees with what
 * Home shows for "today" instead of inventing a conflicting plan.
 *
 * `totalHours`/`totalTss` are static, matching the source's own header
 * (a literal "8.3 HRS · 441 TSS" string, not a computed binding) — they
 * agree with summing `weekWorkouts`' individual `tss`/durations (verified
 * by hand: 38+30+85+28+0+150+110 = 441; 45+40+90+35+180+110 min = 8.3
 * hrs), so keep them in sync if a workout here ever changes.
 *
 * Two of the seven days deviate from the source's literal `done` values
 * (only mon/tue are `done:true` there) — Tuesday is shown `missed`
 * instead of `completed` so all three WorkoutStatus values actually
 * appear somewhere in this mock week; the source's binary flag can't
 * distinguish "missed" from "upcoming" at all.
 */
import type { RaceCountdown } from '@/features/home/types/home';

import type { PlannedWorkout, TrainingPhaseInfo } from '../types/training';

export const currentPhase: TrainingPhaseInfo = {
  name: 'Base',
  startDate: 'Jun 15',
  endDate: 'Jul 26',
};

export const raceCountdown: RaceCountdown = {
  raceName: 'Ironman Lake Placid',
  raceDate: 'Oct 6, 2026',
  daysToRace: 82,
  progressPct: 27,
  progressLabel: '27% through the 16-week build',
};

export const weekDateRangeLabel = 'JUL 13 – JUL 19';
export const totalHoursLabel = '8.3 HRS';
export const totalTssLabel = '441 TSS';

export const todayId = 'wed';

export const weekWorkouts: PlannedWorkout[] = [
  {
    id: 'mon',
    short: 'MON',
    dateNum: '13',
    discipline: 'swim',
    title: 'Endurance Aerobic Swim',
    duration: '45 min',
    intensity: 'Low',
    tss: 38,
    status: 'completed',
  },
  {
    id: 'tue',
    short: 'TUE',
    dateNum: '14',
    discipline: 'strength',
    title: 'Full-Body Strength',
    duration: '40 min',
    intensity: 'Moderate',
    tss: 30,
    status: 'missed',
  },
  {
    id: 'wed',
    short: 'WED',
    dateNum: '15',
    discipline: 'bike',
    title: 'Bike Threshold Session',
    duration: '90 min',
    intensity: 'High',
    tss: 85,
    status: 'upcoming',
  },
  {
    id: 'thu',
    short: 'THU',
    dateNum: '16',
    discipline: 'run',
    title: 'Easy Recovery Run',
    duration: '35 min',
    intensity: 'Low',
    tss: 28,
    status: 'upcoming',
  },
  {
    id: 'fri',
    short: 'FRI',
    dateNum: '17',
    discipline: 'rest',
    title: 'Rest Day',
    duration: '—',
    intensity: '—',
    tss: 0,
    status: 'upcoming',
  },
  {
    id: 'sat',
    short: 'SAT',
    dateNum: '18',
    discipline: 'bike',
    title: 'Long Endurance Ride',
    duration: '3 hr 00 min',
    intensity: 'Moderate',
    tss: 150,
    status: 'upcoming',
  },
  {
    id: 'sun',
    short: 'SUN',
    dateNum: '19',
    discipline: 'run',
    title: 'Long Run',
    duration: '1 hr 50 min',
    intensity: 'Moderate-High',
    tss: 110,
    status: 'upcoming',
  },
];
