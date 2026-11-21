import { describe, expect, it } from 'vitest';
import { findUniversity, searchUniversities, universities, universityCountries } from './university-catalog.js';

describe('worldwide university catalog', () => {
  it('includes institutions across countries with stable unique identifiers', () => {
    expect(universityCountries.length).toBeGreaterThan(100);
    expect(universities.length).toBeGreaterThan(5000);
    expect(new Set(universities.map((item) => item.id)).size).toBe(universities.length);
  });
  it('restricts selection to catalog records', () => {
    expect(findUniversity(universities[0].id)).toEqual(universities[0]);
    expect(() => findUniversity('000000000000000000000000')).toThrowError(expect.objectContaining({ code: 'UNIVERSITY_NOT_LISTED' }));
  });
  it('filters by country and query and limits results', () => {
    expect(searchUniversities('India', '')).toEqual([]);
    const results = searchUniversities('India', 'university');
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(50);
    expect(results.every((item) => item.country === 'India' && item.name.toLowerCase().includes('university'))).toBe(true);
  });
});
