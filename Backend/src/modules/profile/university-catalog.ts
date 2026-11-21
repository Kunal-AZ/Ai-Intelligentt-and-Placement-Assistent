import { createHash } from 'node:crypto';
import data from '../../data/universities/world.json' with { type: 'json' };
import { AppError } from '../../utils/app-error.js';

export const universities = data.map((item) => ({
  id: createHash('sha256').update(JSON.stringify([item.alpha_two_code, item.name, item.domains])).digest('hex').slice(0, 24),
  name: item.name,
  country: item.country,
  countryCode: item.alpha_two_code,
  region: item['state-province'],
}));
const byId = new Map(universities.map((item) => [item.id, item]));
export const universityCountries = [...new Set(universities.map((item) => item.country))].sort();

export function findUniversity(id: string) {
  const university = byId.get(id);
  if (!university) throw new AppError(400, 'UNIVERSITY_NOT_LISTED', 'Select a university from the catalog. Contact support if yours is missing.');
  return university;
}

export function searchUniversities(country: string, query: string) {
  if (query.trim().length < 2) return [];
  const needle = query.trim().toLocaleLowerCase();
  return universities.filter((item) => item.country === country && item.name.toLocaleLowerCase().includes(needle)).slice(0, 50);
}
