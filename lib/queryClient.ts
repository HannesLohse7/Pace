import { QueryClient } from '@tanstack/react-query';

/**
 * Single app-wide TanStack Query client (docs/ARCHITECTURE.md: "TanStack
 * Query for server state"). A 60s `staleTime` is a deliberate default,
 * not an oversight — this app's server state (a training plan, a race)
 * changes on the order of "an athlete edited something" or "the
 * adaptation engine ran," not multiple times a minute, so refetching on
 * every screen focus would just be wasted network calls against
 * Supabase's free tier for no real freshness gain. Screens that need to
 * see a write they just made invalidate that query explicitly instead of
 * relying on a short staleTime.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});
