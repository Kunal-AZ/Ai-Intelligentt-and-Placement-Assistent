import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { api } from '../lib/api';
import { GeminiLiveInterview, type LiveInterviewCallbacks } from '../lib/gemini-live';

type Question = { question: string; rubric: string[]; focusSkills: string[] };
type Response = { _id: string; question: Question };
type Session = { _id: string; type: string; role?: string; difficulty: string };
type Evaluation = { technicalAccuracy: string; communication: string; structure: string; reasoning: string; strengths: string[]; improvements: string[]; followUpFocus: string[] };
type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: (event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void; onend: () => void; onerror: () => void };
type RecognitionConstructor = new () => Recognition;
type DialogueTurn = { id: string; speaker: 'INTERVIEWER' | 'CANDIDATE'; text: string };

const technicalRoles = ['Software Engineer', 'Full-Stack Developer', 'Backend Developer', 'Frontend Developer', 'Mobile Developer', 'DevOps Engineer', 'Cloud Engineer', 'Cybersecurity Analyst', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'AI Engineer', 'QA / Test Engineer', 'Site Reliability Engineer', 'UI/UX Designer', 'Product Manager', 'Business Analyst'];

export function MockInterviewsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState<Response | null>(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [type, setType] = useState('ROLE_SPECIFIC');
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'TEXT' | 'VOICE'>('VOICE');
  const [listening, setListening] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const pendingSpeechRef = useRef<string | null>(null);
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const liveClientRef = useRef<GeminiLiveInterview | null>(null);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'live' | 'interrupted' | 'closed' | 'error'>('idle');
  const [voiceActivity, setVoiceActivity] = useState<'INTERVIEWER' | 'CANDIDATE' | 'IDLE'>('IDLE');
  const [muted, setMuted] = useState(false);

  function speak(text: string) {
    if (!('speechSynthesis' in window)) { setMediaError('Voice playback is not available in this browser. You can still use the transcript.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN'; utterance.rate = 0.95;
    utterance.onstart = () => setAgentSpeaking(true);
    utterance.onend = () => setAgentSpeaking(false);
    utterance.onerror = () => setAgentSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!current?.question.question) return;
    const prompt = pendingSpeechRef.current ?? `Hello, I’ll be your interviewer for this ${session?.role ?? 'technical'} interview. ${current.question.question}`;
    pendingSpeechRef.current = null;
    setDialogue((turns) => [...turns, { id: current._id, speaker: 'INTERVIEWER', text: prompt }]);
    if (mode === 'VOICE') speak(prompt);
  }, [current?._id, mode]);

  useEffect(() => () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); }, []);
  useEffect(() => () => liveClientRef.current?.close(), []);

  function dictate() {
    const SpeechRecognition = (window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setMediaError('Speech-to-text is not available in this browser. You can still type your answer.'); return; }
    setMediaError(''); window.speechSynthesis?.cancel();
    const recognition = new SpeechRecognition(); recognitionRef.current = recognition; recognition.continuous = true; recognition.interimResults = false; recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex).filter((result) => result.isFinal !== false).map((result) => result[0].transcript).join(' ').trim();
      if (transcript) setAnswer((currentAnswer) => `${currentAnswer}${currentAnswer ? ' ' : ''}${transcript}`);
    };
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognition.onerror = () => { setListening(false); recognitionRef.current = null; setMediaError('We could not transcribe that audio. Check microphone permission and try again.'); }; setListening(true); recognition.start();
  }
  function stopDictation() { recognitionRef.current?.stop(); }

  async function start() {
    setMode('TEXT'); setBusy(true); setEvaluation(null); setMessage('Preparing your interview…');
    try {
      const { session: created, question } = await api<{ session: Session; question: Response }>('/interviews', { method: 'POST', body: JSON.stringify({ type, difficulty, role }) });
      setDialogue([]); setSession(created); setCurrent(question); setAnswer(''); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not start the interview.'); } finally { setBusy(false); }
  }
  async function startLiveInterview() {
    setMode('VOICE'); setBusy(true); setMessage('Connecting you to the AI interviewer…'); setDialogue([]); setLiveStatus('connecting'); setMuted(false);
    try {
      const callbacks: LiveInterviewCallbacks = {
        onStatus: (status) => setLiveStatus(status),
        onTranscript: (speaker, text) => setDialogue((turns) => {
          const last = turns.at(-1);
          return last?.speaker === speaker ? [...turns.slice(0, -1), { ...last, text: `${last.text} ${text}`.trim() }] : [...turns, { id: crypto.randomUUID(), speaker, text }];
        }),
        onError: (error) => { setLiveStatus('error'); setMessage(error); },
        onActivity: setVoiceActivity,
      };
      const client = new GeminiLiveInterview(callbacks); liveClientRef.current = client;
      // Unlock output while this click still has browser user activation.
      await client.unlockAudio();
      const credentials = await api<{ token: string; model: string }>('/interviews/live-token', { method: 'POST' });
      await client.connect({ token: credentials.token, model: credentials.model, role, focus: type.replaceAll('_', ' '), difficulty });
      setMessage('Live interview started. Speak naturally—your interviewer can hear and respond in real time.');
    } catch (error) { setLiveStatus('error'); setMessage(error instanceof Error ? error.message : 'Could not start the live interview.'); }
    finally { setBusy(false); }
  }
  async function enableSpeakerAudio() {
    try { await liveClientRef.current?.unlockAudio(); setMessage('Speaker audio enabled.'); }
    catch { setMessage('We could not enable speaker audio. Check your browser and system volume.'); }
  }
  function endLiveInterview() {
    liveClientRef.current?.close();
    liveClientRef.current = null;
    setVoiceActivity('IDLE');
    setMuted(false);
    setLiveStatus('idle');
    setMessage('Live interview ended. Choose your settings to begin another session.');
  }
  function toggleLiveMute() {
    const nextMuted = !muted;
    liveClientRef.current?.setMuted(nextMuted);
    setMuted(nextMuted);
    setMessage(nextMuted ? 'Your microphone is muted.' : 'Your microphone is live.');
  }
  async function submit() {
    if (!session || !answer.trim()) return;
    setBusy(true); setMessage('Evaluating your answer…');
    try {
      const result = await api<{ evaluation: Evaluation; nextQuestion: Response }>(`/interviews/${session._id}/respond`, { method: 'POST', body: JSON.stringify({ answer }) });
      const feedback = result.evaluation.improvements[0] ? `Thanks. One point to improve: ${result.evaluation.improvements[0]}.` : 'Thanks. That was a useful answer.';
      setDialogue((turns) => [...turns, { id: crypto.randomUUID(), speaker: 'CANDIDATE', text: answer }]);
      pendingSpeechRef.current = `${feedback} Follow-up question: ${result.nextQuestion.question}`;
      setEvaluation(result.evaluation); setCurrent(result.nextQuestion); setAnswer(''); setMessage('The interviewer has prepared a follow-up question based on your answer.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not evaluate this answer.'); } finally { setBusy(false); }
  }
  async function finish() {
    if (!session) return;
    try { await api(`/interviews/${session._id}/complete`, { method: 'POST' }); setMessage('Interview completed. Your dashboard has been updated.'); setSession(null); setCurrent(null); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not complete the interview.'); }
  }

  return <div className="mock-interviews-layout flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]"><div><span className="badge badge-success">Saved practice session</span><h1 className="text-2xl font-black tracking-tight mt-2">Technical Mock Interviews</h1><p className="text-sm text-[var(--text-muted)]">Each response is evaluated, saved, and used to improve your next question.</p></div>{session && <button className="btn-secondary text-xs" onClick={finish}>Finish interview</button>}</div>
    {!session && liveStatus === 'idle' && <section className="card p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"><div className="form-group"><label className="form-label">Technical role</label><select className="form-select" value={role} onChange={(event) => setRole(event.target.value)}>{technicalRoles.map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-group"><label className="form-label">Interview focus</label><select className="form-select" value={type} onChange={(event) => setType(event.target.value)}><option value="ROLE_SPECIFIC">Role-specific</option><option value="TECHNICAL">Technical foundations</option><option value="DSA">DSA</option><option value="SYSTEM_DESIGN">System design</option><option value="HR">HR</option><option value="BEHAVIORAL">Behavioral</option></select></div><div className="form-group"><label className="form-label">Difficulty</label><select className="form-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></div><div className="flex flex-col gap-2"><button className="btn-primary" disabled={busy} onClick={startLiveInterview}>{busy ? 'Connecting…' : 'Start live voice interview'}</button><button className="btn-secondary text-xs" disabled={busy} onClick={start}>Start text interview</button></div></section>}
    {message && <p className="text-sm text-[var(--text-secondary)]" role="status">{message}</p>}
    {mediaError && <p className="text-xs text-[var(--status-warning)]" role="status">{mediaError}</p>}
    {liveStatus !== 'idle' && !session && <VoiceInterviewExperience role={role} status={liveStatus} activity={voiceActivity} muted={muted} transcript={dialogue} onToggleMute={toggleLiveMute} onEnd={endLiveInterview} onEnableSpeaker={() => void enableSpeakerAudio()} />}
    {current && <section className="card-elevated p-6 flex flex-col gap-5"><div className="flex items-center justify-between gap-3"><div><span className="badge badge-mono">{session?.role} · {session?.type.replace('_', ' ')}</span><h2 className="text-lg font-bold mt-3">Live mock interview</h2></div><span className="badge badge-success">{agentSpeaking ? 'Interviewer speaking' : listening ? 'Interviewer listening' : 'Your turn'}</span></div><div className="rounded-lg bg-[var(--bg-subtle)] p-4 max-h-72 overflow-y-auto space-y-3">{dialogue.map((turn) => <div key={turn.id} className={turn.speaker === 'INTERVIEWER' ? 'text-left' : 'text-right'}><p className="text-[10px] font-bold text-[var(--text-muted)]">{turn.speaker === 'INTERVIEWER' ? 'AI INTERVIEWER' : 'YOU'}</p><p className={`inline-block mt-1 rounded-lg p-3 text-sm ${turn.speaker === 'INTERVIEWER' ? 'bg-[var(--bg-surface)] border border-[var(--border-default)]' : 'bg-[var(--text-primary)] text-[var(--text-inverse)]'}`}>{turn.text}</p></div>)}</div><p className="text-xs text-[var(--text-muted)]">Current focus: {current.question.focusSkills.join(', ') || 'Role reasoning'}</p><textarea className="form-textarea min-h-32" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Speak naturally. Your answer will appear here as a transcript." disabled={busy}/><div className="flex gap-2 self-start"><button className="btn-secondary text-xs" type="button" onClick={listening ? stopDictation : dictate} disabled={busy}>{listening ? 'Finish answer' : 'Start speaking'}</button><button className="btn-ghost text-xs" type="button" onClick={() => speak(current.question.question)} disabled={busy}>Repeat question</button></div><p className="text-[10px] text-[var(--text-muted)]">After you finish, the interviewer evaluates your response and asks a role-specific follow-up.</p><button className="btn-primary self-end" disabled={!answer.trim() || busy} onClick={submit}>{busy ? 'Interviewer is thinking…' : 'Send answer'}</button></section>}
    {evaluation && <section className="card p-6 flex flex-col gap-4"><div><span className="badge badge-success">Feedback saved</span><h2 className="text-lg font-bold mt-2">Your last answer</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"><Score label="Technical" value={evaluation.technicalAccuracy}/><Score label="Communication" value={evaluation.communication}/><Score label="Structure" value={evaluation.structure}/><Score label="Reasoning" value={evaluation.reasoning}/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><List title="Strengths" values={evaluation.strengths}/><List title="Improve next" values={evaluation.improvements}/></div></section>}
  </div>;
}
const waveform = [30, 48, 76, 44, 98, 132, 78, 110, 60, 102, 74, 38, 64, 30, 54, 82, 112, 70, 126, 98, 64, 110, 76, 118, 56, 84, 44];

function VoiceInterviewExperience({ role, status, activity, muted, transcript, onToggleMute, onEnd, onEnableSpeaker }: { role: string; status: 'connecting' | 'live' | 'interrupted' | 'closed' | 'error'; activity: 'INTERVIEWER' | 'CANDIDATE' | 'IDLE'; muted: boolean; transcript: DialogueTurn[]; onToggleMute: () => void; onEnd: () => void; onEnableSpeaker: () => void }) {
  const active = status === 'live';
  const title = activity === 'INTERVIEWER' ? 'HiPlacement interviewer is speaking' : muted ? 'Your microphone is muted' : activity === 'CANDIDATE' ? 'Listening to your answer' : active ? 'Your interviewer is ready' : status === 'error' ? 'Voice connection needs attention' : 'Connecting your interview';
  const subtitle = activity === 'INTERVIEWER' ? 'Listen, then answer naturally when the interviewer finishes.' : muted ? 'Unmute when you are ready to answer.' : active ? `Speak naturally about your ${role} experience.` : 'Establishing your secure live voice session…';

  return <section className={`voice-interview-stage voice-stage-${status.toLowerCase()} ${muted ? 'voice-stage-muted' : ''}`} aria-label="Live voice interview">
    <header className="voice-stage-header">
      <div className="voice-stage-brand"><span className="voice-stage-mark" aria-hidden="true">⌁</span><div><strong>HiPlacement Interviewer</strong><span>{role} · live voice practice</span></div></div>
      <span className={`voice-stage-status ${active ? 'is-live' : ''}`}>{active ? 'Live interview' : status}</span>
    </header>
    <div className="voice-stage-visual" aria-label={title}>
      <div className="voice-wave voice-wave-left" aria-hidden="true">{waveform.slice(0, 13).map((height, index) => <i key={index} style={{ '--bar-height': `${height}px`, '--bar-delay': `${index * 0.07}s` } as CSSProperties} />)}</div>
      <div className={`voice-orb voice-orb-hero ${active ? 'voice-orb-active' : ''} ${activity === 'INTERVIEWER' ? 'voice-orb-interviewer' : activity === 'CANDIDATE' && !muted ? 'voice-orb-candidate' : ''}`}><span className="voice-orb-core"><span className="voice-orb-glyph">⌁</span></span><span className="voice-orb-ring voice-orb-ring-one" /><span className="voice-orb-ring voice-orb-ring-two" /><span className="voice-orb-ring voice-orb-ring-three" /></div>
      <div className="voice-wave voice-wave-right" aria-hidden="true">{waveform.slice(14).map((height, index) => <i key={index} style={{ '--bar-height': `${height}px`, '--bar-delay': `${(index + 13) * 0.07}s` } as CSSProperties} />)}</div>
    </div>
    <div className="voice-stage-copy"><h2>{title}</h2><p>{subtitle}</p></div>
    <div className="voice-stage-controls">
      <button type="button" className={`voice-control ${muted ? 'is-muted' : ''}`} onClick={onToggleMute} disabled={!active} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}>{muted ? '◉' : '●'}<span>{muted ? 'Unmute' : 'Mute'}</span></button>
      <button type="button" className="voice-control" onClick={onEnableSpeaker} disabled={!active} aria-label="Enable speaker audio">◖<span>Speaker</span></button>
      <button type="button" className="voice-control voice-control-end" onClick={onEnd} aria-label="End live interview">×<span>End</span></button>
    </div>
    <p className="voice-stage-hint">{active ? 'Your voice is streamed only for this live interview session.' : 'Voice session preview — wait until the connection is live.'}</p>
    <div className="voice-stage-transcript" aria-live="polite">{transcript.length ? transcript.slice(-3).map((turn) => <p key={turn.id}><b>{turn.speaker === 'INTERVIEWER' ? 'INTERVIEWER' : 'YOU'}</b>{turn.text}</p>) : <p><b>HIPLACEMENT</b>Preparing your first interview question…</p>}</div>
  </section>;
}
function Score({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-[var(--bg-subtle)] p-3"><p className="text-[10px] uppercase text-[var(--text-muted)]">{label}</p><strong className="text-xs">{value}</strong></div>; }
function List({ title, values }: { title: string; values: string[] }) { return <div><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">{title}</h3><ul className="space-y-1 text-xs">{values.map((value) => <li key={value}>• {value}</li>)}</ul></div>; }
