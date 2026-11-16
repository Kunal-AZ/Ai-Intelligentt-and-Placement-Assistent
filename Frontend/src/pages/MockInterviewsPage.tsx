import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { api } from '../lib/api';
import { GeminiLiveInterview, type LiveInterviewCallbacks, type LiveAudioState } from '../lib/gemini-live';
import '../styles/interviews.css';

type Question = { question: string; rubric: string[]; focusSkills: string[] };
type InterviewResponse = { _id: string; question: Question };
type Session = { _id: string; type: string; role?: string; difficulty: string };
type Evaluation = { technicalAccuracy: string; communication: string; structure: string; reasoning: string; strengths: string[]; improvements: string[]; followUpFocus: string[] };
type DialogueTurn = { id: string; speaker: 'INTERVIEWER' | 'CANDIDATE'; text: string };
type LiveStatus = 'idle' | 'connecting' | 'live' | 'interrupted' | 'closed' | 'error';
type Activity = 'INTERVIEWER' | 'CANDIDATE' | 'IDLE';
type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: (event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void; onend: () => void; onerror: () => void };
type RecognitionConstructor = new () => Recognition;
type IconName = 'mic' | 'muted' | 'text' | 'arrow' | 'check' | 'clock' | 'sound' | 'end' | 'download' | 'spark' | 'refresh';
const roles = ['Software Engineer', 'Full-Stack Developer', 'Backend Developer', 'Frontend Developer', 'Mobile Developer', 'DevOps Engineer', 'Cloud Engineer', 'Cybersecurity Analyst', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'AI Engineer', 'QA / Test Engineer', 'Site Reliability Engineer', 'UI/UX Designer', 'Product Manager', 'Business Analyst'];
const focuses = [
  { value: 'ROLE_SPECIFIC', label: 'Role-specific', description: 'Questions tailored to your next role' },
  { value: 'TECHNICAL', label: 'Technical', description: 'Core concepts and practical knowledge' },
  { value: 'DSA', label: 'Data structures', description: 'Problem solving and algorithms' },
  { value: 'SYSTEM_DESIGN', label: 'System design', description: 'Architecture and engineering trade-offs' },
  { value: 'HR', label: 'HR interview', description: 'Motivation, goals, and culture fit' },
  { value: 'BEHAVIORAL', label: 'Behavioral', description: 'Real experiences and how you work' },
];
const levels = [{ value: 'BEGINNER', label: 'Beginner', detail: 'Build your foundations' }, { value: 'INTERMEDIATE', label: 'Intermediate', detail: 'Put your skills to work' }, { value: 'ADVANCED', label: 'Advanced', detail: 'Go deeper under pressure' }];
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
const humanize = (value: string) => value.toLowerCase().replaceAll('_', ' ');

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    muted: <path d="m3 3 18 18M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 0v6M5 10v2a7 7 0 0 0 12 5m2-5v-2M12 19v3m-4 0h8" />,
    text: <><path d="M21 15a3 3 0 0 1-3 3H8l-5 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z" /><path d="M7 7h10M7 12h7" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    sound: <><path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    end: <rect x="5" y="5" width="14" height="14" rx="3" />,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="M20 2v4m-2-2h4" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function MockInterviewsPage() {
  const [phase, setPhase] = useState<'setup' | 'interview' | 'review'>('setup');
  const [mode, setMode] = useState<'VOICE' | 'TEXT'>('VOICE');
  const [role, setRole] = useState('Software Engineer');
  const [focus, setFocus] = useState('ROLE_SPECIFIC');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState<InterviewResponse | null>(null);
  const [answer, setAnswer] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
  const [activity, setActivity] = useState<Activity>('IDLE');
  const [muted, setMuted] = useState(false);
  const [canReplay, setCanReplay] = useState(false);
  const [audioState, setAudioState] = useState<LiveAudioState>({ micLevel: 0, sentChunks: 0, receivedChunks: 0, playback: 'unavailable' });
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const liveRef = useRef<GeminiLiveInterview | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const requestRef = useRef(0);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const evaluation = evaluations.at(-1);
  const focusLabel = focuses.find((item) => item.value === focus)?.label ?? focus;
  const running = phase === 'interview' && (mode === 'TEXT' ? !!session : liveStatus === 'live');

  useEffect(() => {
    if (!running || startedAt === null) return;
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update(); const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);
  useEffect(() => () => {
    requestRef.current += 1;
    const client = liveRef.current; liveRef.current = null; client?.close();
    recognitionRef.current?.stop(); window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => { if (phase === 'interview' && current) questionRef.current?.focus(); }, [current, phase]);

  function stopSpeech() {
    recognitionRef.current?.stop(); recognitionRef.current = null;
    window.speechSynthesis?.cancel(); setListening(false); setSpeaking(false);
  }
  function speakQuestion() {
    if (!current) return;
    if (!('speechSynthesis' in window)) { setError('Question playback is unavailable in this browser. You can read the question above.'); return; }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(current.question.question);
    utterance.lang = 'en-IN'; utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }
  function dictate() {
    const speechWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Dictation is unavailable in this browser. Type your answer below to continue.'); return; }
    stopSpeech(); setError('');
    const recognition = new SpeechRecognition(); recognitionRef.current = recognition;
    recognition.continuous = true; recognition.interimResults = false; recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const transcript = Array.from(event.results).slice(event.resultIndex).filter((result) => result.isFinal !== false).map((result) => result[0].transcript).join(' ').trim();
      if (transcript) setAnswer((value) => `${value}${value ? ' ' : ''}${transcript}`.slice(0, 10000));
    };
    recognition.onend = () => { if (recognitionRef.current === recognition) { setListening(false); recognitionRef.current = null; } };
    recognition.onerror = () => { if (recognitionRef.current === recognition) { setListening(false); recognitionRef.current = null; setError('Dictation stopped. Check microphone permission, or continue typing your answer.'); } };
    try { recognition.start(); setListening(true); }
    catch { recognitionRef.current = null; setListening(false); setError('Could not start dictation. You can still type your answer.'); }
  }

  async function start() {
    const request = ++requestRef.current;
    setBusy(true); setError(''); setNotice(''); setDialogue([]); setEvaluations([]); setElapsed(0); setStartedAt(null); setAnswer(''); setCurrent(null); setSession(null);
    if (mode === 'TEXT') {
      try {
        const result = await api<{ session: Session; question: InterviewResponse }>('/interviews', { method: 'POST', body: JSON.stringify({ type: focus, difficulty, role }) });
        if (request !== requestRef.current) return;
        setSession(result.session); setCurrent(result.question);
        setDialogue([{ id: result.question._id, speaker: 'INTERVIEWER', text: result.question.question.question }]);
        setStartedAt(Date.now()); setPhase('interview');
      } catch (cause) { if (request === requestRef.current) setError(cause instanceof Error ? cause.message : 'Could not prepare your interview. Please try again.'); }
      finally { if (request === requestRef.current) setBusy(false); }
      return;
    }
    setCanReplay(false);
    setAudioState({ micLevel: 0, sentChunks: 0, receivedChunks: 0, playback: 'unavailable' });
    setPhase('interview'); setLiveStatus('connecting'); setMuted(false); setActivity('IDLE');
    const callbacks: LiveInterviewCallbacks = {
      onReplayAvailable: (value) => { if (request === requestRef.current) setCanReplay(value); },
      onAudioState: (state) => { if (request === requestRef.current) setAudioState(state); },
      onNotice: (message) => { if (request === requestRef.current) setNotice(message); },
      onStatus: (status) => { if (request === requestRef.current) setLiveStatus(status); },
      onTranscript: (speaker, text) => {
        if (request !== requestRef.current) return;
        setDialogue((turns) => {
          const last = turns.at(-1);
          return last?.speaker === speaker ? [...turns.slice(0, -1), { ...last, text: `${last.text} ${text}`.trim() }] : [...turns, { id: crypto.randomUUID(), speaker, text }];
        });
      },
      onActivity: (value) => { if (request === requestRef.current) setActivity(value); },
      onError: (message) => { if (request === requestRef.current) { setError(message); setLiveStatus('error'); } },
    };
    const client = new GeminiLiveInterview(callbacks); liveRef.current = client;
    try {
      await client.unlockAudio();
      await client.prepareMicrophone();
      if (request !== requestRef.current) return;
      const credentials = await api<{ token: string; model: string }>('/interviews/live-token', { method: 'POST' });
      if (request !== requestRef.current) return;
      await client.connect({ ...credentials, role, focus: focusLabel, difficulty });
      if (request === requestRef.current) setStartedAt(Date.now());
    } catch (cause) {
      client.close();
      if (request === requestRef.current) { setLiveStatus('error'); setError(cause instanceof Error ? cause.message : 'Could not connect. Please try again.'); }
    } finally { if (request === requestRef.current) setBusy(false); }
  }
  async function submit() {
    if (!session || !answer.trim() || busy) return;
    stopSpeech(); setBusy(true); setError('');
    const submitted = answer.trim();
    try {
      const result = await api<{ evaluation: Evaluation; nextQuestion: InterviewResponse }>(`/interviews/${session._id}/respond`, { method: 'POST', body: JSON.stringify({ answer: submitted }) });
      setDialogue((turns) => [...turns, { id: crypto.randomUUID(), speaker: 'CANDIDATE', text: submitted }, { id: result.nextQuestion._id, speaker: 'INTERVIEWER', text: result.nextQuestion.question.question }]);
      setEvaluations((values) => [...values, result.evaluation]); setCurrent(result.nextQuestion); setAnswer('');
      setNotice('Answer saved. Your next question is ready, with feedback below.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not evaluate your answer. Your draft is still here.'); }
    finally { setBusy(false); }
  }
  async function finish() {
    if (busy && mode === 'TEXT') return;
    if (mode === 'VOICE') {
      requestRef.current += 1; liveRef.current?.close(); liveRef.current = null;
      setLiveStatus('closed'); setActivity('IDLE'); setMuted(false); setBusy(false);
    } else if (session) {
      stopSpeech(); setBusy(true); setError('');
      try { await api(`/interviews/${session._id}/complete`, { method: 'POST' }); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not finish your interview. Try again.'); setBusy(false); return; }
      setBusy(false); setSession(null); setCurrent(null);
    }
    setError(''); setNotice(''); setPhase('review');
  }
  function reset() {
    requestRef.current += 1; liveRef.current?.close(); liveRef.current = null;
    stopSpeech(); setLiveStatus('idle'); setBusy(false); setError(''); setNotice(''); setPhase('setup');
  }
  function downloadTranscript() {
    const feedback = evaluations.map((item, index) => `ANSWER ${index + 1} FEEDBACK\nTechnical accuracy: ${item.technicalAccuracy}\nCommunication: ${item.communication}\nStructure: ${item.structure}\nReasoning: ${item.reasoning}\nStrengths: ${item.strengths.join('; ')}\nImprove: ${item.improvements.join('; ')}\nNext focus: ${item.followUpFocus.join(', ')}`).join('\n\n');
    const content = `HiPlacement · Interview practice\n${role} | ${focusLabel} | ${humanize(difficulty)}\n${mode === 'VOICE' ? 'Live voice' : 'Text'} · ${formatTime(elapsed)}\n\n${dialogue.map((turn) => `${turn.speaker}\n${turn.text}`).join('\n\n')}${feedback ? `\n\n${feedback}` : ''}${answer.trim() ? `\n\nUNSUBMITTED DRAFT\n${answer}` : ''}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'hiplacement-interview.txt'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="interview-workspace">
    <header className="interview-page-header"><div><div className="interview-eyebrow"><Icon name="spark" size={15} /> YOUR NEXT OPPORTUNITY STARTS HERE</div><h1>AI Mock Interviews<span>.</span></h1><p>A little practice today. A more confident conversation tomorrow.</p></div><span className="interview-header-note"><span className="interview-status-dot" /> Your personal practice space</span></header>
    <nav className="interview-steps" aria-label="Interview progress">{['Make it yours', 'Practice interview', 'Reflect & improve'].map((label, index) => {
      const step = ['setup', 'interview', 'review'].indexOf(phase);
      return <div key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Icon name="check" size={14} /> : `0${index + 1}`}</span>{label}</div>;
    })}</nav>
    {error && <div className="interview-alert" role="alert"><strong>Something needs your attention</strong><p>{error}</p>{phase === 'setup' && <span>Your settings are ready. Try starting again.</span>}</div>}
    {notice && <p className="interview-notice" role="status">{notice}</p>}
    {phase === 'setup' && <div className="interview-setup-grid">
      <section className="interview-panel interview-setup-panel" aria-labelledby="setup-heading">
        <div className="interview-section-heading"><div><span className="interview-eyebrow">THE RIGHT PRACTICE FOR YOU</span><h2 id="setup-heading">Set the stage</h2></div><span className="interview-small-tag">01 / SETUP</span></div>
        <fieldset disabled={busy} className="interview-fieldset"><legend>How would you like to practice?</legend><div className="interview-mode-options">{(['VOICE', 'TEXT'] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} className={`interview-mode-option ${mode === value ? 'is-selected' : ''}`} onClick={() => setMode(value)}><span className="interview-mode-icon"><Icon name={value === 'VOICE' ? 'mic' : 'text'} /></span><span><strong>{value === 'VOICE' ? 'Live voice' : 'Text interview'}</strong><small>{value === 'VOICE' ? 'A natural, real-time conversation' : 'Think, write, and get feedback'}</small></span><span className="interview-radio-mark">{mode === value && <Icon name="check" size={12} />}</span></button>)}</div></fieldset>
        <div className="interview-role-field"><label htmlFor="interview-role">What role are you preparing for?</label><select id="interview-role" className="form-select" value={role} disabled={busy} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select></div>
        <fieldset className="interview-fieldset" disabled={busy}><legend>Choose your focus</legend><div className="interview-focus-options">{focuses.map((item) => <button key={item.value} type="button" title={item.description} aria-pressed={focus === item.value} className={focus === item.value ? 'is-selected' : ''} onClick={() => setFocus(item.value)}>{item.label}</button>)}</div><p className="interview-field-help">{focuses.find((item) => item.value === focus)?.description}.</p></fieldset>
        <fieldset className="interview-fieldset" disabled={busy}><legend>Set your challenge</legend><div className="interview-level-options">{levels.map((item, index) => <button key={item.value} type="button" aria-pressed={difficulty === item.value} className={difficulty === item.value ? 'is-selected' : ''} onClick={() => setDifficulty(item.value)}><span className="interview-level-bars" aria-hidden="true">{[0, 1, 2].map((bar) => <i key={bar} className={bar <= index ? 'is-filled' : ''} />)}</span><strong>{item.label}</strong><small>{item.detail}</small></button>)}</div></fieldset>
        <div className="interview-start-row"><p><Icon name={mode === 'VOICE' ? 'mic' : 'check'} size={16} />{mode === 'VOICE' ? 'Allow microphone access when prompted.' : 'Your answers and feedback are saved.'}</p><button className="interview-primary" disabled={busy} onClick={() => void start()}>{busy ? 'Preparing interview…' : `Start ${mode === 'VOICE' ? 'voice' : 'text'} interview`}<Icon name="arrow" size={18} /></button></div>
      </section>
      <aside className="interview-setup-aside"><div className="interview-preview"><div className="interview-preview-top"><span><span className="interview-status-dot" /> INTERVIEW STUDIO</span><Icon name={mode === 'VOICE' ? 'mic' : 'text'} size={18} /></div><VoiceOrb activity="IDLE" active={false} /><span className="interview-preview-label">{mode === 'VOICE' ? 'A conversation, with room to grow.' : 'Find the words. Build your confidence.'}</span><p>{mode === 'VOICE' ? 'Meet your AI interviewer. Speak naturally, explore follow-ups, and practice thinking out loud.' : 'Take your time with each question. Get specific feedback and a follow-up that builds on your answer.'}</p><div className="interview-preview-meta"><span>{role}</span><span>{humanize(difficulty)}</span></div></div><div className="interview-prep"><h3>A good session starts here</h3>{(mode === 'VOICE' ? ['Find a quiet spot and check your audio.', 'Think out loud. Your reasoning matters.', 'Take a breath. This is a space to practice.'] : ['Use a specific example to ground your answer.', 'Explain your approach and the trade-offs.', 'Use each piece of feedback in your next answer.']).map((tip, index) => <p key={tip}><span>0{index + 1}</span>{tip}</p>)}<div className="interview-save-note">{mode === 'VOICE' ? 'Voice transcripts stay in this page. Download yours before leaving; live voice does not generate a saved scorecard.' : 'Each submitted answer is evaluated and saved to your account.'}</div></div></aside>
    </div>}

    {phase === 'interview' && <>
      <div className="interview-session-strip"><div><span className="interview-session-icon"><Icon name={mode === 'VOICE' ? 'mic' : 'text'} /></span><div><strong>{role}</strong><p>{focusLabel} <span>·</span> {humanize(difficulty)} <span>·</span> {mode === 'VOICE' ? 'Live voice' : 'Text practice'}</p></div></div><div><span className="interview-timer"><Icon name="clock" size={16} />{formatTime(elapsed)}</span><button className="btn-secondary" disabled={mode === 'TEXT' && busy} onClick={() => void finish()}>{liveStatus === 'connecting' && mode === 'VOICE' ? 'Cancel connection' : 'Finish session'}</button></div></div>
      <div className="interview-session-grid"><div className="interview-main-column">
        {mode === 'VOICE' ? <section className={`interview-voice-stage ${liveStatus === 'live' ? 'is-live' : ''}`}>
          <div className="interview-stage-top"><span>HIPLACEMENT INTERVIEWER</span><span className={`interview-live-badge ${liveStatus === 'live' ? 'is-live' : ''}`}><span className="interview-status-dot" />{liveStatus === 'live' ? 'Live' : liveStatus === 'connecting' ? 'Connecting' : 'Disconnected'}</span></div>
          <VoiceOrb activity={activity} active={liveStatus === 'live'} />
          <div className="interview-voice-copy" aria-live="polite"><h2>{liveStatus === 'connecting' ? 'Getting your room ready' : liveStatus !== 'live' ? 'Let’s get you reconnected' : activity === 'INTERVIEWER' ? 'Your interviewer is speaking' : muted ? 'Take a moment. You’re muted.' : activity === 'CANDIDATE' ? 'We’re listening to you' : 'The floor is yours'}</h2><p>{liveStatus === 'connecting' ? 'Connecting audio. Allow microphone access to join.' : liveStatus !== 'live' ? 'Your transcript is still here. Return to setup to start a fresh session.' : activity === 'INTERVIEWER' ? 'Listen to the question, then share your approach.' : muted ? 'Unmute your microphone whenever you’re ready.' : 'Speak naturally. There’s no need to rush your answer.'}</p></div>
          <div className="interview-voice-controls"><button disabled={liveStatus !== 'live'} aria-pressed={muted} onClick={() => { const next = !muted; liveRef.current?.setMuted(next); setMuted(next); }} className={muted ? 'is-muted' : ''}><Icon name={muted ? 'muted' : 'mic'} /><span>{muted ? 'Unmute' : 'Mute mic'}</span></button><button disabled={liveStatus !== 'live'} onClick={() => { void liveRef.current?.testSpeaker().then(() => setNotice('A short test tone was played. If you cannot hear it, check the browser tab mute setting and your system output device.')).catch(() => setError('Audio could not start. Check your browser and system volume.')); }}><Icon name="sound" /><span>Test speaker</span></button><button disabled={liveStatus !== 'live' || !canReplay} onClick={() => { void liveRef.current?.repeatQuestion().catch(() => setError('Could not replay the question. Check your audio output and try again.')); }}><Icon name="refresh" /><span>Repeat question</span></button><button className="interview-end-control" onClick={() => void finish()}><Icon name="end" /><span>End session</span></button></div>
          {liveStatus === 'live' && <div className="interview-audio-check"><label>Microphone level <meter min={0} max={1} value={muted ? 0 : audioState.micLevel} aria-label="Microphone input level" /></label><span>{muted ? 'Microphone muted' : audioState.sentChunks ? 'Microphone audio sending' : 'Waiting for microphone audio'}</span><span>{audioState.receivedChunks ? 'Interviewer audio received' : 'Waiting for interviewer audio'}</span><span>Speaker: {audioState.playback}</span><p>Speak to move the meter. If it stays empty, check your system input device. If audio is received but silent, use Test speaker and check your output volume.</p></div>}
          {['error', 'closed', 'interrupted'].includes(liveStatus) ? <button className="interview-reconnect" onClick={reset}><Icon name="refresh" size={16} /> Back to setup</button> : <p className="interview-voice-footnote">{liveStatus === 'live' ? muted ? 'Microphone muted · You can still hear your interviewer' : 'Microphone connected · Audio streams during this session' : 'Your session timer starts when the connection is ready.'}</p>}
        </section> : current && <section className="interview-panel interview-question-panel">
          <div className="interview-question-top"><span className="interview-eyebrow">QUESTION {String(evaluations.length + 1).padStart(2, '0')}</span><span className="interview-small-tag">{busy ? 'Reviewing answer' : listening ? 'Dictation on' : 'Your turn'}</span></div>
          <h2 ref={questionRef} tabIndex={-1}>{current.question.question}</h2><div className="interview-skill-tags">{current.question.focusSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
          <button className="interview-read-question" disabled={busy} onClick={speaking ? stopSpeech : speakQuestion}><Icon name={speaking ? 'end' : 'sound'} size={16} />{speaking ? 'Stop playback' : 'Read question aloud'}</button>
          <div className="interview-answer-heading"><label htmlFor="interview-answer">Your answer</label><span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span></div><textarea id="interview-answer" value={answer} maxLength={10000} disabled={busy} onChange={(event) => setAnswer(event.target.value)} placeholder="Walk through your thinking. Start with the situation, explain your approach, and share the outcome…" aria-describedby="interview-answer-hint" />
          <div className="interview-answer-toolbar"><button className={`btn-secondary ${listening ? 'interview-dictating' : ''}`} disabled={busy} onClick={listening ? stopSpeech : dictate}><Icon name={listening ? 'end' : 'mic'} size={16} />{listening ? 'Stop dictation' : 'Dictate answer'}</button><span>{answer.length.toLocaleString()} / 10,000</span><button className="interview-primary" disabled={!answer.trim() || busy} onClick={() => void submit()}>{busy ? 'Reviewing…' : 'Submit answer'}<Icon name="arrow" size={17} /></button></div><p id="interview-answer-hint" className="interview-field-help">Submit for feedback and a personalized follow-up. Only submitted answers are saved.</p>
        </section>}
        {mode === 'TEXT' && (evaluation ? <Feedback evaluation={evaluation} number={evaluations.length} /> : <div className="interview-feedback-placeholder"><Icon name="spark" /><div><strong>Your feedback starts with your first answer</strong><p>Get a review of your technical accuracy, communication, structure, and reasoning.</p></div></div>)}
      </div><Transcript turns={dialogue} live={mode === 'VOICE' && liveStatus === 'live'} onDownload={downloadTranscript} /></div>
    </>}

    {phase === 'review' && <>
      <section className="interview-panel interview-review-hero"><div className="interview-review-check"><Icon name="check" size={26} /></div><span className="interview-eyebrow">ONE STEP MORE PREPARED</span><h2>{dialogue.length ? 'Practice done. Progress made.' : 'Ready whenever you are.'}</h2><p>{mode === 'VOICE' ? 'Keep your transcript to reflect on your answers and plan your next practice.' : 'Your submitted answers and feedback are saved. Take a moment to reflect on what comes next.'}</p><div className="interview-review-stats"><div><strong>{formatTime(elapsed)}</strong><span>Session time</span></div><div><strong>{mode === 'TEXT' ? evaluations.length : dialogue.filter((turn) => turn.speaker === 'CANDIDATE').length}</strong><span>{mode === 'TEXT' ? 'Answers reviewed' : 'Speaking turns'}</span></div><div><strong>{focusLabel}</strong><span>Practice focus</span></div></div><div className="interview-review-actions"><button className="interview-primary" onClick={reset}>Practice again<Icon name="arrow" size={18} /></button><button className="btn-secondary" disabled={!dialogue.length && !answer} onClick={downloadTranscript}><Icon name="download" size={17} />Download session</button></div>{mode === 'VOICE' && <small>Live voice transcripts are available here until you start again or leave this page. No AI scorecard is generated for voice sessions.</small>}</section>
      {answer.trim() && <div className="interview-alert"><strong>You have an unsubmitted draft</strong><p>It was not evaluated or saved to your account. Download this session to keep a copy.</p><details><summary>View draft</summary><p className="interview-draft">{answer}</p></details></div>}
      <div className="interview-session-grid"><div className="interview-main-column">{evaluations.length ? evaluations.map((item, index) => <Feedback key={index} evaluation={item} number={index + 1} />) : <section className="interview-panel interview-reflection"><span className="interview-eyebrow">MAKE YOUR NEXT ANSWER STRONGER</span><h2>A moment to reflect</h2><p>Read your transcript and ask yourself:</p><ul><li>Did I answer the question with a clear, specific example?</li><li>Did I explain why I chose my approach?</li><li>What would I make clearer next time?</li></ul><p>Try a text interview for saved AI feedback on each answer.</p></section>}</div><Transcript turns={dialogue} live={false} onDownload={downloadTranscript} /></div>
    </>}
  </div>;
}

function VoiceOrb({ activity, active }: { activity: Activity; active: boolean }) {
  return <div className={`interview-orb-scene ${active && activity !== 'IDLE' ? 'is-active' : ''} ${activity === 'CANDIDATE' ? 'is-listening' : ''}`} aria-hidden="true"><div className="interview-orbit interview-orbit-outer" /><div className="interview-orbit interview-orbit-inner" /><div className="interview-orb"><div className="interview-orb-bars">{[18, 32, 48, 28, 40, 22, 14].map((height, index) => <i key={index} style={{ '--height': `${height}px`, '--delay': `${index * 0.11}s` } as CSSProperties} />)}</div></div><span className="interview-orbit-spark one" /><span className="interview-orbit-spark two" /></div>;
}
function Transcript({ turns, live, onDownload }: { turns: DialogueTurn[]; live: boolean; onDownload: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  useEffect(() => { const element = scrollRef.current; if (element && followRef.current) element.scrollTop = element.scrollHeight; }, [turns]);
  return <aside className="interview-panel interview-transcript"><div className="interview-transcript-header"><div><Icon name="text" size={18} /><h2>Session transcript</h2></div><span className="interview-small-tag">{live ? 'LIVE' : `${turns.length} TURNS`}</span></div><div className="interview-transcript-scroll" ref={scrollRef} onScroll={() => { const el = scrollRef.current; if (el) followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }} role="log" aria-label="Interview transcript" aria-live={live ? 'off' : 'polite'} tabIndex={0}>{turns.length ? turns.map((turn) => <div key={turn.id} className={`interview-transcript-turn ${turn.speaker === 'CANDIDATE' ? 'is-candidate' : ''}`}><div className="interview-transcript-speaker"><span>{turn.speaker === 'INTERVIEWER' ? <Icon name="spark" size={13} /> : 'Y'}</span>{turn.speaker === 'INTERVIEWER' ? 'AI interviewer' : 'You'}</div><p>{turn.text}</p></div>) : <div className="interview-transcript-empty"><Icon name="text" size={28} /><strong>The conversation starts here</strong><p>Your questions and answers will appear as the interview unfolds.</p></div>}</div><div className="interview-transcript-footer"><span>{live ? 'Transcription may have a short delay.' : 'Your conversation, in one place.'}</span><button aria-label="Download session transcript" title="Download transcript" onClick={onDownload} disabled={!turns.length}><Icon name="download" size={17} /></button></div></aside>;
}
function Feedback({ evaluation, number }: { evaluation: Evaluation; number: number }) {
  return <section className="interview-panel interview-feedback"><div className="interview-section-heading"><div><span className="interview-eyebrow">LEARN FROM EVERY ANSWER</span><h2>Answer {number} feedback</h2></div><span className="interview-saved"><Icon name="check" size={14} />Saved</span></div><div className="interview-score-grid">{[['Technical accuracy', evaluation.technicalAccuracy], ['Communication', evaluation.communication], ['Structure', evaluation.structure], ['Reasoning', evaluation.reasoning]].map(([label, value]) => <div key={label}><span>{label}</span><strong className={`interview-rating rating-${value.toLowerCase()}`}>{value === 'STRONG' ? 'Strong' : value === 'PARTIAL' ? 'Developing' : value === 'INSUFFICIENT' ? 'Needs practice' : humanize(value)}</strong></div>)}</div><div className="interview-feedback-lists"><FeedbackList title="What worked well" values={evaluation.strengths} positive /><FeedbackList title="Try this next time" values={evaluation.improvements} /></div>{evaluation.followUpFocus.length > 0 && <div className="interview-next-focus"><strong>Next focus</strong><div className="interview-skill-tags">{evaluation.followUpFocus.map((item) => <span key={item}>{item}</span>)}</div></div>}</section>;
}
function FeedbackList({ title, values, positive = false }: { title: string; values: string[]; positive?: boolean }) {
  return <div><h3><Icon name={positive ? 'check' : 'arrow'} size={15} />{title}</h3>{values.length ? <ul>{values.map((value, index) => <li key={index}>{value}</li>)}</ul> : <p>No specific feedback for this answer.</p>}</div>;
}
