/** Absolute deadlines retain fractional refresh cycles (60, 120, 144, 360 Hz). */
export class BossFrameClock {
  private next = 0;
  private interval = 0;
  ready(stamp: number, reduced = false) {
    const interval = reduced ? 80 : 1000 / 60;
    if (interval !== this.interval) {
      this.next = stamp;
      this.interval = interval;
    }
    if (stamp + 0.7 < this.next) return false;
    this.next = Math.max(this.next + interval, stamp + interval * 0.25);
    return true;
  }
}

/** Hysteresis prevents resolution pumping; transient loading stalls are ignored. */
export class BossResolution {
  scale = 1;
  private average = 0;
  private since = 0;
  private slow = 0;
  private fast = 0;
  private lastSample = 0;
  sample(cost: number, stamp: number, hasGpuTimer: boolean) {
    if (!Number.isFinite(cost) || cost <= 0) return false;
    cost = Math.min(cost, 150);
    const delta = this.lastSample
      ? Math.min(250, Math.max(0, stamp - this.lastSample))
      : 1000 / 60;
    this.lastSample = stamp;
    if (!this.since) this.since = stamp;
    this.average = this.average ? this.average * 0.94 + cost * 0.06 : cost;
    const overloaded = this.average > (hasGpuTimer ? 13 : 22);
    this.slow = overloaded ? this.slow + delta : 0;
    this.fast = this.average < (hasGpuTimer ? 8 : 17.5) ? this.fast + delta : 0;
    if (stamp - this.since < 2500) return false;
    if (this.slow >= 1200 && this.scale > 0.6) {
      this.scale = Math.max(0.6, this.scale * 0.85);
      this.reset(stamp);
      return true;
    }
    if (this.fast >= 6000 && this.scale < 1) {
      this.scale = Math.min(1, this.scale + 0.05);
      this.reset(stamp);
      return true;
    }
    return false;
  }
  private reset(stamp: number) {
    this.since = stamp;
    this.slow = this.fast = 0;
    this.average = 0;
  }
}

/** Asynchronous GPU timer. Never waits for the driver, and discards disjoint samples. */
export class BossGpuTimer {
  milliseconds: number | null = null;
  private ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private pending: WebGLQuery[] = [];
  private active: WebGLQuery | null = null;
  private frame = 0;
  constructor(private gl: WebGL2RenderingContext) {
    this.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  }
  begin() {
    if (!this.ext) return;
    const gl = this.gl;
    if (gl.getParameter(this.ext.GPU_DISJOINT_EXT)) {
      for (const q of this.pending) gl.deleteQuery(q);
      this.pending = [];
      this.milliseconds = null;
      return;
    }
    while (
      this.pending.length &&
      gl.getQueryParameter(this.pending[0], gl.QUERY_RESULT_AVAILABLE)
    ) {
      const q = this.pending.shift()!;
      const ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(q);
      this.milliseconds =
        this.milliseconds === null ? ms : this.milliseconds * 0.8 + ms * 0.2;
    }
    if (this.frame++ % 6 || this.pending.length >= 6) return;
    this.active = gl.createQuery();
    if (this.active) gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.active);
  }
  end() {
    if (this.active && this.ext) {
      this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
      this.pending.push(this.active);
      this.active = null;
    }
  }
  dispose() {
    this.end();
    for (const q of this.pending) this.gl.deleteQuery(q);
    this.pending = [];
  }
}
