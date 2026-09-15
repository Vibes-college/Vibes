import { readLimited } from '../../lib/media/read';

/** Keep only the current clip, and fetch a bounded seekable copy only when needed. */
export function recordingSeek(video: HTMLVideoElement, ready: () => void, failed: () => void) {
  let pending: number | undefined;
  let request: AbortController | undefined;
  let objectUrl: string | undefined;
  let disposed = false;

  async function apply() {
    if (disposed || pending === undefined || video.readyState < 1 || request) return;
    const target = pending * video.duration;
    // Some static hosts expose a duration but no byte ranges; native seeks then
    // silently clamp to zero. Ordinary playback does not need this extra fetch.
    if (
      !objectUrl &&
      target > 0 &&
      (!video.seekable.length || video.seekable.end(video.seekable.length - 1) < target)
    ) {
      const active = new AbortController();
      request = active;
      try {
        const response = await fetch(video.currentSrc, { signal: active.signal });
        const blob = await readLimited(response, 2 * 1024 * 1024, 'video/mp4');
        if (active.signal.aborted || disposed) return;
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
        video.load();
      } catch {
        if (!active.signal.aborted && !disposed) {
          pending = undefined;
          failed();
        }
      } finally {
        if (request === active) request = undefined;
      }
      return;
    }
    video.currentTime = target;
    pending = undefined;
    ready();
  }
  const resume = () => void apply();
  video.addEventListener('loadedmetadata', resume);
  video.addEventListener('canplay', resume);

  function reset(fraction?: number) {
    request?.abort();
    request = undefined;
    pending = fraction;
    if (objectUrl) {
      video.removeAttribute('src');
      URL.revokeObjectURL(objectUrl);
      objectUrl = undefined;
    }
  }
  return {
    get pending() {
      return pending !== undefined;
    },
    get fraction() {
      return pending ?? (video.duration ? video.currentTime / video.duration : 0);
    },
    seek(fraction: number) {
      pending = Math.min(1, Math.max(0, fraction));
      void apply();
    },
    reset,
    dispose() {
      disposed = true;
      reset();
      video.removeEventListener('loadedmetadata', resume);
      video.removeEventListener('canplay', resume);
      // Detaching a paused element alone can retain its native media request.
      // An empty src ends it without removing React's responsive source nodes.
      video.setAttribute('src', '');
      video.load();
    },
  };
}
