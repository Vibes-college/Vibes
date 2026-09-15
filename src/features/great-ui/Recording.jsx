import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize2, Minimize2, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { useRecordingView } from './useRecordingView';
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
  const manuallyPlaying = useRef(false);
  const inView = useRef(false);
  const stage = useRef(null);
  const media = entry.recordingMedia;
  const { large, setLarge, view, changeZoom, reset, stageEvents } = useRecordingView(
    player,
    stage,
    ref,
  );
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
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
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width: 800px)');
    const connection = navigator.connection;
    let restore;
    const changeSource = () => {
      if (!media?.mobile) return;
      const wasPlaying = !video.paused;
      const fraction = Number.isFinite(video.duration) ? video.currentTime / video.duration : 0;
      video.pause();
      setPlaying(false);
      setLoaded(false);
      setFailed(false);
      reset();
      if (restore) video.removeEventListener('loadedmetadata', restore);
      restore = () => {
        video.currentTime = Math.min(video.duration, fraction * video.duration);
        if (wasPlaying) sync();
      };
      video.addEventListener('loadedmetadata', restore, { once: true });
      // Reevaluate <source media> on rotation; only the selected rendition is requested.
      video.load();
      if (wasPlaying) sync();
    };
    const sync = () => {
      if (
        document.hidden ||
        !inView.current ||
        ((reduced.matches || connection?.saveData) && !manuallyPlaying.current) ||
        manuallyPaused.current
      )
        video.pause();
      else play();
    };
    const observer = new IntersectionObserver(([item]) => {
      inView.current = item.isIntersecting;
      sync();
    });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    narrow.addEventListener('change', changeSource);
    connection?.addEventListener('change', sync);
    sync();
    return () => {
      video.pause();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      narrow.removeEventListener('change', changeSource);
      connection?.removeEventListener('change', sync);
      if (restore) video.removeEventListener('loadedmetadata', restore);
    };
  }, []);
  return (
    <div
      ref={player}
      className={'video-player' + (large ? ' video-expanded' : '')}
      role={large ? 'dialog' : undefined}
      aria-modal={large ? true : undefined}
      aria-label={large ? '放大录屏' : undefined}
      style={{
        '--recording-ratio': media?.width && media?.height ? media.width / media.height : 1.8,
        '--recording-mobile-ratio': media?.mobile ? media.mobile.width / media.mobile.height : 1.8,
      }}
    >
      {large && (
        <div className="recording-zoom">
          <span>缩放后可拖动画面</span>
          <button
            className="icon-button"
            aria-label="缩小画面"
            disabled={view.zoom <= 1}
            onClick={() => changeZoom(view.zoom - 0.5)}
          >
            <Minus size={16} />
          </button>
          <button className="zoom-reset" aria-label="重置画面缩放" onClick={reset}>
            {Math.round(view.zoom * 100)}%
          </button>
          <button
            className="icon-button"
            aria-label="放大画面"
            disabled={view.zoom >= 3}
            onClick={() => changeZoom(view.zoom + 0.5)}
          >
            <Plus size={16} />
          </button>
        </div>
      )}
      <div
        ref={stage}
        className="recording-stage"
        tabIndex={large ? 0 : undefined}
        aria-label={large ? '录屏画面，可拖动或用方向键移动' : undefined}
        {...stageEvents}
      >
        <video
          ref={ref}
          muted
          playsInline
          loop
          preload="none"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          aria-label={entry.title + '原作录屏'}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => setTime(ref.current.currentTime)}
          onLoadedMetadata={() => setDuration(ref.current.duration)}
          onLoadedData={() => setLoaded(true)}
          onError={(event) => {
            // A skipped responsive <source> can error while the selected video succeeds.
            if (event.target !== event.currentTarget) return;
            setFailed(true);
            setPlaying(false);
          }}
        >
          {media?.mobile && (
            <source media="(max-width: 800px)" src={media.mobile.video} type="video/mp4" />
          )}
          <source src={entry.previewRecording} type="video/mp4" onError={() => setFailed(true)} />
        </video>
        {!loaded && !failed && (
          <picture className="recording-poster">
            {media?.mobile && <source media="(max-width: 800px)" srcSet={media.mobile.poster} />}
            <img src={entry.poster} alt="" />
          </picture>
        )}
        {(!loaded || failed) && (
          <div className={'media-state' + (!failed ? ' media-loading' : '')}>
            {failed ? (
              <>
                <p>录屏无法加载</p>
                <a href={entry.reference} target="_blank" rel="noreferrer">
                  查看原作 <ArrowUpRight size={14} />
                </a>
              </>
            ) : (
              <p>{playing ? '加载中…' : '点击播放录屏'}</p>
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
            manuallyPlaying.current = !playing;
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
            manuallyPlaying.current = false;
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
          data-close-recording
          onClick={() => setLarge(!large)}
        >
          {large ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
}
