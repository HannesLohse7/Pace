-- One completion per workout.
alter table workout_completion
  add constraint workout_completion_workout_id_key unique (workout_id);
