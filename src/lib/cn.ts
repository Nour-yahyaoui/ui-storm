export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

/**
 * Joins class names, dropping falsy values.
 *
 * Intentionally dependency-free and *not* a Tailwind conflict resolver: component
 * APIs expose explicit variants instead of relying on class overrides, which is
 * what keeps them predictable for consumers.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
      continue;
    }

    for (const [key, enabled] of Object.entries(input)) {
      if (enabled) classes.push(key);
    }
  }

  return classes.join(' ');
}
