import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize2, Minimize2, ArrowUpRight } from 'lucide-react';
export function Recording({ entry }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = useRef(null);
  useEffect(() => {
    if (image.current?.complete && !image.current.naturalWidth) setImageFailed(true);
  }, []);
  if (entry.previewImage)
    return (
      <div className="video-player external-preview">
        <div className="recording-stage">
          {imageFailed ? (
            <p>
              预览图无法加载，
              <a href={entry.reference} target="_blank" rel="noreferrer">
                请打开原作
              </a>
              。
            </p>
          ) : (
            <img
              ref={image}
              src={entry.previewImage}
              alt={entry.title + '预览图'}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      </div>
    );
  return <RecordedPlayer entry={entry} />;
}
function RecordedPlayer({ entry }) {
  const ref = useRef(null);
  const player = useRef(null);
  const manuallyPaused = useRef(false);
  const inView = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [large, setLarge] = useState(false);
  const play = () => {
    if (ref.current.ended) ref.current.currentTime = 0;
    ref.current.play().catch(() => setPlaying(false));
  };
  useEffect(() => {
    const video = ref.current;
    // SSR can finish loading media before React attaches its event handlers.
    if (video.readyState >= 1) setDuration(video.duration);
    if (video.readyState >= 2) setLoaded(true);
    if (video.error) setFailed(true);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (document.hidden || !inView.current || media.matches || manuallyPaused.current)
        video.pause();
      else play();
    };
    const observer = new IntersectionObserver(([item]) => {
      inView.current = item.isIntersecting;
      sync();
    });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    media.addEventListener('change', sync);
    sync();
    return () => {
      video.pause();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('change', sync);
    };
  }, []);
  useEffect(() => {
    if (!large) return;
    const previous = document.activeElement;
    const close = (event) => {
      if (event.key === 'Escape') setLarge(false);
      if (event.key === 'Tab') {
        const controls = [
          ...player.current.querySelectorAll('button:not(:disabled), input:not(:disabled)'),
        ];
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    // The player can live inside the site layout or the standalone workbench.
    // Preserve every ancestor sibling's prior state, including the site header.
    const outside = new Map();
    for (let current = player.current; current?.parentElement; current = current.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) {
          outside.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      if (current.parentElement === document.body) break;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', close);
    return () => {
      for (const [node, inert] of outside) node.inert = inert;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', close);
      previous?.focus({ preventScroll: true });
    };
  }, [large]);
  return (
    <div
      ref={player}
      className={'video-player' + (large ? ' video-expanded' : '')}
      role={large ? 'dialog' : undefined}
      aria-modal={large ? true : undefined}
      aria-label={large ? '放大录屏' : undefined}
    >
      <div className="recording-stage">
        <video
          ref={ref}
          src={entry.previewRecording}
          poster={entry.poster}
          muted
          playsInline
          loop
          preload="auto"
          aria-label={entry.title + '原作录屏'}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => setTime(ref.current.currentTime)}
          onLoadedMetadata={() => setDuration(ref.current.duration)}
          onLoadedData={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setPlaying(false);
          }}
        />
        {(!loaded || failed) && (
          <div className="media-state">
            {failed ? (
              <>
                <p>录屏无法加载</p>
                <a href={entry.reference} target="_blank" rel="noreferrer">
                  查看原作 <ArrowUpRight size={14} />
                </a>
              </>
            ) : (
              <p>加载中…</p>
            )}
          </div>
        )}
      </div>
      <div className="scrubber">
        <button
          className="icon-button"
          aria-label={playing ? '暂停录屏' : '播放录屏'}
          disabled={failed}
          onClick={() => {
            manuallyPaused.current = playing;
            if (playing) ref.current.pause();
            else play();
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <input
          type="range"
          aria-label="录屏进度"
          min="0"
          max={duration || 1}
          step="0.01"
          value={time}
          disabled={!duration || failed}
          aria-valuetext={time.toFixed(1) + ' 秒，共 ' + duration.toFixed(1) + ' 秒'}
          onChange={(event) => {
            manuallyPaused.current = true;
            ref.current.pause();
            const next = Number(event.target.value);
            ref.current.currentTime = next;
            setTime(next);
          }}
        />
        <output aria-live="off">
          {time.toFixed(1)} / {duration.toFixed(1)}
        </output>
        <button
          className="icon-button"
          aria-label={large ? '缩小录屏' : '放大录屏'}
          aria-pressed={large}
          onClick={() => setLarge(!large)}
        >
          {large ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
}
