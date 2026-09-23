/** Small original synthesized effects. Created only after a user gesture; silent by default. */
export class CombatAudio {
  private context: AudioContext | null = null;
  enabled = false;
  async setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      try {
        this.context ??= new AudioContext();
        await this.context.resume();
        this.play("select");
      } catch {
        this.enabled = false;
      }
    }
  }
  play(kind: "select" | "reveal" | "hit" | "guard" | "win" | "lose") {
    if (!this.enabled || !this.context || this.context.state !== "running")
      return;
    const context = this.context;
    const tones =
      kind === "win"
        ? [392, 494, 587]
        : kind === "lose"
          ? [220, 174, 130]
          : [
              kind === "hit"
                ? 110
                : kind === "guard"
                  ? 440
                  : kind === "reveal"
                    ? 330
                    : 660,
            ];
    tones.forEach((frequency, i) => {
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        time = context.currentTime + i * 0.12;
      oscillator.type = kind === "hit" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.frequency.exponentialRampToValueAtTime(
        kind === "hit" ? 45 : frequency * 0.8,
        time + 0.15,
      );
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.045, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.22);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }
}
