export const previewKinds = [
  'paper',
  'code',
  'network',
  'audio',
  'shapes',
  'field',
  'report',
  'plot',
  'text',
  'wave',
  'earth',
] as const;
export const colorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export interface PreviewData {
  preview: (typeof previewKinds)[number];
  color: string;
  eyebrow: string;
  display: string;
  note: string;
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
}
// 服务端卡片与按需搜索结果共用既有预览图形，避免维护两套视觉实现。
function drawing(kind: PreviewData['preview']): string {
  const range = (count: number) => Array.from({ length: count }, (_, i) => i);
  if (kind === 'network')
    return (
      [35, 85, 135]
        .flatMap((y) =>
          [25, 60, 95, 130].map(
            (y2) => `<path d="M40 ${y}L145 ${y2}L255 80" stroke="currentColor" opacity=".35"/>`,
          ),
        )
        .join('') +
      [35, 85, 135].map((y) => `<circle cx="40" cy="${y}" r="7" fill="currentColor"/>`).join('') +
      [25, 60, 95, 130]
        .map((y) => `<circle cx="145" cy="${y}" r="7" fill="currentColor"/>`)
        .join('') +
      '<circle cx="255" cy="80" r="9" fill="currentColor"/>'
    );
  if (kind === 'wave' || kind === 'audio')
    return range(49)
      .map((i) => {
        const h = 10 + Math.abs(Math.sin(i * 0.65) * Math.cos(i * 0.17)) * 95;
        return `<path d="M${6 + i * 6} ${80 - h / 2}v${h}" stroke="currentColor" stroke-width="2"/>`;
      })
      .join('');
  if (kind === 'plot')
    return (
      [40, 80, 120]
        .map((y) => `<path d="M15 ${y}H285" stroke="currentColor" opacity=".13"/>`)
        .join('') +
      range(35)
        .map(
          (i) =>
            `<circle cx="${20 + i * 7.4}" cy="${128 - i * 2.6 + Math.sin(i * 1.7) * 22}" r="${2.5 + (i % 3)}" fill="currentColor" opacity="${0.35 + (i % 4) * 0.16}"/>`,
        )
        .join('') +
      '<path d="M15 15V145H285" stroke="currentColor"/>'
    );
  if (kind === 'earth')
    return (
      '<circle cx="150" cy="80" r="72" stroke="currentColor"/>' +
      [22, 45, 62]
        .map(
          (r) => `<ellipse cx="150" cy="80" rx="${r}" ry="72" stroke="currentColor" opacity=".3"/>`,
        )
        .join('') +
      [20, 43, 62]
        .map(
          (r) => `<ellipse cx="150" cy="80" rx="72" ry="${r}" stroke="currentColor" opacity=".3"/>`,
        )
        .join('') +
      '<path d="M105 34L123 50 119 65 141 73 153 102 145 131M170 27L163 43 192 56 185 78 205 91M172 95L183 116 203 121" stroke="currentColor" stroke-width="3"/>'
    );
  if (kind === 'field')
    return range(13)
      .map(
        (i) =>
          `<path d="M0 ${i * 13} C65 ${i * 6 - 25}, 170 ${210 - i * 16},300 ${i * 12}" stroke="currentColor" opacity="${0.25 + i * 0.04}" stroke-width="2"/>`,
      )
      .join('');
  if (kind === 'shapes')
    return '<circle cx="70" cy="72" r="41" fill="#dfb346"/><path d="M128 121L173 27 221 121Z" fill="#6c8da4"/><rect x="209" y="78" width="58" height="58" rx="5" fill="#c46e55" transform="rotate(-12 238 107)"/>';
  return '';
}
export function previewHtml(work: PreviewData): string {
  if (!(previewKinds as readonly string[]).includes(work.preview) || !colorPattern.test(work.color))
    throw new Error('Invalid preview metadata');
  const dark = ['network', 'earth'].includes(work.preview);
  const svg = drawing(work.preview);
  return `<div class="preview preview--${work.preview}${dark ? ' preview--dark' : ''}" style="--preview-bg:${work.color}" aria-hidden="true"><div class="preview-art"><span class="preview-eyebrow">${escapeHtml(work.eyebrow)}</span>${svg ? `<svg class="preview-drawing" viewBox="0 0 300 160" fill="none">${svg}</svg>` : ''}<span class="preview-title">${escapeHtml(work.display)}</span>${work.preview === 'paper' ? '<div class="paper-lines"><span></span><span></span><span></span><span></span><span></span><span></span></div>' : ''}<span class="preview-note">${escapeHtml(work.note)}</span></div></div>`;
}
