import { isMediaUrl, mediaLimits } from '../config/media';
import { mediaMessages } from '../lib/media/messages';

export interface MediaController {
  root: HTMLElement;
  auto: boolean;
  visible: boolean;
  userPaused: boolean;
  playing: boolean;
  pending: boolean;
  manual: boolean;
  play: (manual: boolean) => void;
  pause: (user?: boolean) => void;
  dispose: () => void;
}
export function createMediaPlayer(root: HTMLElement, pageSignal: AbortSignal): MediaController {
  const lifetime = new AbortController();
  const signal = lifetime.signal;
  const t = mediaMessages[root.dataset.locale === 'en' ? 'en' : 'zh'];
  const element = root.querySelector<HTMLMediaElement>('video, audio');
  const image = root.querySelector<HTMLImageElement>('[data-media-image]');
  const button = root.querySelector<HTMLButtonElement>('[data-media-toggle]');
  const status = root.querySelector<HTMLElement>('[data-media-status]')!;
  const animated = root.dataset.kind === 'animation';
  const sources = JSON.parse(root.dataset.sources || '[]') as { src: string; type: string }[];
  if (sources.some((source) => !isMediaUrl(source.src))) throw new Error('Invalid media source');
  let generation = 0;
  let attached = false;
  let wanted = false;
  let disposed = false;
  let pendingSeek: number | undefined;
  let pausedSeek = false;
  let seekPauseTimer: ReturnType<typeof setTimeout> | undefined;
  let seekRequest: AbortController | undefined;
  let objectUrl: string | undefined;
  let failedSources = 0;
  let poster = root.dataset.poster || image?.getAttribute('src') || '';
  let dialog: HTMLDialogElement | undefined;
  const imageSrcset = image?.getAttribute('srcset') || image?.dataset.srcset;
  const controller: MediaController = {
    root,
    auto: root.hasAttribute('data-auto'),
    visible: false,
    userPaused: false,
    playing: false,
    pending: false,
    manual: false,
    play,
    pause,
    dispose,
  };
  function alive() {
    return (
      !disposed && !signal.aborted && root.isConnected && controller.visible && !document.hidden
    );
  }
  function display(playing: boolean) {
    controller.playing = playing;
    root.classList.toggle('is-playing', playing);
    if (button) {
      button.textContent = playing ? t.pause : root.dataset.kind === 'audio' ? t.listen : t.play;
      button.setAttribute('aria-label', button.textContent);
      button.setAttribute('aria-pressed', String(playing));
    }
  }
  function announceManual() {
    root.dispatchEvent(new CustomEvent('media:manual', { bubbles: true }));
  }
  function attach() {
    if (!element || attached) return;
    for (const value of sources) {
      const source = document.createElement('source');
      source.src = value.src;
      source.type = value.type;
      source.addEventListener(
        'error',
        () => {
          if (++failedSources >= sources.length && wanted) failed();
        },
        { signal },
      );
      element.append(source);
    }
    for (const track of element.querySelectorAll<HTMLTrackElement>('track[data-src]'))
      track.src = track.dataset.src!;
    failedSources = 0;
    attached = true;
    root.classList.add('has-source');
    element.load();
  }
  function clearSeekPause() {
    clearTimeout(seekPauseTimer);
    seekPauseTimer = undefined;
    pausedSeek = false;
  }
  function settleSeekPause() {
    clearTimeout(seekPauseTimer);
    seekPauseTimer = undefined;
    if (!pausedSeek || wanted || !element?.paused || element.seeking) return;
    const ticket = generation;
    // WebKit can emit play after seeked. Require a quiet paused interval before
    // accepting native play again; the explicit Vibes play button unlocks at once.
    // Native controls expose no input intent, so clicks inside this short window
    // may need repeating. This is a bounded compatibility guard, not a UA guarantee.
    seekPauseTimer = setTimeout(() => {
      if (ticket === generation && !wanted && element.paused && !element.seeking) clearSeekPause();
    }, 250);
  }
  function failed() {
    wanted = false;
    clearSeekPause();
    controller.pending = false;
    controller.manual = false;
    controller.userPaused = true;
    display(false);
    root.classList.remove('is-loading', 'has-source');
    status.textContent = t.failed;
    if (button) {
      button.textContent = t.retry;
      button.setAttribute('aria-label', t.retry);
    }
    root.dispatchEvent(new CustomEvent('media:idle', { bubbles: true }));
  }
  function play(manual: boolean) {
    if (
      !alive() ||
      (!manual && controller.userPaused) ||
      (wanted && (controller.playing || controller.pending))
    )
      return;
    if (manual) {
      controller.userPaused = false;
      controller.manual = true;
      announceManual();
    } else controller.manual = false;
    wanted = true;
    clearSeekPause();
    controller.pending = true;
    const ticket = ++generation;
    status.textContent = '';
    root.classList.add('is-loading');
    if (element) {
      if (element.error || (failedSources >= sources.length && sources.length > 0)) {
        element.querySelectorAll('source').forEach((source) => source.remove());
        attached = false;
      }
      attach();
      // Invoke play in the original click turn, preserving iOS user activation.
      void element
        .play()
        .then(() => {
          if (ticket !== generation || !wanted || !alive()) {
            if (!wanted || !alive()) pause();
            return;
          }
          controller.pending = false;
          root.classList.remove('is-loading');
          display(true);
        })
        .catch(() => {
          if (ticket === generation && alive()) failed();
        });
    } else if (animated && image && sources[0]) {
      image.removeAttribute('srcset');
      image.src = sources[0].src;
    }
  }
  function pause(user = false) {
    pausedSeek ||= Boolean(element?.seeking);
    generation++;
    seekRequest?.abort();
    seekRequest = undefined;
    wanted = false;
    controller.pending = false;
    if (user) controller.userPaused = true;
    controller.manual = false;
    if (element && !element.paused) {
      element.pause();
    }
    if (animated && image && image.getAttribute('src') !== poster) {
      image.src = poster;
      if (imageSrcset) image.srcset = imageSrcset;
    }
    display(false);
    root.classList.remove('is-loading');
    settleSeekPause();
  }
  function dispose() {
    if (disposed) return;
    pause();
    disposed = true;
    clearSeekPause();
    lifetime.abort();
    pageSignal.removeEventListener('abort', dispose);
    if (element) {
      element.removeAttribute('src');
      element.querySelectorAll('source').forEach((source) => source.remove());
      element.querySelectorAll('track').forEach((track) => track.removeAttribute('src'));
      element.load();
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    dialog?.close();
    dialog?.remove();
  }
  button?.addEventListener(
    'click',
    () => {
      if (controller.playing || wanted) {
        pause(true);
        root.dispatchEvent(new CustomEvent('media:idle', { bubbles: true }));
      } else play(true);
    },
    { signal },
  );
  if (element) {
    element.addEventListener(
      'pointerdown',
      () => {
        controller.manual = true;
      },
      { signal },
    );
    element.addEventListener(
      'keydown',
      () => {
        controller.manual = true;
      },
      { signal },
    );
    element.addEventListener(
      'play',
      () => {
        if (!alive()) {
          pause();
          return;
        }
        // Media events can arrive after play() was already cancelled by pause().
        if (element.paused) return;
        if (!wanted && pausedSeek) {
          pause();
          return;
        }
        // Native controls do not expose their pointer/keyboard events to page JS.
        // Outside a cancelled seek, their play event is the explicit new intent.
        if (!wanted && element.controls && !element.paused) controller.manual = true;
        if (controller.manual) {
          clearSeekPause();
          controller.userPaused = false;
          wanted = true;
          announceManual();
        }
      },
      { signal },
    );
    element.addEventListener(
      'playing',
      () => {
        if (element.paused) return;
        if (!wanted || !alive()) {
          pause();
          return;
        }
        controller.pending = false;
        root.classList.remove('is-loading');
        display(true);
      },
      { signal },
    );
    element.addEventListener(
      'pause',
      () => {
        // Ignore an already-handled pause or a queued source-reset event after
        // playback has resumed. A flag could otherwise swallow the next native pause.
        if (!element.paused) return;
        if (!wanted) {
          settleSeekPause();
          return;
        }
        pause(!element.ended);
        root.dispatchEvent(new CustomEvent('media:idle', { bubbles: true }));
      },
      { signal },
    );
    element.addEventListener(
      'ended',
      () => {
        wanted = false;
        clearSeekPause();
        controller.manual = false;
        controller.userPaused = true;
        display(false);
        root.dispatchEvent(new CustomEvent('media:idle', { bubbles: true }));
      },
      { signal },
    );
    element.addEventListener('error', failed, { signal });
    async function seekToPending() {
      if (
        pendingSeek === undefined ||
        !element ||
        !wanted ||
        !alive() ||
        element.readyState < 1 ||
        seekRequest
      )
        return;
      const target = pendingSeek;
      // Some static hosts (including local Wrangler) expose a duration but no byte
      // ranges. Native seeking then silently resets to zero. Only on a seek request,
      // obtain a bounded local Blob so the browser can seek without server ranges.
      if (
        !objectUrl &&
        (!element.seekable.length || element.seekable.end(element.seekable.length - 1) < target)
      ) {
        const active = new AbortController();
        seekRequest = active;
        const source = sources.find((source) => element.canPlayType(source.type));
        if (!source) {
          seekRequest = undefined;
          failed();
          return;
        }
        try {
          const response = await fetch(source.src, { signal: active.signal });
          if (
            !response.ok ||
            Number(response.headers.get('content-length')) > mediaLimits.localFileBytes
          )
            throw new Error('Media unavailable');
          const reader = response.body!.getReader();
          const chunks: Uint8Array<ArrayBuffer>[] = [];
          let bytes = 0;
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              bytes += value.byteLength;
              if (bytes > mediaLimits.localFileBytes) {
                await reader.cancel();
                throw new Error('Media too large');
              }
              chunks.push(new Uint8Array(value));
            }
          } finally {
            reader.releaseLock();
          }
          if (active.signal.aborted || !alive()) return;
          objectUrl = URL.createObjectURL(new Blob(chunks, { type: source.type }));
          seekRequest = undefined;
          const ticket = ++generation;
          controller.pending = true;
          element.src = objectUrl;
          // The first click already invoked this element's native play(). Reusing
          // that element preserves its user-authorized playback on Safari.
          void element.play().catch(() => {
            if (ticket === generation && alive()) failed();
          });
        } catch {
          if (!active.signal.aborted && alive()) failed();
        } finally {
          if (seekRequest === active) seekRequest = undefined;
        }
        return;
      }
      element.currentTime = Math.min(target, element.duration);
      pendingSeek = undefined;
    }
    element.addEventListener(
      'loadedmetadata',
      () => {
        void seekToPending();
      },
      { signal },
    );
    element.addEventListener(
      'canplay',
      () => {
        if (!wanted) pause();
        else void seekToPending();
      },
      { signal },
    );
    // WebKit may restore native playback as an in-flight seek settles. Reapply
    // the user's pause intent instead of waiting for a later `playing` event.
    element.addEventListener(
      'seeked',
      () => {
        if (!wanted) pause();
        settleSeekPause();
      },
      { signal },
    );
    const cues = [...root.querySelectorAll<HTMLElement>('[data-media-cue]')];
    element.addEventListener(
      'timeupdate',
      () => {
        // A native seek can resume after seeked without another play/playing event.
        // Native user play restores wanted before normal progress updates.
        if (!wanted && !element.paused) pause();
        const current = cues.findLast((cue) => Number(cue.dataset.mediaCue) <= element.currentTime);
        cues.forEach((cue) => cue.toggleAttribute('data-current', cue === current));
      },
      { signal },
    );
    for (const seek of root.querySelectorAll<HTMLButtonElement>('[data-media-seek]'))
      seek.addEventListener(
        'click',
        () => {
          pendingSeek = Number(seek.dataset.mediaSeek);
          play(true);
          void seekToPending();
        },
        { signal },
      );
  }
  image?.addEventListener(
    'load',
    () => {
      if (animated && wanted && alive()) {
        controller.pending = false;
        root.classList.remove('is-loading');
        display(true);
      }
    },
    { signal },
  );
  image?.addEventListener(
    'error',
    () => {
      if (animated && wanted) failed();
      const fallback = root.dataset.fallback;
      image.removeAttribute('srcset');
      if (fallback && isMediaUrl(fallback) && image.getAttribute('src') !== fallback) {
        poster = fallback;
        image.src = fallback;
      } else {
        image.style.visibility = 'hidden';
        status.textContent = t.failed;
      }
    },
    { signal },
  );
  root.querySelector('[data-media-zoom]')?.addEventListener(
    'click',
    (event) => {
      if (!image) return;
      const trigger = event.currentTarget as HTMLButtonElement;
      dialog = document.createElement('dialog');
      dialog.className = 'media-lightbox';
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = t.close;
      const enlarged = new Image();
      enlarged.src = poster;
      enlarged.alt = image.alt;
      dialog.append(close, enlarged);
      document.body.append(dialog);
      dialog.showModal();
      close.addEventListener('click', () => dialog?.close(), { signal });
      dialog.addEventListener(
        'close',
        () => {
          dialog?.remove();
          if (trigger.isConnected) trigger.focus({ preventScroll: true });
        },
        { once: true },
      );
    },
    { signal },
  );
  pageSignal.addEventListener('abort', dispose, { once: true });
  return controller;
}
