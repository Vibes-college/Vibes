import { useEffect, useRef, useState } from 'react';

export function useRecordingView(player, stage, video) {
  const [large, setLarge] = useState(false);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const clampView = (next) => {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return next;
    const ratio = video.current?.videoWidth / video.current?.videoHeight || box.width / box.height;
    const width = Math.min(box.width, box.height * ratio);
    const height = width / ratio;
    const zoom = Math.max(1, Math.min(3, next.zoom));
    const limitX = Math.max(0, (width * zoom - box.width) / 2);
    const limitY = Math.max(0, (height * zoom - box.height) / 2);
    return {
      zoom,
      x: Math.max(-limitX, Math.min(limitX, next.x)),
      y: Math.max(-limitY, Math.min(limitY, next.y)),
    };
  };
  const changeZoom = (zoom) => setView((current) => clampView({ ...current, zoom }));
  const reset = () => setView({ zoom: 1, x: 0, y: 0 });
  useEffect(() => {
    reset();
    if (!large) return;
    // Safari does not focus a button on pointer activation. Restore the actual opener.
    const previous = player.current.querySelector('[data-close-recording]');
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
    player.current.querySelector('[data-close-recording]')?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') setLarge(false);
      if (event.key !== 'Tab') return;
      const controls = [
        ...player.current.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
        ),
      ];
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const resize = () => {
      pointers.current.clear();
      gesture.current = null;
      // A wide recording already fills an inline phone card. Start closer so
      // expanding it actually enlarges its contents; Reset still shows the whole frame.
      const wide = video.current.videoWidth > video.current.videoHeight;
      const zoom = innerWidth <= 800 && wide ? 1.5 : 1;
      setView(clampView({ zoom, x: zoom > 1 ? innerWidth : 0, y: 0 }));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage.current);
    document.addEventListener('keydown', keydown);
    return () => {
      observer.disconnect();
      pointers.current.clear();
      gesture.current = null;
      for (const [node, inert] of outside) node.inert = inert;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keydown);
      previous?.focus({ preventScroll: true });
    };
  }, [large]);
  const beginGesture = () => {
    const points = [...pointers.current.values()];
    gesture.current = points.length
      ? {
          ...view,
          start: points[0],
          distance:
            points.length === 2
              ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
              : 0,
        }
      : null;
  };
  const release = (event) => {
    pointers.current.delete(event.pointerId);
    beginGesture();
  };
  return {
    large,
    setLarge,
    view,
    changeZoom,
    reset,
    stageEvents: {
      onPointerDown(event) {
        if (!large || event.button !== 0 || pointers.current.size >= 2) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        beginGesture();
      },
      onPointerMove(event) {
        if (!pointers.current.has(event.pointerId) || !gesture.current) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const points = [...pointers.current.values()],
          start = gesture.current;
        if (points.length === 2 && start.distance) {
          const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
          setView(clampView({ ...start, zoom: (start.zoom * distance) / start.distance }));
        } else {
          setView(
            clampView({
              zoom: start.zoom,
              x: start.x + points[0].x - start.start.x,
              y: start.y + points[0].y - start.start.y,
            }),
          );
        }
      },
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
      onKeyDown(event) {
        const movement = {
          ArrowLeft: [40, 0],
          ArrowRight: [-40, 0],
          ArrowUp: [0, 40],
          ArrowDown: [0, -40],
        }[event.key];
        if (!large || !movement) return;
        event.preventDefault();
        setView((current) =>
          clampView({ ...current, x: current.x + movement[0], y: current.y + movement[1] }),
        );
      },
    },
  };
}
