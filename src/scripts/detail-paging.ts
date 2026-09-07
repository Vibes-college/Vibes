import { detailGestureExclusions } from './detail-gestures';

// Only the cover/reading boundary behaves like a page turn; article scrolling stays native.
export function installDetailPaging(root: HTMLElement, signal: AbortSignal) {
  const reading = root.querySelector<HTMLElement>('#reading')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let suppressUntil = 0;
  let gesture:
    | {
        x: number;
        y: number;
        top: number;
        cover: number;
        reading: number;
        fromCover: boolean;
        dy: number;
        locked: boolean;
      }
    | undefined;

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    gesture = undefined;
    delete root.dataset.paging;
  }
  function finish(commit: boolean) {
    const current = gesture;
    gesture = undefined;
    if (!current?.locked) return;
    const target = current.fromCover === commit ? current.reading : current.cover;
    const from = scrollY;
    const start = performance.now();
    suppressUntil = start + 500;
    // Keep CSS snapping disabled until the deliberate page turn has settled.
    function animate(now: number) {
      const progress = reduced.matches ? 1 : Math.min(1, (now - start) / 320);
      window.scrollTo({
        top: from + (target - from) * (1 - (1 - progress) ** 3),
        behavior: 'instant',
      });
      if (progress < 1) frame = requestAnimationFrame(animate);
      else clear();
    }
    frame = requestAnimationFrame(animate);
  }
  root.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length !== 1) {
        finish(false);
        return;
      }
      clear();
      if (window.getSelection()?.toString()) return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest(detailGestureExclusions)) return;
      const point = event.touches[0];
      if (point.clientX < 24 || point.clientX > innerWidth - 24) return;
      const start = reading.getBoundingClientRect().top + scrollY;
      // A taller cover can scroll naturally until its last viewport; never hide cover content.
      const cover = Math.max(0, start - innerHeight);
      if (scrollY < cover - 2 || scrollY > start + 2) return;
      gesture = {
        x: point.clientX,
        y: point.clientY,
        top: scrollY,
        cover,
        reading: start,
        fromCover: scrollY < (cover + start) / 2,
        dy: 0,
        locked: false,
      };
    },
    { passive: true, signal },
  );
  root.addEventListener(
    'touchmove',
    (event) => {
      if (!gesture) return;
      if (event.touches.length !== 1 || window.getSelection()?.toString()) {
        finish(false);
        return;
      }
      const point = event.touches[0];
      const dx = point.clientX - gesture.x;
      const dy = point.clientY - gesture.y;
      if (!gesture.locked) {
        if (Math.abs(dx) >= 14 && Math.abs(dx) >= Math.abs(dy) * 1.4) {
          gesture = undefined;
          return;
        }
        // Hold small ambiguous movement until an axis is clear, before Safari starts panning.
        if (Math.abs(dy) < Math.max(8, Math.abs(dx) * 1.2)) {
          if (event.cancelable) event.preventDefault();
          return;
        }
        // Pull-to-refresh on the cover and forward article reading belong to Safari.
        if ((gesture.fromCover && dy > 0) || (!gesture.fromCover && dy < 0) || !event.cancelable) {
          gesture = undefined;
          return;
        }
        gesture.locked = true;
        root.dataset.paging = '';
      }
      event.preventDefault();
      gesture.dy = dy;
      window.scrollTo({
        top: Math.max(gesture.cover, Math.min(gesture.reading, gesture.top - dy)),
        behavior: 'instant',
      });
    },
    { passive: false, signal },
  );
  root.addEventListener(
    'touchend',
    (event) => {
      if (!gesture) return;
      if (gesture.locked && event.cancelable) event.preventDefault();
      const distance = gesture.fromCover ? -gesture.dy : gesture.dy;
      finish(distance >= Math.min(120, (gesture.reading - gesture.cover) * 0.18));
    },
    { passive: false, signal },
  );
  root.addEventListener('touchcancel', () => finish(false), { signal });
  root.addEventListener(
    'click',
    (event) => {
      if (performance.now() < suppressUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true, signal },
  );
  signal.addEventListener('abort', clear, { once: true });
}
