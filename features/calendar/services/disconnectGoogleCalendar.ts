import { supabase } from '@/lib/supabase/client';

/**
 * Calls the `google-calendar-disconnect` Edge Function, which revokes
 * the stored token with Google for real (not just a local status flip)
 * — see that function's own doc comment. `functions.invoke` forwards the
 * signed-in athlete's session JWT as the Authorization header
 * automatically, which is how the function knows whose connection to
 * disconnect — no athlete id passed here.
 */
export async function disconnectGoogleCalendar(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'google-calendar-disconnect',
    { method: 'POST' },
  );

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? 'Could not disconnect Google Calendar.');
}
