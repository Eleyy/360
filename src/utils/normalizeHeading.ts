export function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
