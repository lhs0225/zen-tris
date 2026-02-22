import type { GameEvent } from '../types/game';

// --- Web Audio API 합성음 매니저 ---
// 선적(禪的) 분위기: 목탁, 풍경, 범종, 법고 등을 합성음으로 재현

type OscType = OscillatorType;

interface SynthConfig {
  type: OscType;
  frequency: number;
  duration: number;
  gain: number;
  decay?: number;      // exponential decay 시간
  detune?: number;
  harmonics?: { freq: number; gain: number; type?: OscType }[];
}

class SoundManager {
  private static instance: SoundManager;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  // 첫 사용자 인터랙션 후 초기화 (브라우저 오디오 정책)
  private ensureContext(): AudioContext | null {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContext();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
        this.masterGain.connect(this.audioCtx.destination);
        this.isInitialized = true;
      } catch {
        return null;
      }
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // 기본 합성음 재생
  private playSynth(config: SynthConfig): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;

    // 메인 오실레이터
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = config.type;
    osc.frequency.value = config.frequency;
    if (config.detune) osc.detune.value = config.detune;

    gain.gain.setValueAtTime(config.gain, now);
    if (config.decay) {
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.decay);
    } else {
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + config.duration);

    // 하모닉스 (배음)
    if (config.harmonics) {
      config.harmonics.forEach(h => {
        const hOsc = ctx.createOscillator();
        const hGain = ctx.createGain();
        hOsc.type = h.type || config.type;
        hOsc.frequency.value = h.freq;
        hGain.gain.setValueAtTime(h.gain, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + (config.decay || config.duration));
        hOsc.connect(hGain);
        hGain.connect(this.masterGain!);
        hOsc.start(now);
        hOsc.stop(now + config.duration);
      });
    }
  }

  // --- 개별 사운드 ---

  // 피스 이동: 나무 블록 "탁"
  private playMove(): void {
    this.playSynth({
      type: 'sine',
      frequency: 200,
      duration: 0.08,
      gain: 0.15,
      decay: 0.06,
    });
  }

  // 피스 회전: 염주 "또르르"
  private playRotate(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    [300, 400, 520].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.1);
    });
  }

  // 피스 착지: 목탁 "똑"
  private playLock(): void {
    this.playSynth({
      type: 'triangle',
      frequency: 150,
      duration: 0.3,
      gain: 0.25,
      decay: 0.2,
      harmonics: [
        { freq: 300, gain: 0.08 },
        { freq: 450, gain: 0.04 },
      ],
    });
  }

  // 라인 클리어: 풍경(風磬) "땡"
  private playLineClear(count: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    if (count >= 4) {
      // 법고(큰 북) "둥" - 4줄 동시
      this.playDrumBeat();
      return;
    }

    const now = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      const delay = i * 0.12;
      const baseFreq = 800 + i * 100;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = baseFreq;
      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.7);

      // 배음
      const h1 = ctx.createOscillator();
      const hGain = ctx.createGain();
      h1.type = 'sine';
      h1.frequency.value = baseFreq * 2;
      hGain.gain.setValueAtTime(0.06, now + delay);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
      h1.connect(hGain);
      hGain.connect(this.masterGain!);
      h1.start(now + delay);
      h1.stop(now + delay + 0.5);
    }
  }

  // 법고(法鼓): 장엄한 "둥"
  private playDrumBeat(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;

    // 저음 베이스
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, now);
    bass.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    bassGain.gain.setValueAtTime(0.4, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    bass.connect(bassGain);
    bassGain.connect(this.masterGain!);
    bass.start(now);
    bass.stop(now + 1.3);

    // 노이즈 어택 (북 치는 소리)
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start(now);
  }

  // 사천왕 소환: 법고 + 높은 종소리
  private playGuardianSummon(): void {
    this.playDrumBeat();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    // 높은 종소리 (지연 후)
    setTimeout(() => {
      this.playSynth({
        type: 'sine',
        frequency: 600,
        duration: 1.5,
        gain: 0.2,
        decay: 1.2,
        harmonics: [
          { freq: 1200, gain: 0.08 },
          { freq: 1800, gain: 0.03 },
        ],
      });
    }, 200);
  }

  // 윤회: 범종 "뎅~"
  private playSamsara(): void {
    this.playSynth({
      type: 'sine',
      frequency: 120,
      duration: 3.0,
      gain: 0.35,
      decay: 2.5,
      harmonics: [
        { freq: 240, gain: 0.15 },
        { freq: 360, gain: 0.08 },
        { freq: 480, gain: 0.04 },
        { freq: 600, gain: 0.02 },
      ],
    });
  }

  // 열반: 종 + 풍경 풀세트
  private playNirvana(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    // 범종 한 번
    this.playSamsara();

    // 풍경 연타 (지연)
    const bellFreqs = [800, 1000, 1200, 1400, 1600];
    bellFreqs.forEach((freq, i) => {
      setTimeout(() => {
        this.playSynth({
          type: 'sine',
          frequency: freq,
          duration: 1.5,
          gain: 0.12,
          decay: 1.2,
          harmonics: [{ freq: freq * 2, gain: 0.04 }],
        });
      }, 500 + i * 300);
    });
  }

  // 게임오버: 범종 3타 (점점 느리게)
  private playGameOver(): void {
    [0, 800, 1800].forEach((delay, i) => {
      setTimeout(() => {
        this.playSynth({
          type: 'sine',
          frequency: 100 - i * 10,
          duration: 2.5,
          gain: 0.3 - i * 0.05,
          decay: 2.0,
          harmonics: [
            { freq: (100 - i * 10) * 2, gain: 0.1 },
            { freq: (100 - i * 10) * 3, gain: 0.05 },
          ],
        });
      }, delay);
    });
  }

  // 자비 사용: 목어(木魚) "톡톡톡"
  private playMercy(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    [0, 80, 160].forEach((delay) => {
      setTimeout(() => {
        this.playSynth({
          type: 'triangle',
          frequency: 250,
          duration: 0.12,
          gain: 0.2,
          decay: 0.08,
        });
      }, delay);
    });
  }

  // 자비 실패: 낮은 둔탁한 소리
  private playMercyFail(): void {
    this.playSynth({
      type: 'sine',
      frequency: 100,
      duration: 0.15,
      gain: 0.15,
      decay: 0.1,
    });
  }

  // 카르마 경고: 점점 빨라지는 목탁
  private playKarmaWarning(): void {
    this.playSynth({
      type: 'triangle',
      frequency: 180,
      duration: 0.2,
      gain: 0.15,
      decay: 0.15,
    });
  }

  // --- 공개 API ---

  playEvent(event: GameEvent): void {
    if (this.isMuted) return;

    switch (event.type) {
      case 'PIECE_MOVE': this.playMove(); break;
      case 'PIECE_ROTATE': this.playRotate(); break;
      case 'PIECE_LOCK': this.playLock(); break;
      case 'LINE_CLEAR': this.playLineClear(event.count); break;
      case 'GUARDIAN_SUMMON': this.playGuardianSummon(); break;
      case 'SAMSARA': this.playSamsara(); break;
      case 'NIRVANA': this.playNirvana(); break;
      case 'GAME_OVER': this.playGameOver(); break;
      case 'MERCY_USE': this.playMercy(); break;
      case 'MERCY_FAIL': this.playMercyFail(); break;
      case 'KARMA_WARNING': this.playKarmaWarning(); break;
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.6;
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // 첫 사용자 인터랙션에서 호출
  warmup(): void {
    this.ensureContext();
  }
}

export default SoundManager;
