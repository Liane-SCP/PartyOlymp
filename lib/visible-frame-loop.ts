/** Keep the existing scene alive, but request frames only while its tab is visible. */
export function startVisibleFrameLoop(
  draw: (stamp: number) => void,
  resume: (stamp: number) => void = () => {},
) {
  let stopped = false;
  let frame = 0;

  function schedule() {
    if (!stopped && !document.hidden && !frame) frame = requestAnimationFrame(step);
  }

  function step(stamp: number) {
    frame = 0;
    if (stopped || document.hidden) return;
    draw(stamp);
    schedule();
  }

  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!stopped) {
      resume(performance.now());
      schedule();
    }
  }

  document.addEventListener("visibilitychange", visibility);
  visibility();
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    frame = 0;
    document.removeEventListener("visibilitychange", visibility);
  };
}
