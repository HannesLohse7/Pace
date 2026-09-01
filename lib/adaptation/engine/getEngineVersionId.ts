import { supabase } from '@/lib/supabase/client';

const CURRENT_ENGINE_VERSION = 'v1';

/**
 * Memoized within this module (not persisted) — `engine_version` rows
 * are only ever added by a migration (write-only via migrations/service
 * role, see docs/DATABASE.md), never changed at runtime, so caching the
 * current version's id for the life of the app is safe and avoids a
 * repeat query on every adaptation.
 */
let cachedId: string | null | undefined;

/**
 * Looks up the real id of the `engine_version` row this app's current
 * rule set corresponds to, so engine-made `adaptation_event` rows can
 * set a real `engine_version_id` rather than a hardcoded one —
 * `apply_migration`'s own guidance is not to hardcode references to
 * generated ids in data migrations, and the same reasoning applies
 * here: the seed migration owns the real id, the app just asks for it
 * by the stable `version` string.
 *
 * Returns `null` (never throws) when the row isn't found — an
 * unmigrated environment, or a version string that's since been
 * renamed. `lib/adaptation/engine/adaptAfterMissedWorkout.ts` treats a
 * `null` result as "can't honestly attribute this to the engine," and
 * skips adapting anything rather than writing a decision with no real
 * `engine_version_id` behind it.
 */
export async function getEngineVersionId(): Promise<string | null> {
  if (cachedId !== undefined) return cachedId;

  const { data, error } = await supabase
    .from('engine_version')
    .select('id')
    .eq('version', CURRENT_ENGINE_VERSION)
    .maybeSingle();

  cachedId = error || !data ? null : data.id;
  return cachedId;
}
