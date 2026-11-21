/** Range validation only: self-reported marks are not verified against a record. */
export function parseAcademicGrade(value: string): { value: number; maximum: number; percentage: boolean } | null {
  const match = /^(\d{1,7}(?:\.\d{1,2})?)\s*(%|\/\s*(\d{1,7}(?:\.\d{1,2})?))?$/.exec(value.trim());
  if (!match) return null;
  const score = Number(match[1]);
  const maximum = match[2] === '%' ? 100 : Number(match[3] ?? 10);
  if (maximum <= 0 || maximum > 1_000_000 || score > maximum) return null;
  return { value: score, maximum, percentage: match[2] === '%' };
}
