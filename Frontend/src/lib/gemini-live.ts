export type LiveInterviewCallbacks = {
  onStatus: (status: 'connecting' | 'live' | 'interrupted' | 'closed' | 'error') => void;
  onTranscript: (speaker: 'INTERVIEWER' | 'CANDIDATE', text: string) => void;
  onError: (message: string) => void;
  onActivity: (speaker: 'INTERVIEWER' | 'CANDIDATE' | 'IDLE') => void;
};

type Setup = { token: string; model: string; role: string; focus: string; difficulty: string };

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer); let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

function downsampleToPcm16(input: Float32Array, inputRate: number): ArrayBuffer {
  const outputRate = 16_000;
  const ratio = inputRate / outputRate;
  const output = new Int16Array(Math.ceil(input.length / ratio));
  for (let index = 0; index < output.length; index += 1) {
    const start = Math.floor(index * ratio); const end = Math.min(Math.floor((index + 1) * ratio), input.length);
    let sum = 0;
    for (let sample = start; sample < end; sample += 1) sum += input[sample] ?? 0;
    output[index] = Math.max(-1, Math.min(1, sum / Math.max(end - start, 1))) * 0x7fff;
  }
  return output.buffer;
}

/** Browser-side Gemini Live client. It streams mic audio and plays native
 * model audio immediately, keeping the API key on the server via an ephemeral
 * session token. */
export class GeminiLiveInterview {
  private socket: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private silentSink: GainNode | null = null;
  private playbackSources = new Set<AudioBufferSourceNode>();
  private nextPlaybackTime = 0;
  private closed = false;
  private muted = false;
  private setup: Setup | null = null;
  private resolveConnected: (() => void) | null = null;
  private rejectConnected: ((reason: Error) => void) | null = null;
  private connectTimeout: number | null = null;

  constructor(private readonly callbacks: LiveInterviewCallbacks) {}

  /** Must be called from a user click so browsers allow streamed AI audio. */
  async unlockAudio(): Promise<void> {
    this.context ??= new AudioContext();
    if (this.context.state !== 'running') await this.context.resume();
  }

  async connect(setup: Setup): Promise<void> {
    if (this.closed) throw new Error('This interview connection has been closed. Start a new session.');
    this.callbacks.onStatus('connecting');
    this.setup = setup;
    return new Promise<void>((resolve, reject) => {
      this.resolveConnected = resolve; this.rejectConnected = reject;
      this.connectTimeout = window.setTimeout(() => {
        const error = new Error('Gemini Live did not confirm the session within 12 seconds. Check Live API access, the configured model, and your network.');
        this.fail(error);
      }, 12_000);
      this.socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(setup.token)}`);
      this.socket.onopen = () => {
      this.socket?.send(JSON.stringify({ setup: {
        model: `models/${setup.model}`,
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } } },
        systemInstruction: { parts: [{ text: `You are HiPlacement Assistant, a warm, professional interviewer conducting a live ${setup.focus} interview for a ${setup.role} candidate at ${setup.difficulty} level. Introduce yourself only as “HiPlacement Assistant” or “your HiPlacement interviewer”; never mention Gemini, Google, models, or APIs. Speak naturally, ask one question at a time, listen without interrupting, and ask concise follow-up questions that depend on the candidate's answer. Do not provide the solution unless the candidate asks after the interview.` }] },
        inputAudioTranscription: {}, outputAudioTranscription: {},
      }}));
      };
      this.socket.onmessage = (event) => void this.handleServerMessage(event.data);
      this.socket.onerror = () => this.fail(new Error('The live interview connection failed. Please check your connection and try again.'));
      this.socket.onclose = (event) => {
        if (!this.closed) {
          const reason = event.reason ? `Gemini Live closed the session: ${event.reason}` : `Gemini Live closed the session (code ${event.code}).`;
          this.fail(new Error(reason));
        }
      };
    });
  }

  private async startMic(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    if (this.closed) { stream.getTracks().forEach((track) => track.stop()); return; }
    this.stream = stream;
    this.context ??= new AudioContext();
    if (this.context.state !== 'running') await this.context.resume();
    if (this.closed) return;
    this.inputSource = this.context.createMediaStreamSource(this.stream);
    this.processor = this.context.createScriptProcessor(2048, 1, 1);
    // Keep the processor alive without sending the user's microphone back to
    // their speakers (which caused echo/feedback in some browsers).
    this.silentSink = this.context.createGain();
    this.silentSink.gain.value = 0;
    this.processor.onaudioprocess = (event) => {
      if (this.socket?.readyState !== WebSocket.OPEN || this.muted) return;
      const samples = event.inputBuffer.getChannelData(0);
      const level = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
      if (level > 0.018) this.callbacks.onActivity('CANDIDATE');
      else if (!this.playbackSources.size) this.callbacks.onActivity('IDLE');
      const pcm = downsampleToPcm16(samples, this.context?.sampleRate ?? 48_000);
      this.socket.send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: toBase64(pcm) }] } }));
    };
    this.inputSource.connect(this.processor);
    this.processor.connect(this.silentSink);
    this.silentSink.connect(this.context.destination);
  }

  private async handleServerMessage(raw: unknown) {
    if (this.closed) return;
    let message: { setupComplete?: Record<string, never>; error?: { message?: string }; serverContent?: { interrupted?: boolean; inputTranscription?: { text?: string }; outputTranscription?: { text?: string }; modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } } };
    try { message = JSON.parse(raw instanceof Blob ? await raw.text() : String(raw)) as typeof message; } catch { return; }
    if (this.closed) return;
    if (message.error?.message) { this.fail(new Error(message.error.message)); return; }
    if (message.setupComplete) {
      try {
        if (this.connectTimeout !== null) { window.clearTimeout(this.connectTimeout); this.connectTimeout = null; }
        await this.startMic();
        if (this.closed) return;
        this.socket?.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: 'Start the interview now. Introduce yourself briefly and ask the first question.' }] }], turnComplete: true } }));
        this.resolveConnected?.(); this.resolveConnected = null; this.rejectConnected = null; this.callbacks.onStatus('live');
      } catch {
        this.fail(new Error('Microphone access is required for the live interview. Allow microphone permission and start again.'));
      }
      return;
    }
    const content = message.serverContent;
    if (!content) return;
    if (content.interrupted) {
      this.nextPlaybackTime = 0;
      this.playbackSources.forEach((source) => source.stop());
      this.playbackSources.clear();
      this.callbacks.onActivity('IDLE');
    }
    if (content.inputTranscription?.text) this.callbacks.onTranscript('CANDIDATE', content.inputTranscription.text);
    if (content.outputTranscription?.text) this.callbacks.onTranscript('INTERVIEWER', content.outputTranscription.text);
    for (const part of content.modelTurn?.parts ?? []) if (part.inlineData?.data) this.playPcm(part.inlineData.data);
  }

  private playPcm(base64: string) {
    if (!this.context) return;
    void this.context.resume();
    const binary = atob(base64); const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const pcm = new Int16Array(bytes.buffer); const audio = this.context.createBuffer(1, pcm.length, 24_000);
    const channel = audio.getChannelData(0);
    for (let index = 0; index < pcm.length; index += 1) channel[index] = pcm[index] / 0x8000;
    const source = this.context.createBufferSource(); source.buffer = audio; source.connect(this.context.destination); this.playbackSources.add(source);
    source.onended = () => { this.playbackSources.delete(source); if (this.context && this.context.currentTime >= this.nextPlaybackTime - 0.02) this.callbacks.onActivity('IDLE'); };
    const startAt = Math.max(this.context.currentTime, this.nextPlaybackTime); source.start(startAt); this.nextPlaybackTime = startAt + audio.duration; this.callbacks.onActivity('INTERVIEWER');
  }

  private fail(error: Error) {
    if (this.closed) return;
    this.rejectConnected?.(error);
    this.rejectConnected = null;
    this.close();
    this.callbacks.onError(error.message);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.rejectConnected?.(new Error('Interview connection cancelled.'));
    this.rejectConnected = null; this.resolveConnected = null;
    if (this.connectTimeout !== null) window.clearTimeout(this.connectTimeout);
    this.playbackSources.forEach((source) => source.stop()); this.playbackSources.clear();
    this.inputSource?.disconnect(); this.processor?.disconnect(); this.silentSink?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.socket?.close(); this.callbacks.onActivity('IDLE'); this.callbacks.onStatus('closed');
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.callbacks.onActivity('IDLE');
  }
}
