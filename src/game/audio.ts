import { type CombatantId } from "./data.ts";
/** Original Web Audio score and effects; no samples, network or autoplay. */
export class CombatAudio {
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private paused = false;
  private lastHit = 0;
  enabled = false;
  musicEnabled = false;
  private async ready() {
    this.context ??= new AudioContext();
    await this.context.resume();
  }
  async setEnabled(value: boolean) {
    this.enabled = value;
    if (value)
      try {
        await this.ready();
        this.play("select");
      } catch {
        this.enabled = false;
      }
  }
  async setMusic(value: boolean) {
    this.musicEnabled = value;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (value)
      try {
        await this.ready();
        this.timer = setInterval(() => this.musicBeat(), 300);
      } catch {
        this.musicEnabled = false;
      }
  }
  pauseMusic(value: boolean) {
    this.paused = value;
  }
  private tone(
    frequency: number,
    time: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator(),
      gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  private musicBeat() {
    if (!this.context || !this.musicEnabled || this.paused) return;
    const now = this.context.currentTime,
      notes = [164.81, 196, 246.94, 293.66, 164.81, 220, 261.63, 329.63],
      index = this.beat++ % 16;
    if (index % 4 === 0) {
      this.tone(notes[Math.floor(index / 2)] / 2, now, 0.75, 0.027, "triangle");
      this.tone(notes[Math.floor(index / 2)], now, 0.8, 0.014);
    }
    this.tone(notes[index % 8] * 2, now, 0.24, 0.01, "sine");
  }
  ability(id: CombatantId, ultimate: boolean) {
    if (!this.enabled || !this.context || this.context.state !== "running")
      return;
    const pitches: Record<string, number[]> = {
      vector: [330, 660, 990],
      rook: [82, 65, 49],
      nyx: [740, 1109, 1480],
      ember: [220, 440, 880],
      solis: [147, 220, 294],
      astra: [523, 784, 659],
    };
    (pitches[id] ?? [130, 196, 260]).forEach((frequency, i) =>
      this.tone(
        frequency * (ultimate ? 0.75 : 1),
        this.context!.currentTime + i * 0.05,
        ultimate ? 0.4 : 0.2,
        0.03,
        id === "rook" ? "triangle" : "sine",
      ),
    );
  }
  play(
    kind:
      | "ready"
      | "select"
      | "hit"
      | "parry"
      | "guard"
      | "ko"
      | "jump"
      | "charge"
      | "win"
      | "lose",
  ) {
    if (!this.enabled || !this.context || this.context.state !== "running")
      return;
    const now = this.context.currentTime;
    if (kind === "hit" && now - this.lastHit < 0.05) return;
    if (kind === "hit") this.lastHit = now;
    const tones =
      kind === "win" || kind === "ready"
        ? [392, 494, 587, 784]
        : kind === "lose"
          ? [220, 174, 130]
          : kind === "parry"
            ? [880, 1320, 1760]
            : kind === "ko"
              ? [110, 70, 45]
              : [
                  kind === "hit"
                    ? 100
                    : kind === "guard"
                      ? 360
                      : kind === "jump"
                        ? 490
                        : kind === "charge"
                          ? 220
                          : 660,
                ];
    tones.forEach((frequency, i) =>
      this.tone(
        frequency,
        now + i * 0.065,
        kind === "ko" ? 0.32 : 0.18,
        kind === "jump" ? 0.025 : 0.048,
        kind === "hit" || kind === "ko" ? "triangle" : "sine",
      ),
    );
  }
}
