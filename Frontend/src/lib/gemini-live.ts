export type LiveAudioState = { micLevel: number; sentChunks: number; receivedChunks: number; playback: string };

export type LiveInterviewCallbacks = {
  onReplayAvailable?: (available: boolean) => void;
  onAudioState?: (state: LiveAudioState) => void;
  onNotice?: (message: string) => void;
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

export function downsampleToPcm16(input: Float32Array, inputRate: number): ArrayBuffer {
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
  private outputContext: AudioContext | null = null;
  private get playbackContext() { return this.outputContext ?? this.context; }
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private silentSink: GainNode | null = null;
  private playbackSources = new Set<AudioBufferSourceNode>();
  private nextPlaybackTime = 0;
  private closed = false;
  private muted = false;
  private ready = false;
  private currentTurnAudio: AudioBuffer[] = [];
  private lastTurnAudio: AudioBuffer[] = [];
  private collectingAudio = false;
  private replaying = false;
  private cachedDuration = 0;
  private cacheTooLong = false;
  private suppressMicUntil = 0;
  private readonly handleDeviceChange = () => { void this.followSystemOutput(true); };
  private messageQueue: Promise<void> = Promise.resolve();
  private sentChunks = 0;
  private receivedChunks = 0;
  private responseTimeout: number | null = null;
  private resolveConnected: (() => void) | null = null;
  private rejectConnected: ((reason: Error) => void) | null = null;
  private connectTimeout: number | null = null;

  constructor(private readonly callbacks: LiveInterviewCallbacks) {}

  /** Must be called from a user click so browsers allow streamed AI audio. */
  async unlockAudio(): Promise<void> {
    this.context ??= new AudioContext();
    if (this.context.state !== 'running') await this.context.resume();
    if (this.outputContext && this.outputContext.state !== 'running') await this.outputContext.resume();
  }

  async connect(setup: Setup): Promise<void> {
    if (this.closed) throw new Error('This interview connection has been closed. Start a new session.');
    this.callbacks.onStatus('connecting');

    return new Promise<void>((resolve, reject) => {
      this.resolveConnected = resolve; this.rejectConnected = reject;
      this.connectTimeout = window.setTimeout(() => {
        const error = new Error('Gemini Live did not confirm the session within 12 seconds. Check Live API access, the configured model, and your network.');
        this.fail(error);
      }, 12_000);
      this.socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(setup.token)}`);
      this.socket.onopen = () => {
      this.socket?.send(JSON.stringify({ setup: {
        model: setup.model.startsWith('models/') ? setup.model : `models/${setup.model}`,
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } } },
        systemInstruction: { parts: [{ text: `You are HiPlacement Assistant, a warm, professional interviewer conducting a live ${setup.focus} interview for a ${setup.role} candidate at ${setup.difficulty} level. Introduce yourself only as “HiPlacement Assistant” or “your HiPlacement interviewer”; never mention Gemini, Google, models, or APIs. Speak naturally, ask one question at a time, listen without interrupting, and ask concise follow-up questions that depend on the candidate's answer. Do not provide the solution unless the candidate asks after the interview.` }] },
        inputAudioTranscription: {}, outputAudioTranscription: {},
        realtimeInputConfig: { automaticActivityDetection: { disabled: false, silenceDurationMs: 900 } },
      }}));
      };
      this.socket.onmessage = (event) => {
        this.messageQueue = this.messageQueue.then(() => this.handleServerMessage(event.data))
          .catch((error: unknown) => this.fail(error instanceof Error ? error : new Error('Could not process interview audio.')));
      };
      this.socket.onerror = () => this.fail(new Error('The live interview connection failed. Please check your connection and try again.'));
      this.socket.onclose = (event) => {
        if (!this.closed) {
          const reason = event.reason ? `Gemini Live closed the session: ${event.reason}` : `Gemini Live closed the session (code ${event.code}).`;
          this.fail(new Error(reason));
        }
      };
    });
  }

  /** Acquire devices before requesting a short-lived token or opening the socket. */
  async prepareMicrophone(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access requires HTTPS or localhost and a supported browser.');
    if (this.stream) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (this.closed) { stream.getTracks().forEach((track) => track.stop()); return; }
      this.stream = stream;
      navigator.mediaDevices.addEventListener?.('devicechange', this.handleDeviceChange);
      await this.followSystemOutput();
      stream.getAudioTracks().forEach((track) => { track.onended = () => this.fail(new Error('Your microphone disconnected. Reconnect it and start a new voice session.')); });
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      throw new Error(name === 'NotAllowedError' ? 'Microphone permission was denied. Allow the microphone in your browser site settings, then try again.' : name === 'NotFoundError' ? 'No microphone was found. Connect an input device and try again.' : name === 'NotReadableError' ? 'Your microphone is unavailable or in use by another application.' : 'Could not open the microphone. Check your browser and system input settings.', { cause: error });
    }
  }

  /** Never pin a physical device: Bluetooth/speakers follow the OS active output. */
  private async followSystemOutput(rebuild = false) {
    if (this.closed || !this.context) return;
    try {
      if (rebuild) {
        // A running Web Audio context can retain a disconnected Windows endpoint.
        // Rebuild only playback; leave microphone capture and the Live socket intact.
        const previous = this.outputContext;
        this.stopPlayback(); this.replaying = false; this.suppressMicUntil = 0;
        this.outputContext = new AudioContext();
        if (previous && previous.state !== 'closed') void previous.close().catch(() => {});
        this.callbacks.onReplayAvailable?.(!this.collectingAudio && !!this.lastTurnAudio.length);
        this.callbacks.onNotice?.('Audio output reconnected. Use Repeat question to hear the last completed question.');
      }
      const context = this.playbackContext as AudioContext & { setSinkId?: (id: string) => Promise<void> };
      await context.setSinkId?.('');
      if (!this.closed && context.state !== 'running') await context.resume();
    } catch {
      this.callbacks.onNotice?.('Audio follows your system output. If it is silent after changing devices, check the system volume and try Test speaker.');
    }
  }

  private async startMic(): Promise<void> {
    await this.prepareMicrophone();
    if (this.closed || !this.stream) return;
    await this.unlockAudio();
    if (this.closed || !this.context) return;
    this.inputSource = this.context.createMediaStreamSource(this.stream);
    this.silentSink = this.context.createGain();
    this.silentSink.gain.value = 0;
    if (this.context.audioWorklet) {
      await this.context.audioWorklet.addModule(new URL('./pcm-capture.worklet.js?no-inline', import.meta.url).href);
      if (this.closed) return;
      const capture = new AudioWorkletNode(this.context, 'interview-pcm-capture');
      capture.port.onmessage = (event: MessageEvent<Float32Array>) => this.sendMicSamples(event.data);
      this.processor = capture;
    } else {
      const capture = this.context.createScriptProcessor(2048, 1, 1);
      capture.onaudioprocess = (event) => this.sendMicSamples(event.inputBuffer.getChannelData(0));
      this.processor = capture;
    }
    this.inputSource.connect(this.processor);
    this.processor.connect(this.silentSink);
    this.silentSink.connect(this.context.destination);
  }

  private sendMicSamples(samples: Float32Array) {
    if (this.closed || !this.ready || this.socket?.readyState !== WebSocket.OPEN || this.muted) return;
    // Local replay must not be heard by Gemini as a new candidate answer.
    if (this.replaying || (this.playbackContext?.currentTime ?? 0) < this.suppressMicUntil) samples = new Float32Array(samples.length);
    const level = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    if (level > 0.018) this.callbacks.onActivity('CANDIDATE');
    else if (!this.playbackSources.size) this.callbacks.onActivity('IDLE');
    const pcm = downsampleToPcm16(samples, this.context?.sampleRate ?? 48_000);
    this.socket.send(JSON.stringify({ realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: toBase64(pcm) } } }));
    this.sentChunks += 1;
    if (this.sentChunks % 4 === 0) this.reportAudio(level);
  }

  private reportAudio(level = 0) {
    this.callbacks.onAudioState?.({ micLevel: Math.min(1, level * 8), sentChunks: this.sentChunks, receivedChunks: this.receivedChunks, playback: this.playbackContext?.state ?? 'unavailable' });
  }

  async repeatQuestion() {
    if (this.closed || !this.ready || this.replaying) return;
    if (this.collectingAudio || !this.lastTurnAudio.length) {
      this.callbacks.onNotice?.('Wait for the interviewer to finish a question before replaying it.');
      return;
    }
    this.replaying = true;
    this.callbacks.onReplayAvailable?.(false);
    try {
      await this.unlockAudio();
      if (this.closed || !this.replaying || this.collectingAudio) return;
      this.stopPlayback();
      for (const audio of this.lastTurnAudio) this.scheduleAudio(audio);
      this.suppressMicUntil = this.nextPlaybackTime + 0.25;
      this.callbacks.onNotice?.('Replaying the last question. Your microphone resumes after playback.');
    } catch (error) {
      this.replaying = false;
      this.callbacks.onReplayAvailable?.(!this.collectingAudio && !!this.lastTurnAudio.length);
      throw error;
    }
  }

  private stopPlayback() {
    this.playbackSources.forEach((source) => { source.onended = null; source.stop(); source.disconnect(); });
    this.playbackSources.clear();
    this.nextPlaybackTime = 0;
  }

  private scheduleAudio(audio: AudioBuffer) {
    if (!this.playbackContext || this.closed) return;
    const source = this.playbackContext.createBufferSource();
    source.buffer = audio; source.connect(this.playbackContext.destination); this.playbackSources.add(source);
    source.onended = () => {
      source.disconnect(); this.playbackSources.delete(source);
      if (!this.playbackSources.size) {
        this.replaying = false;
        this.callbacks.onReplayAvailable?.(!this.collectingAudio && !!this.lastTurnAudio.length);
        this.callbacks.onActivity('IDLE');
      }
    };
    const startAt = Math.max(this.playbackContext.currentTime, this.nextPlaybackTime);
    source.start(startAt); this.nextPlaybackTime = startAt + audio.duration;
    this.callbacks.onActivity('INTERVIEWER');
  }

  private watchForAudio() {
    if (this.responseTimeout !== null) window.clearTimeout(this.responseTimeout);
    const received = this.receivedChunks;
    this.responseTimeout = window.setTimeout(() => {
      if (!this.closed && received === this.receivedChunks) this.callbacks.onNotice?.('Connected, but no interviewer audio has arrived. If the speaker test works, reconnect the interview to retry the voice response.');
    }, 15_000);
  }

  async testSpeaker() {
    await this.unlockAudio();
    if (!this.playbackContext || this.closed) return;
    const oscillator = this.playbackContext.createOscillator();
    const gain = this.playbackContext.createGain();
    oscillator.frequency.value = 440;
    gain.gain.setValueAtTime(0.12, this.playbackContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.playbackContext.currentTime + 0.3);
    oscillator.connect(gain); gain.connect(this.playbackContext.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(); oscillator.stop(this.playbackContext.currentTime + 0.3);
    this.reportAudio();
  }

  private async handleServerMessage(raw: unknown) {
    if (this.closed) return;
    let message: { setupComplete?: Record<string, never>; error?: { message?: string }; serverContent?: { turnComplete?: boolean; interrupted?: boolean; inputTranscription?: { text?: string }; outputTranscription?: { text?: string }; modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } } };
    try { message = JSON.parse(raw instanceof Blob ? await raw.text() : raw instanceof ArrayBuffer ? new TextDecoder().decode(raw) : String(raw)) as typeof message; } catch { throw new Error('The voice service returned an unreadable message. Please reconnect.'); }
    if (this.closed) return;
    if (message.error?.message) { this.fail(new Error(message.error.message)); return; }
    if (message.setupComplete) {
      try {
        if (this.connectTimeout !== null) { window.clearTimeout(this.connectTimeout); this.connectTimeout = null; }
        await this.startMic();
        if (this.closed) return;
        this.ready = true;
        this.socket?.send(JSON.stringify({ realtimeInput: { text: 'Start the interview now. Introduce yourself briefly aloud and ask the first question.' } }));
        this.watchForAudio();
        this.resolveConnected?.(); this.resolveConnected = null; this.rejectConnected = null; this.callbacks.onStatus('live');
      } catch (error) {
        this.fail(error instanceof Error ? error : new Error('Could not initialize interview audio.'));
      }
      return;
    }
    const content = message.serverContent;
    if (!content) return;
    if (content.interrupted) {
      this.stopPlayback(); this.replaying = false;
      this.collectingAudio = false; this.currentTurnAudio = []; this.lastTurnAudio = [];
      this.callbacks.onReplayAvailable?.(false);
      this.callbacks.onActivity('IDLE');
    }
    if (content.inputTranscription?.text) this.callbacks.onTranscript('CANDIDATE', content.inputTranscription.text);
    if (content.outputTranscription?.text) this.callbacks.onTranscript('INTERVIEWER', content.outputTranscription.text);
    for (const part of content.modelTurn?.parts ?? []) {
      if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/pcm')) {
        await this.playPcm(part.inlineData.data, Number(part.inlineData.mimeType.match(/rate=(\d+)/)?.[1] ?? 24_000));
      }
    }
    if (content.turnComplete && this.collectingAudio) {
      this.lastTurnAudio = this.cacheTooLong ? [] : this.currentTurnAudio;
      this.currentTurnAudio = []; this.collectingAudio = false;
      this.callbacks.onReplayAvailable?.(!this.replaying && !!this.lastTurnAudio.length);
    }
  }

  private async playPcm(base64: string, sampleRate: number) {
    if (!this.playbackContext) return;
    await this.playbackContext.resume();
    if (this.closed) return;
    if (this.playbackContext.state !== 'running') throw new Error('Speaker playback is blocked. Enable audio in your browser and reconnect.');
    this.receivedChunks += 1;
    if (this.responseTimeout !== null) { window.clearTimeout(this.responseTimeout); this.responseTimeout = null; }
    const binary = atob(base64); const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const pcm = new Int16Array(bytes.buffer); const audio = this.playbackContext.createBuffer(1, pcm.length, sampleRate);
    const channel = audio.getChannelData(0);
    for (let index = 0; index < pcm.length; index += 1) channel[index] = pcm[index] / 0x8000;
    if (this.replaying) { this.stopPlayback(); this.replaying = false; this.suppressMicUntil = 0; }
    if (!this.collectingAudio) {
      this.collectingAudio = true; this.currentTurnAudio = []; this.lastTurnAudio = [];
      this.cachedDuration = 0; this.cacheTooLong = false;
      this.callbacks.onReplayAvailable?.(false);
    }
    this.cachedDuration += audio.duration;
    // Bound memory to one short interviewer turn, never the whole session.
    if (this.cachedDuration > 120) { this.cacheTooLong = true; this.currentTurnAudio = []; }
    if (!this.cacheTooLong) this.currentTurnAudio.push(audio);
    this.scheduleAudio(audio); this.reportAudio();
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
    this.closed = true; this.ready = false;
    navigator.mediaDevices?.removeEventListener?.('devicechange', this.handleDeviceChange);
    if (this.responseTimeout !== null) window.clearTimeout(this.responseTimeout);
    this.rejectConnected?.(new Error('Interview connection cancelled.'));
    this.rejectConnected = null; this.resolveConnected = null;
    if (this.connectTimeout !== null) window.clearTimeout(this.connectTimeout);
    this.stopPlayback(); this.currentTurnAudio = []; this.lastTurnAudio = [];
    this.replaying = false; this.callbacks.onReplayAvailable?.(false);
    this.inputSource?.disconnect(); this.processor?.disconnect(); this.silentSink?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.outputContext && this.outputContext.state !== 'closed') void this.outputContext.close().catch(() => {});
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.socket?.close(); this.callbacks.onActivity('IDLE'); this.callbacks.onStatus('closed');
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      if (this.ready && this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      this.callbacks.onActivity('IDLE'); this.reportAudio();
    }
  }
}
