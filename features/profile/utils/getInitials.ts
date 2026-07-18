/** Derives a 1-2 letter avatar fallback from a display name, e.g. "Alex Rivera" -> "AR". */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
