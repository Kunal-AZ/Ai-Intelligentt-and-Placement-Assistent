import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { academicDegrees, academicMajors, parseAcademicGrade, studentRoles, updateProfileSchema } from '@placement-assistant/validation';
import { api } from '../lib/api';

type Student = { firstName: string; lastName: string; email: string; college: string; universityId: string; degree: string; major: string; cgpa: string; graduationYear: string; githubUrl: string; linkedinUrl: string; portfolioUrl: string; targetRole: string; secondaryRole: string; expectedLpa: string };
type Profile = Partial<Omit<Student, 'graduationYear' | 'targetRole'>> & { graduationYear?: number; targetRoles?: string[]; universityCountry?: string };
type University = { id: string; name: string; country: string; region?: string | null };
const initial: Student = { firstName: '', lastName: '', email: '', college: '', universityId: '', degree: '', major: '', cgpa: '', graduationYear: '', githubUrl: '', linkedinUrl: '', portfolioUrl: '', targetRole: '', secondaryRole: '', expectedLpa: '' };

export function ProfilePage() {
  const [student, setStudent] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [score, setScore] = useState('');
  const [gradingScale, setGradingScale] = useState('10');
  const [maximumMarks, setMaximumMarks] = useState('100');

  useEffect(() => {
    const controller = new AbortController();
    api<{ profile: Profile }>('/profile', { signal: controller.signal }).then(({ profile: value }) => {
      setStudent({ ...initial, ...value, graduationYear: value.graduationYear?.toString() ?? '', targetRole: value.targetRoles?.[0] ?? '' });
      setCountry(value.universityCountry ?? ''); setQuery(value.college ?? '');
      const grade = parseAcademicGrade(value.cgpa ?? '');
      if (grade) {
        setScore(String(grade.value)); setMaximumMarks(String(grade.maximum));
        setGradingScale(grade.percentage ? '100' : ['4', '5', '7', '10'].includes(String(grade.maximum)) ? String(grade.maximum) : 'marks');
      }
    }).catch((error: unknown) => { if (!controller.signal.aborted) { setMessage(error instanceof Error ? error.message : 'Profile could not be loaded.'); setFailed(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    api<{ countries: string[] }>('/profile/universities', { signal: controller.signal }).then(({ countries }) => setCountries(countries)).catch(() => { if (!controller.signal.aborted) setSearchMessage('University catalog could not be loaded. Refresh to retry.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!country || query.trim().length < 2 || student.universityId) { setUniversities([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchMessage('Searching…'); setUniversities([]);
      api<{ universities: University[] }>(`/profile/universities?country=${encodeURIComponent(country)}&q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(({ universities }) => { setUniversities(universities); setSearchMessage(universities.length ? 'Select a result below. Refine your search if needed.' : 'No match. Try another spelling or contact support to request a missing institution.'); })
        .catch(() => { if (!controller.signal.aborted) setSearchMessage('University search failed. Change your search to retry.'); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [country, query, student.universityId]);

  function update(key: keyof Student, value: string) { setStudent((current) => ({ ...current, [key]: value })); }
  function updateGrade(value: string, scale: string, maximum: string) {
    setScore(value); setGradingScale(scale); setMaximumMarks(maximum);
    update('cgpa', value === '' ? '' : scale === '100' ? `${value}%` : `${value}/${scale === 'marks' ? maximum : scale}`);
  }
  function reportError(error: unknown) { setFailed(true); setMessage(error instanceof Error ? error.message : 'The request failed.'); }
  async function saveProfile() {
    const parsed = updateProfileSchema.safeParse({ firstName: student.firstName, lastName: student.lastName, college: student.college, universityId: student.universityId || undefined, degree: student.degree, major: student.major, cgpa: student.cgpa, graduationYear: student.graduationYear ? Number(student.graduationYear) : undefined, githubUrl: student.githubUrl, linkedinUrl: student.linkedinUrl, portfolioUrl: student.portfolioUrl, targetRoles: student.targetRole ? [student.targetRole] : [], secondaryRole: student.secondaryRole, expectedLpa: student.expectedLpa });
    const fields: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    if (!student.universityId) fields.college = 'Choose a university from the search results.';
    setErrors(fields);
    if (!parsed.success || Object.keys(fields).length) throw new Error('Please correct the highlighted fields.');
    const { profile: saved } = await api<{ profile: Profile }>('/profile', { method: 'PUT', body: JSON.stringify(parsed.data) });
    return saved;
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(''); setFailed(false);
    try { await saveProfile(); setMessage('Student profile saved. Marks are saved as self-reported.'); } catch (error) { reportError(error); } finally { setSaving(false); }
  }
  return <div className="max-w-4xl mx-auto flex flex-col gap-6">
    <header className="pb-5 border-b border-[var(--border-subtle)]"><span className="badge badge-success">Student dossier</span><h1 className="text-2xl font-black mt-2">Student Profile</h1><p className="text-sm text-[var(--text-muted)] mt-1">Your academic identity, career goal, and technical links.</p></header>
    <form onSubmit={save} className="flex flex-col gap-5"><fieldset disabled={loading || saving} className="flex flex-col gap-5">
      <section className="card p-5"><h2 className="font-bold">Personal details</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Field label="First name" error={errors.firstName}><input className="form-input" required maxLength={80} value={student.firstName} onChange={(e) => update('firstName', e.target.value)} /></Field>
        <Field label="Last name" error={errors.lastName}><input className="form-input" maxLength={80} value={student.lastName} onChange={(e) => update('lastName', e.target.value)} /></Field>
        <Field label="Email"><input className="form-input opacity-70" value={student.email} readOnly /></Field>
      </div></section>
      <section className="card p-5"><h2 className="font-bold">Career targeting</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Choice label="Primary target role" value={student.targetRole} options={studentRoles} error={errors.targetRoles} onChange={(value) => update('targetRole', value)} />
        <Choice label="Backup role" optional value={student.secondaryRole} options={studentRoles} error={errors.secondaryRole} onChange={(value) => update('secondaryRole', value)} />
        <Field label="Target compensation" error={errors.expectedLpa}><input className="form-input" maxLength={40} value={student.expectedLpa} onChange={(e) => update('expectedLpa', e.target.value)} placeholder="e.g. ₹8–12 LPA" /></Field>
      </div></section>
      <section className="card p-5"><h2 className="font-bold">Education</h2><p className="text-xs text-[var(--text-muted)] mt-2">Select your degree-awarding university. Catalog inclusion does not verify accreditation or your attendance. Missing institutions or programs can be requested through support.</p>
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Choice label="University country" value={country} options={countries} onChange={(value) => { setCountry(value); setQuery(''); setUniversities([]); setSearchMessage(''); setStudent((s) => ({ ...s, college: '', universityId: '' })); }} />
          <div className="form-group"><label className="form-label" htmlFor="university-search">University</label><input id="university-search" className="form-input" required aria-invalid={!!(errors.college || errors.universityId)} disabled={!country} value={query} onChange={(e) => { setQuery(e.target.value); setSearchMessage(''); setUniversities([]); setStudent((s) => ({ ...s, college: '', universityId: '' })); }} placeholder="Type at least two letters" />
            {student.universityId ? <span className="text-xs">Selected: {student.college}</span> : <><span role="status" className="text-xs">{searchMessage}</span><ul className="max-h-56 overflow-auto">{universities.map((item) => <li key={item.id}><button type="button" className="btn-secondary w-full text-left mb-1" onClick={() => { setStudent((s) => ({ ...s, college: item.name, universityId: item.id })); setQuery(item.name); setUniversities([]); }}>{item.name}{item.region ? ` (${item.region})` : ''}</button></li>)}</ul></>}
            {(errors.college || errors.universityId) && <span role="alert" className="text-xs text-[var(--status-danger)]">{errors.college || errors.universityId}</span>}
          </div>
          <Choice label="Degree" value={student.degree} options={academicDegrees} error={errors.degree} onChange={(value) => update('degree', value)} />
          <Choice label="Subject / major" value={student.major} options={academicMajors} error={errors.major} onChange={(value) => update('major', value)} />
          <Field label="Graduation year" error={errors.graduationYear}><input className="form-input" type="number" min={2000} max={2100} step={1} value={student.graduationYear} onChange={(e) => update('graduationYear', e.target.value)} /></Field>
          <Field label="Grading system"><select className="form-select" value={gradingScale} onChange={(e) => updateGrade(score, e.target.value, maximumMarks)}>{['4', '5', '7', '10'].map((scale) => <option key={scale} value={scale}>CGPA out of {scale}</option>)}<option value="100">Percentage (0–100)</option><option value="marks">Marks obtained / maximum marks</option></select></Field>
          {gradingScale === 'marks' && <Field label="Maximum marks"><input className="form-input" type="number" required min={0.01} max={1000000} step="0.01" value={maximumMarks} onChange={(e) => updateGrade(score, gradingScale, e.target.value)} /></Field>}
          <Field label={gradingScale === '100' ? 'Percentage (self-reported)' : gradingScale === 'marks' ? 'Marks obtained (self-reported)' : 'CGPA (self-reported)'} error={errors.cgpa}><input className="form-input" type="number" min={0} max={gradingScale === 'marks' ? Number(maximumMarks) || undefined : Number(gradingScale)} step="0.01" aria-invalid={!!errors.cgpa} value={score} onChange={(e) => updateGrade(e.target.value, gradingScale, maximumMarks)} /><span className="text-xs text-[var(--text-muted)]">Enter the value shown on your result card. The score must be between 0 and the selected maximum, with up to two decimal places. Marks are self-reported.</span></Field>
        </fieldset>
      </section>
      <section className="card p-5"><h2 className="font-bold">Technical links</h2><div className="grid gap-4 mt-4">{(['githubUrl', 'linkedinUrl', 'portfolioUrl'] as const).map((key, i) => <Field key={key} label={['GitHub', 'LinkedIn', 'Portfolio'][i]} error={errors[key]}><input className="form-input" type="url" maxLength={500} value={student[key]} onChange={(e) => update(key, e.target.value)} /></Field>)}</div></section>
      <button className="btn-primary self-end" disabled={saving || loading}>{saving ? 'Saving…' : 'Save student profile'}</button>
    </fieldset></form>
    {message && <p role={failed ? 'alert' : 'status'} className={failed ? 'text-sm text-[var(--status-danger)]' : 'text-sm text-[var(--status-success)]'}>{message}</p>}
  </div>;
}
function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) { return <label className="form-group"><span className="form-label">{label}</span>{children}{error && <span role="alert" className="text-xs text-[var(--status-danger)]">{error}</span>}</label>; }
function Choice({ label, value, options, onChange, error, optional = false }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; error?: string; optional?: boolean }) { return <Field label={label} error={error}><select className="form-select" required={!optional} aria-invalid={!!error} value={value} onChange={(e) => onChange(e.target.value)}><option value="">{optional ? 'None' : 'Select an option'}</option>{value && !options.includes(value) && <option value={value} disabled>{value} (select a listed option)</option>}{options.map((item) => <option key={item}>{item}</option>)}</select></Field>; }
