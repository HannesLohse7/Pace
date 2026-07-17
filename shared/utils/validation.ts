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
