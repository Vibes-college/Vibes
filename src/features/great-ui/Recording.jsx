import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize2, Minimize2, ArrowUpRight } from 'lucide-react';
export function Recording({ entry }) {
  const [enabled, setEnabled] = useState(Boolean(entry.localRecordingPath));
  const [imageFailed, setImageFailed] = useState(false);
  if (!enabled)
    return (
      <div className="video-player external-preview">
        <div className="recording-stage">
          {entry.poster && <img src={entry.poster} alt={entry.title + '原作页面'} />}
          <div className="external-preview-actions">
            <p>{entry.title}</p>
            {(entry.previewRecording || entry.previewImage) && (
              <button className="primary-button" onClick={() => setEnabled(true)}>
                <Play size={16} />
                {entry.previewImage ? '查看作者预览图' : '播放作者演示'}
              </button>
            )}
            <a href={entry.reference} target="_blank" rel="noreferrer">
              打开原作交互 <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
        <p className="preview-credit">
          by Great UI · {entry.previewImage ? '作者提供的是静态预览图' : '点击后从原作媒体地址加载'}
        </p>
      </div>
    );
  if (entry.previewImage)
    return (
      <div className="video-player external-preview">
        <div className="recording-stage">
          {imageFailed ? (
            <p>预览图无法加载，请打开原作。</p>
          ) : (
            <img
              src={entry.previewImage}
              alt={entry.title + '作者预览图'}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        <p className="preview-credit">
          作者静态预览 ·{' '}
          <a href={entry.reference} target="_blank" rel="noreferrer">
            打开原作交互 ↗
          </a>
        </p>
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
    const siblings = [...player.current.parentElement.children].filter(
      (node) => node !== player.current,
    );
    const reading = document.querySelector('.reading');
    for (const node of [...siblings, reading]) node.inert = true;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', close);
    return () => {
      for (const node of [...siblings, reading]) node.inert = false;
      document.body.style.overflow = '';
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
          preload="metadata"
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
