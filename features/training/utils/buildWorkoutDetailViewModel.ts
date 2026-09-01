import { toIsoDate } from '@/shared/utils/date';

import type { WorkoutDetailData } from '../services/fetchWorkoutDetail';
import type { PlannedWorkout, WorkoutZone } from '../types/training';
import { mapWorkoutRowToPlanned } from './workoutMapping';

type StepPhase = 'warmup' | 'mainset' | 'cooldown';

/** Joins every `workout_step` row for one phase into that phase's timeline text. Almost always exactly one row per phase, but doesn't assume it. */
function stepText(steps: WorkoutDetailData['steps'], phase: StepPhase): string | undefined {
  const text = steps
    .filter((step) => step.phase === phase)
    .map((step) => step.description)
    .join(' ');
  return text.length > 0 ? text : undefined;
}

function zonesFor(
  targetZones: WorkoutDetailData['targetZones'],
  targetType: 'hr' | 'power',
): WorkoutZone[] | undefined {
  const zones = targetZones
    .filter((zone) => zone.target_type === targetType)
    .map((zone) => ({ zone: zone.zone, name: zone.zone_name, range: zone.range }));
  return zones.length > 0 ? zones : undefined;
}

/**
 * `WorkoutDetailData` -> the same `PlannedWorkout` shape Training's week
 * list uses, enriched with the `workout_step`/`workout_target_zone` data
 * only the detail screen needs. Built on `mapWorkoutRowToPlanned` rather
 * than duplicating its discipline/status/date mapping.
 */
export function buildWorkoutDetailViewModel(data: WorkoutDetailData): PlannedWorkout {
  const base = mapWorkoutRowToPlanned(data.workout, toIsoDate(new Date()));
  return {
    ...base,
    warmup: stepText(data.steps, 'warmup'),
    mainset: stepText(data.steps, 'mainset'),
    cooldown: stepText(data.steps, 'cooldown'),
    hrZones: zonesFor(data.targetZones, 'hr'),
    powerZones: zonesFor(data.targetZones, 'power'),
  };
}
