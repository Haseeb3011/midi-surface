/*
  Tap-tempo helper.

  Tracks the last N tap timestamps; current BPM is computed from the average
  inter-tap interval over that window. Taps older than `staleMs` are dropped so
  resuming after a pause starts fresh.
*/

const HISTORY = 4;
const STALE_MS = 2000;

export class TapTempo {
  private taps: number[] = [];

  tap(now: number = performance.now()): number | null {
    if (this.taps.length > 0 && now - this.taps[this.taps.length - 1]! > STALE_MS) {
      this.taps = [];
    }
    this.taps.push(now);
    if (this.taps.length > HISTORY) this.taps.shift();
    if (this.taps.length < 2) return null;
    const intervals: number[] = [];
    for (let i = 1; i < this.taps.length; i++) {
      intervals.push(this.taps[i]! - this.taps[i - 1]!);
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avg <= 0) return null;
    return Math.max(20, Math.min(300, Math.round(60000 / avg)));
  }

  reset(): void {
    this.taps = [];
  }
}
