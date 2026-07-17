/**
 * Mock data for the Home Dashboard, ported verbatim from
 * `design/Triathlon Coach App.dc.html` (the `plan`/`athlete`/`recovery`
 * fields on its `Component` class, and the Home tab's literal copy).
 */
import { colors } from '@/shared/theme/colors';

import type {
  RaceCountdown,
  TodayWorkout,
  UpcomingWorkoutItem,
  WeekDayStatus,
} from '../types/home';

export const dateLabel = 'TUESDAY, JUL 15';
export const athleteFirstName = 'Alex';

export const recoveryScore = 72;

export const coachMessage =
  'Recovery is at 72 today — I’m keeping your bike threshold session as planned. Tomorrow’s run has been lightened slightly after a dip in overnight HRV.';

export const todayWorkout: TodayWorkout = {
  type: 'Bike',
  color: colors.sport.bike,
  title: 'Bike Threshold Session',
  duration: '90 min',
  tss: 85,
  description:
    'Race-specific threshold intervals to build sustainable power at Ironman-pace effort. This is your key quality session this week.',
};

export const weekStrip: WeekDayStatus[] = [
  { id: 'mon', letter: 'M', state: 'done' },
  { id: 'tue', letter: 'T', state: 'done' },
  { id: 'wed', letter: 'W', state: 'today' },
  { id: 'thu', letter: 'T', state: 'upcoming' },
  { id: 'fri', letter: 'F', state: 'upcoming' },
  { id: 'sat', letter: 'S', state: 'upcoming' },
  { id: 'sun', letter: 'S', state: 'upcoming' },
];

export const weekSummary = '6 sessions · 8.3 hrs planned this week';

export const upcomingWorkouts: UpcomingWorkoutItem[] = [
  {
    id: 'thu',
    short: 'THU',
    color: colors.sport.run,
    title: 'Easy Recovery Run',
    zoneLabel: 'Z1',
    purpose: 'Active recovery + blood flow',
    duration: '35 min',
  },
  {
    id: 'sat',
    short: 'SAT',
    color: colors.sport.bike,
    title: 'Long Endurance Ride',
    zoneLabel: 'Z2',
    purpose: 'Race-day fueling + pacing practice',
    duration: '3 hr 00 min',
  },
  {
    id: 'sun',
    short: 'SUN',
    color: colors.sport.run,
    title: 'Long Run',
    zoneLabel: 'Z2-Z3',
    purpose: 'Durability for the marathon leg',
    duration: '1 hr 50 min',
  },
];

export const raceCountdown: RaceCountdown = {
  raceName: 'Ironman Lake Placid',
  raceDate: 'Oct 6, 2026',
  daysToRace: 82,
  progressPct: 27,
  progressLabel: '27% through the 16-week build',
};

export const personalRecordLine = 'New 5K PR · 19:42, last Tuesday';
