/**
 * Mock data for the Training week view and workout-detail overlay,
 * ported from the same `plan` array on
 * `design/Triathlon Coach App.dc.html`'s `Component` class that
 * `mockHomeData.ts` already draws its today/upcoming subsets from — same
 * week, same athlete, same workouts, so Training's week agrees with what
 * Home shows for "today" instead of inventing a conflicting plan.
 *
 * `calories`/`description`/`equipment`/`warmup`/`mainset`/`cooldown`/
 * `hrZones`/`powerZones`/`paceTarget`/`cadenceTarget` are all ported
 * directly from that same source array's per-workout fields — real
 * values, not extrapolated (Checkpoint 2's workout-detail overlay uses
 * these as-is).
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
    calories: 320,
    description:
      'Steady aerobic swim focused on stroke efficiency and building base endurance ahead of race-specific work.',
    equipment: ['Pool', 'Pull Buoy', 'Paddles'],
    warmup: '400m easy freestyle + 4x50m drill (catch-up, fist swim)',
    mainset: '8 x 200m @ steady aerobic pace, 20s rest, holding consistent stroke count',
    cooldown: '200m easy choice, light stretching',
    paceTarget: '1:42 /100m',
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
    calories: 260,
    description:
      'Injury-prevention strength session targeting posterior chain, core stability and single-leg power.',
    equipment: ['Dumbbells', 'Resistance Band', 'Mat'],
    warmup: '5 min dynamic mobility — leg swings, hip openers, band pull-aparts',
    mainset:
      '3 rounds: 10 goblet squats, 8/side single-leg RDLs, 12 plank shoulder taps, 10 glute bridges',
    cooldown: '5 min stretching — hip flexors, hamstrings, shoulders',
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
    calories: 780,
    description:
      'Race-specific threshold intervals to build sustainable power at Ironman-pace effort. This is your key quality session this week.',
    equipment: ['Road Bike', 'Power Meter', 'Trainer'],
    warmup: '15 min easy spin, cadence 90+, 3x30s builds to Zone 3',
    mainset: '4 x 12 min @ Threshold (Zone 4, 260-275W), 5 min easy spin recovery between',
    cooldown: '10 min easy spin, cadence drills',
    hrZones: [
      { zone: 'Z2', name: 'Endurance', range: '139-151 bpm' },
      { zone: 'Z4', name: 'Threshold', range: '168-176 bpm' },
    ],
    powerZones: [
      { zone: 'Z2', name: 'Endurance', range: '180-210W' },
      { zone: 'Z4', name: 'Threshold', range: '260-275W' },
    ],
    cadenceTarget: '90-95 rpm',
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
    calories: 310,
    description:
      "Short, easy shakeout run to promote recovery and blood flow after yesterday's bike threshold session.",
    equipment: ['Running Shoes', 'GPS Watch'],
    warmup: '5 min walk/jog transition',
    mainset: '25 min continuous @ conversational pace, HR capped in Zone 2',
    cooldown: '5 min walk, light stretching',
    hrZones: [{ zone: 'Z1-Z2', name: 'Recovery', range: '125-145 bpm' }],
    paceTarget: '9:45-10:15 /mi',
    cadenceTarget: '168-172 spm',
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
    calories: 0,
    description:
      'Full rest day. Prioritize sleep, hydration and mobility work to arrive fresh for Saturday’s long ride.',
    equipment: [],
    warmup: '—',
    mainset: '—',
    cooldown: '—',
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
    calories: 2100,
    description:
      'Long aerobic ride simulating race-day fueling and pacing. Practice your Ironman nutrition strategy start to finish.',
    equipment: ['Road Bike', 'Power Meter', 'Nutrition Plan'],
    warmup: '15 min progressive spin into Zone 2',
    mainset: '2 hr 30 min steady @ Zone 2 (200-220W), fuel every 20 min',
    cooldown: '15 min easy spin',
    hrZones: [{ zone: 'Z2', name: 'Endurance', range: '139-151 bpm' }],
    powerZones: [{ zone: 'Z2', name: 'Endurance', range: '200-220W' }],
    cadenceTarget: '85-90 rpm',
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
    calories: 1450,
    description:
      'Longest run of the week — building durability for the marathon leg. Negative-split the back half.',
    equipment: ['Running Shoes', 'GPS Watch', 'Nutrition'],
    warmup: '10 min easy jog',
    mainset: '90 min steady Zone 2, final 20 min progressing to Zone 3',
    cooldown: '10 min walk, foam rolling',
    hrZones: [
      { zone: 'Z2', name: 'Endurance', range: '142-154 bpm' },
      { zone: 'Z3', name: 'Tempo', range: '155-165 bpm' },
    ],
    paceTarget: '8:50 /mi, 8:15/mi final 20',
    cadenceTarget: '172-176 spm',
  },
];
