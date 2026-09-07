import type { Locale } from '../lib/i18n/routes';

// A real, self-authored mathematical demo; never evaluate code supplied by content.
export function mountDemo(
  root: HTMLElement,
  config: { count: number; speed: number },
  locale: Locale,
  signal: AbortSignal,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 400;
  canvas.setAttribute(
    'aria-label',
    locale === 'zh' ? '拖动改变圆轨道的中心' : 'Drag to move the orbit center',
  );
  const ctx = canvas.getContext('2d')!;
  const controls = document.createElement('div');
  controls.className = 'media-demo-controls';
  const label = document.createElement('label');
  label.textContent = locale === 'zh' ? '速度 ' : 'Speed ';
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0.1';
  input.max = '3';
  input.step = '0.1';
  input.value = String(config.speed);
  label.append(input);
  const pause = document.createElement('button');
  pause.type = 'button';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = locale === 'zh' ? '居中' : 'Center';
  controls.append(label, pause, reset);
  root.append(canvas, controls);
  let x = 360;
  let y = 200;
  let phase = 0;
  let last = 0;
  let frame = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pointer: number | undefined;
  const setPause = () => {
    pause.textContent = paused
      ? locale === 'zh'
        ? '继续动画'
        : 'Resume animation'
      : locale === 'zh'
        ? '暂停动画'
        : 'Pause animation';
    pause.setAttribute('aria-pressed', String(paused));
  };
  setPause();
  pause.addEventListener(
    'click',
    () => {
      paused = !paused;
      setPause();
    },
    { signal },
  );
  reset.addEventListener(
    'click',
    () => {
      x = 360;
      y = 200;
    },
    { signal },
  );
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      pointer = event.pointerId;
      canvas.setPointerCapture(pointer);
    },
    { signal },
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerId !== pointer) return;
      const bounds = canvas.getBoundingClientRect();
      const scale = Math.min(bounds.width / 720, bounds.height / 400);
      const left = bounds.left + (bounds.width - 720 * scale) / 2;
      const top = bounds.top + (bounds.height - 400 * scale) / 2;
      x = Math.max(60, Math.min(660, (event.clientX - left) / scale));
      y = Math.max(60, Math.min(340, (event.clientY - top) / scale));
    },
    { signal },
  );
  canvas.addEventListener(
    'pointerup',
    () => {
      pointer = undefined;
    },
    { signal },
  );
  canvas.addEventListener(
    'pointercancel',
    () => {
      pointer = undefined;
    },
    { signal },
  );
  canvas.tabIndex = 0;
  canvas.addEventListener(
    'keydown',
    (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      x = Math.max(
        60,
        Math.min(660, x + (event.key === 'ArrowRight' ? 12 : event.key === 'ArrowLeft' ? -12 : 0)),
      );
      y = Math.max(
        60,
        Math.min(340, y + (event.key === 'ArrowDown' ? 12 : event.key === 'ArrowUp' ? -12 : 0)),
      );
    },
    { signal },
  );
  function render(timestamp: number) {
    if (signal.aborted) return;
    if (!paused && last) phase += Math.min(0.05, (timestamp - last) / 1000) * Number(input.value);
    last = timestamp;
    ctx.fillStyle = '#121b27';
    ctx.fillRect(0, 0, 720, 400);
    for (let index = 0; index < config.count; index++) {
      const radius = 35 + index * 16;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.6, radius * 0.7, -0.3, 0, Math.PI * 2);
      ctx.strokeStyle = '#30465c';
      ctx.lineWidth = 1;
      ctx.stroke();
      const a = phase / (1 + index * 0.23) + index;
      const dx = Math.cos(a) * radius * 1.6;
      const dy = Math.sin(a) * radius * 0.7;
      ctx.beginPath();
      ctx.arc(
        x + dx * Math.cos(-0.3) - dy * Math.sin(-0.3),
        y + dx * Math.sin(-0.3) + dy * Math.cos(-0.3),
        4 + index * 0.7,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = ['#71d7d0', '#f4c77d', '#acb9ed'][index % 3];
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#f4c77d';
    ctx.fill();
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);
  const cleanup = () => cancelAnimationFrame(frame);
  signal.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
