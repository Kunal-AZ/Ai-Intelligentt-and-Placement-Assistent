import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiLiveInterview, downsampleToPcm16 } from './gemini-live';

class Socket {
  static OPEN = 1;
  static latest: Socket;
  readyState = 1;
  onopen?: () => void;
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  onclose?: () => void;
  send = vi.fn();
  close = vi.fn();
  constructor(public url: string) { Socket.latest = this; }
}
const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
class Context {
  static latest: Context;
  state = 'running';
  sampleRate = 48_000;
  currentTime = 1;
  destination = {};
  processor = { ...node(), onaudioprocess: undefined as undefined | ((event: { inputBuffer: { getChannelData: () => Float32Array } }) => void) };
  buffers: { rate: number; length: number; samples: Float32Array }[] = [];
  sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
  resume = vi.fn(async () => { this.state = 'running'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  constructor() { Context.latest = this; }
  createMediaStreamSource = vi.fn(node);
  createScriptProcessor = vi.fn(() => this.processor);
  createGain = vi.fn(() => ({ ...node(), gain: { value: 1 } }));
  createBuffer(channels: number, length: number, rate: number) {
    const samples = new Float32Array(length);
    this.buffers.push({ rate, length, samples });
    return { getChannelData: () => samples, duration: length / rate };
  }
  createBufferSource() {
    const source = { ...node(), buffer: null as unknown, onended: null as unknown, start: vi.fn(), stop: vi.fn() };
    this.sources.push(source);
    return source;
  }
}
const track = { stop: vi.fn(), onended: null as unknown };
const getUserMedia = vi.fn();
let client: GeminiLiveInterview;
let callbacks: { onStatus: ReturnType<typeof vi.fn>; onTranscript: ReturnType<typeof vi.fn>; onError: ReturnType<typeof vi.fn>; onActivity: ReturnType<typeof vi.fn>; onAudioState: ReturnType<typeof vi.fn> };
beforeEach(() => {
  vi.stubGlobal('window', globalThis);
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal('WebSocket', Socket);
  getUserMedia.mockReset().mockResolvedValue({ getTracks: () => [track], getAudioTracks: () => [track] });
  track.stop.mockClear();
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  callbacks = { onStatus: vi.fn(), onTranscript: vi.fn(), onError: vi.fn(), onActivity: vi.fn(), onAudioState: vi.fn() };
  client = new GeminiLiveInterview(callbacks);
});
afterEach(() => { client.close(); vi.unstubAllGlobals(); });
async function connect() {
  await client.unlockAudio();
  await client.prepareMicrophone();
  const connected = client.connect({ token: 'test-token', model: 'models/gemini-3.8-live', role: 'Engineer', focus: 'Technical', difficulty: 'BEGINNER' });
  Socket.latest.onopen?.();
  Socket.latest.onmessage?.({ data: JSON.stringify({ setupComplete: {} }) });
  await connected;
}
const messages = () => Socket.latest.send.mock.calls.map(([message]) => JSON.parse(message));

describe('live interview audio', () => {
  it('waits for setup, then sends microphone PCM using the realtime audio field', async () => {
    await connect();
    expect(messages()[0].setup.model).toBe('models/gemini-3.8-live');
    expect(messages()[1].realtimeInput.text).toContain('aloud');
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    Context.latest.processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => new Float32Array(2048).fill(0.5) } });
    const audio = messages().at(-1).realtimeInput.audio;
    expect(audio.mimeType).toBe('audio/pcm;rate=16000');
    expect(atob(audio.data).length).toBe(Math.ceil(2048 / 3) * 2);
    expect(messages().at(-1).realtimeInput.mediaChunks).toBeUndefined();
  });
  it('uses AudioWorklet capture when supported', async () => {
    await client.unlockAudio();
    const addModule = vi.fn().mockResolvedValue(undefined);
    Object.assign(Context.latest, { audioWorklet: { addModule } });
    class Worklet {
      static latest: Worklet;
      port = { onmessage: undefined as undefined | ((event: { data: Float32Array }) => void) };
      connect = vi.fn();
      disconnect = vi.fn();
      constructor() { Worklet.latest = this; }
    }
    vi.stubGlobal('AudioWorkletNode', Worklet);
    await connect();
    expect(addModule).toHaveBeenCalledWith(expect.stringContaining('pcm-capture.worklet.js'));
    expect(Context.latest.createScriptProcessor).not.toHaveBeenCalled();
    Worklet.latest.port.onmessage?.({ data: new Float32Array(2048).fill(0.25) });
    expect(messages().at(-1).realtimeInput.audio.mimeType).toBe('audio/pcm;rate=16000');
  });
  it('plays received PCM, preserves transcripts, and stops queued audio on interruption', async () => {
    await connect();
    Socket.latest.onmessage?.({ data: new Blob([JSON.stringify({ serverContent: { outputTranscription: { text: 'Hello' }, modelTurn: { parts: [{ inlineData: { data: btoa('\x00\x40\x00\xc0'), mimeType: 'audio/pcm;rate=24000' } }] } } })]) });
    await vi.waitFor(() => expect(Context.latest.sources).toHaveLength(1));
    expect(Context.latest.buffers[0].rate).toBe(24000);
    expect([...Context.latest.buffers[0].samples]).toEqual([0.5, -0.5]);
    expect(Context.latest.sources[0].start).toHaveBeenCalled();
    expect(callbacks.onTranscript).toHaveBeenCalledWith('INTERVIEWER', 'Hello');
    Socket.latest.onmessage?.({ data: JSON.stringify({ serverContent: { interrupted: true } }) });
    await vi.waitFor(() => expect(Context.latest.sources[0].stop).toHaveBeenCalled());
  });
  it('signals end of audio when muted and resumes sending after unmute', async () => {
    await connect();
    client.setMuted(true);
    expect(messages().at(-1)).toEqual({ realtimeInput: { audioStreamEnd: true } });
    const count = messages().length;
    const event = { inputBuffer: { getChannelData: () => new Float32Array(2048) } };
    Context.latest.processor.onaudioprocess?.(event);
    expect(messages()).toHaveLength(count);
    client.setMuted(false);
    Context.latest.processor.onaudioprocess?.(event);
    expect(messages()).toHaveLength(count + 1);
  });
  it('surfaces microphone denial before opening a socket', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
    await expect(client.prepareMicrophone()).rejects.toThrow('Microphone permission was denied');
  });
  it('releases a microphone permission result that arrives after cancellation', async () => {
    let resolve!: (value: unknown) => void;
    getUserMedia.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const pending = client.prepareMicrophone();
    client.close();
    resolve({ getTracks: () => [track] });
    await pending;
    expect(track.stop).toHaveBeenCalled();
  });
  it('recreates playback after device changes without closing the microphone or interview', async () => {
    const addEventListener = vi.fn();
    Object.assign(navigator.mediaDevices, { addEventListener });
    await connect();
    const inputContext = Context.latest;
    const listener = addEventListener.mock.calls.find(([event]) => event === 'devicechange')?.[1];
    listener();
    await vi.waitFor(() => expect(Context.latest).not.toBe(inputContext));
    const outputContext = Context.latest;
    expect(inputContext.close).not.toHaveBeenCalled();
    expect(track.stop).not.toHaveBeenCalled();
    expect(Socket.latest.close).not.toHaveBeenCalled();
    Socket.latest.onmessage?.({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ inlineData: { data: btoa('\x00\x40'), mimeType: 'audio/pcm;rate=24000' } }] } } }) });
    await vi.waitFor(() => expect(outputContext.sources).toHaveLength(1));
    expect(inputContext.sources).toHaveLength(0);
    listener();
    await vi.waitFor(() => expect(outputContext.close).toHaveBeenCalled());
    client.close();
    expect(Context.latest.close).toHaveBeenCalled();
    expect(inputContext.close).toHaveBeenCalled();
  });
  it('replays one cached question without server requests or duplicate transcripts', async () => {
    await connect();
    Socket.latest.onmessage?.({ data: JSON.stringify({ serverContent: { turnComplete: true, outputTranscription: { text: 'Tell me about yourself.' }, modelTurn: { parts: [{ inlineData: { data: btoa('\x00\x40\x00\xc0'), mimeType: 'audio/pcm;rate=24000' } }] } } }) });
    await vi.waitFor(() => expect(Context.latest.sources).toHaveLength(1));
    const sent = messages().length;
    const transcripts = callbacks.onTranscript.mock.calls.length;
    await Promise.all([client.repeatQuestion(), client.repeatQuestion()]);
    expect(Context.latest.sources).toHaveLength(2);
    expect(Context.latest.sources[0].stop).toHaveBeenCalledOnce();
    expect(Context.latest.buffers).toHaveLength(1);
    expect(messages()).toHaveLength(sent);
    expect(callbacks.onTranscript).toHaveBeenCalledTimes(transcripts);
    Context.latest.processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => new Float32Array(2048).fill(0.5) } });
    expect([...atob(messages().at(-1).realtimeInput.audio.data)].every((byte) => byte.charCodeAt(0) === 0)).toBe(true);
  });
  it('does not replay an unfinished or interrupted question', async () => {
    await connect();
    Socket.latest.onmessage?.({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ inlineData: { data: btoa('\x00\x40'), mimeType: 'audio/pcm;rate=24000' } }] } } }) });
    await vi.waitFor(() => expect(Context.latest.sources).toHaveLength(1));
    await client.repeatQuestion();
    expect(Context.latest.sources).toHaveLength(1);
    Socket.latest.onmessage?.({ data: JSON.stringify({ serverContent: { interrupted: true, turnComplete: true } }) });
    await vi.waitFor(() => expect(Context.latest.sources[0].stop).toHaveBeenCalled());
    await client.repeatQuestion();
    expect(Context.latest.sources).toHaveLength(1);
  });
  it('replaces the replay cache with the latest question', async () => {
    await connect();
    for (const value of ['\x00\x40', '\x00\x20']) {
      Socket.latest.onmessage?.({ data: JSON.stringify({ serverContent: { turnComplete: true, modelTurn: { parts: [{ inlineData: { data: btoa(value), mimeType: 'audio/pcm;rate=24000' } }] } } }) });
    }
    await vi.waitFor(() => expect(Context.latest.sources).toHaveLength(2));
    await client.repeatQuestion();
    expect(Context.latest.sources).toHaveLength(3);
    expect(Context.latest.buffers).toHaveLength(2);
  });
  it('resamples and clamps microphone samples to 16-bit PCM', () => {
    expect([...new Int16Array(downsampleToPcm16(new Float32Array([2, 2, 2, -2, -2, -2]), 48_000))]).toEqual([32767, -32767]);
  });
});
