export function flattenFieldErrors(
  errors: Record<string, string[]>
): string[] {
  return Object.values(errors).flat();
}
