import { AppText } from './AppText';
import { Screen } from './Screen';

export interface ComingSoonPlaceholderProps {
  label: string;
}

/**
 * Temporary placeholder for tab routes that don't have a real screen yet
 * (Training/Coach/Progress/Profile). Delete each usage as its real screen
 * is built — this isn't meant to be a lasting design-system primitive.
 */
export function ComingSoonPlaceholder({ label }: ComingSoonPlaceholderProps) {
  return (
    <Screen className="items-center justify-center">
      <AppText className="text-body text-color-tertiary">
        {label} — coming in a later milestone
      </AppText>
    </Screen>
  );
}
