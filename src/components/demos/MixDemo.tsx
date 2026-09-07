import { useState } from 'react';
import './mix-demo.css';

export default function MixDemo({
  locale = 'zh',
  initial = 35,
}: {
  locale?: string;
  initial?: number;
}) {
  const [amount, setAmount] = useState(initial);
  const [ready, setReady] = useState(false);
  const zh = locale === 'zh';
  return (
    <div className="mix-demo not-prose" data-article-interactive data-mix-demo>
      <p>{zh ? '把两种颜色混在一起' : 'Mix two colors together'}</p>
      <div
        className="mix-demo-swatch"
        style={{ background: `color-mix(in srgb, #3268ae ${amount}%, #edba6a)` }}
      />
      <label>
        {zh ? '蓝色比例' : 'Blue proportion'}
        <input
          type="range"
          min="0"
          max="100"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </label>
      <output aria-live="polite">{amount}%</output>
      <div
        className="mix-demo-drag"
        role="slider"
        aria-label={zh ? '拖动调色' : 'Drag to mix'}
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={amount}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setReady(true);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const box = event.currentTarget.getBoundingClientRect();
          setAmount(
            Math.max(0, Math.min(100, Math.round(((event.clientX - box.left) / box.width) * 100))),
          );
        }}
        onKeyDown={(event) => {
          if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            setAmount((value) =>
              Math.max(0, Math.min(100, value + (event.key === 'ArrowRight' ? 1 : -1))),
            );
          }
        }}
      >
        {zh ? '在这里左右拖动' : 'Drag left or right here'}
        {ready ? ' ↔' : ''}
      </div>
      <button type="button" onClick={() => setAmount(initial)}>
        {zh ? '重置颜色' : 'Reset color'}
      </button>
      <small>
        {zh
          ? '启用 JavaScript 后可调整比例；初始色块可直接查看。'
          : 'Enable JavaScript to adjust the mix; the initial color remains readable.'}
      </small>
    </div>
  );
}
