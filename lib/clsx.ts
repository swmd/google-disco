/** Minimal classNames joiner (no dependency needed for this scope). */
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
