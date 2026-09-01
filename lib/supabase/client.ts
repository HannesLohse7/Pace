import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';

/**
 * `EXPO_PUBLIC_*` vars are inlined into the JS bundle at build time (Expo's
 * convention for anything the client needs) — safe here because this is
 * the anon/publishable key, which is meant to be public: every table it can
 * touch is locked down by the RLS policies in the `core_schema` and
 * `waitlist_signups` migrations, not by keeping this key secret.
 *
 * Throwing on a missing value beats a silent `createClient('', '')` that
 * fails mysteriously on the first real request — see `.env.example` for
 * what a local `.env` needs.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in the values from the Supabase project settings.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage (not the default in-memory store) so a session survives
    // an app restart — without this every relaunch would sign the athlete
    // out.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no URL bar for Supabase to read a session out of;
    // email-confirmation / magic-link redirects are handled via deep
    // linking instead (not yet wired — see docs/ROADMAP.md).
    detectSessionInUrl: false,
  },
});
