/**
 * timer.js
 * --------
 * A small countdown timer. Counts UP past zero rather than stopping dead,
 * since the point is 10 minutes of writing, not being cut off mid-thought —
 * it just flips into overtime and keeps going.
 */

class WriteTimer {
  /**
   * @param {number} totalSeconds
   * @param {{ onTick?: (secondsElapsed:number, secondsRemaining:number) => void,
   *           onComplete?: () => void }} handlers
   */
  constructor(totalSeconds, handlers = {}) {
    this.totalSeconds = totalSeconds;
    this.handlers = handlers;
    this.elapsed = 0;
    this.running = false;
    this.completedFired = false;
    this._interval = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._interval = setInterval(() => {
      this.elapsed += 1;
      const remaining = this.totalSeconds - this.elapsed;
      this.handlers.onTick?.(this.elapsed, remaining);
      if (remaining === 0 && !this.completedFired) {
        this.completedFired = true;
        this.handlers.onComplete?.();
      }
    }, 1000);
  }

  pause() {
    this.running = false;
    clearInterval(this._interval);
  }

  reset(totalSeconds = this.totalSeconds) {
    this.pause();
    this.totalSeconds = totalSeconds;
    this.elapsed = 0;
    this.completedFired = false;
  }

  get remaining() {
    return this.totalSeconds - this.elapsed;
  }

  get isOvertime() {
    return this.elapsed > this.totalSeconds;
  }

  static formatMMSS(totalSeconds) {
    const sign = totalSeconds < 0 ? "+" : "";
    const abs = Math.abs(totalSeconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
}

window.WriteTimer = WriteTimer;
