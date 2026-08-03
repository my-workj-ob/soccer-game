/**
 * Zero-Dependency Web Audio Synthesizer & Stadium Atmosphere Engine
 * Produces authentic football sounds: Referee trill whistles, ball boot strikes, goalpost rings,
 * and adaptive stadium crowd roaring using dynamic pink noise filters.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientNoiseNode: AudioBufferSourceNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private isStadiumRunning: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Silently await user audio interaction policy
      });
    }
    return this.ctx;
  }

  /**
   * Toggles silence for all audio events
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGainNode && this.ctx) {
      this.ambientGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Plays realistic high-frequency referee whistles with acoustic modulation trills
   * @param pattern - type of whistle: 'short' (foul/throw-in), 'double' (half-time/var), 'long' (full-time/goal)
   */
  public playRefereeWhistle(pattern: 'short' | 'double' | 'long' = 'short') {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const playTone = (startDelay: number, duration: number, startFreq = 2500, endFreq = 2650) => {
      const startTime = ctx.currentTime + startDelay;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      // Trill modulation (pea bouncing inside whistle chamber)
      lfo.frequency.setValueAtTime(45, startTime);
      lfoGain.gain.setValueAtTime(150, startTime);
      lfo.connect(lfoGain);

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(startFreq, startTime);
      osc1.frequency.linearRampToValueAtTime(endFreq, startTime + duration * 0.5);
      osc2.frequency.setValueAtTime(startFreq + 50, startTime);

      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      // ADSR Envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
      gain.gain.setValueAtTime(0.25, startTime + duration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      lfo.start(startTime);
      osc1.start(startTime);
      osc2.start(startTime);
      lfo.stop(startTime + duration);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    if (pattern === 'short') {
      playTone(0, 0.35);
    } else if (pattern === 'double') {
      playTone(0, 0.25);
      playTone(0.35, 0.5);
    } else if (pattern === 'long') {
      playTone(0, 0.2);
      playTone(0.3, 0.3);
      playTone(0.7, 1.1, 2400, 2750);
    }
  }

  /**
   * Simulates the acoustic thrum and snap of a soccer boot kicking the ball
   * @param power - impact power multiplier from 0.0 to 1.0
   */
  public playBallKick(power: number = 0.5) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Low-end thud frequency
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 85 + (1 - power) * 40;
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(25, startTime + 0.15);
    osc.connect(gain);

    // High-frequency leather impact noise snap
    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    noise.connect(filter);
    filter.connect(gain);

    // Dynamic gain based on striking force
    const maxVolume = 0.2 + power * 0.45;
    gain.gain.setValueAtTime(maxVolume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

    osc.start(startTime);
    noise.start(startTime);
    osc.stop(startTime + 0.16);
  }

  /**
   * Simulates the high-pitch metallic resonance of the football impacting the goalpost crossbar
   */
  public playGoalpostHit() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Metallic overtone chords
    const frequencies = [820, 1430, 2450, 3800];
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 25, startTime);
      
      oscGain.gain.setValueAtTime(0.15, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });

    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.65);
  }

  /**
   * Triggers realistic stadium reactions based on match momentum
   */
  public playCrowdReaction(type: 'miss' | 'goal' | 'cheer' | 'boo') {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const duration = type === 'goal' ? 5.5 : 3.0;
    const startTime = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = noiseBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      // Pink noise synthesis algorithm (human voices blending in large acoustics)
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
        b6 = white * 0.115926;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(type === 'boo' ? 380 : 950, startTime);
    filter.Q.setValueAtTime(type === 'goal' ? 0.6 : 1.2, startTime);

    const gain = ctx.createGain();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Dynamic Volume Envelope
    const maxVol = type === 'goal' ? 0.45 : type === 'miss' ? 0.35 : 0.25;
    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(maxVol, startTime + (type === 'miss' ? 0.2 : 0.6));
    gain.gain.setValueAtTime(maxVol * 0.85, startTime + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.005, startTime + duration);

    source.start(startTime);
    source.stop(startTime + duration);
  }

  /**
   * Starts a gentle continuous background stadium atmosphere murmur loop
   */
  public startStadiumLoop() {
    if (this.isStadiumRunning || typeof window === 'undefined') return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isStadiumRunning = true;
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 0.04;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.isMuted ? 0 : 0.07, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(0);
    this.ambientNoiseNode = source;
    this.ambientGainNode = gain;
  }

  public stopStadiumLoop() {
    if (this.ambientNoiseNode) {
      try {
        this.ambientNoiseNode.stop();
        this.ambientNoiseNode.disconnect();
      } catch {
        // Safe disposal
      }
      this.ambientNoiseNode = null;
      this.isStadiumRunning = false;
    }
  }
}

export const audioEngine = new SoundEngine();
