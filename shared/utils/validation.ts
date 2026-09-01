/**
 * Pragmatic email check — not a perfect RFC 5322 validator (that's
 * famously impossible to get fully right client-side), just enough to
 * catch obviously-malformed input before it reaches a real server-side
 * check. Reusable wherever an email field needs validating (onboarding's
 * account step today; any future login/signup flow).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Matches Supabase Auth's own minimum — an 8-character floor, not a full strength check. */
const MIN_PASSWORD_LENGTH = 8;

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH;
}
