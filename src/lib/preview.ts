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

import { escapeHtml } from './escape.ts';
export { escapeHtml } from './escape.ts';
// 服务端卡片与按需搜索结果共用既有预览图形，避免维护两套视觉实现。
export function previewHtml(work: PreviewData): string {
  if (!(previewKinds as readonly string[]).includes(work.preview) || !colorPattern.test(work.color))
    throw new Error('Invalid preview metadata');
  const dark = ['network', 'earth'].includes(work.preview);
  const svg = ['network', 'wave', 'audio', 'plot', 'earth', 'field', 'shapes'].includes(
    work.preview,
  );
  return `<div class="preview preview--${work.preview}${dark ? ' preview--dark' : ''}" style="--preview-bg:${work.color}" aria-hidden="true"><div class="preview-art"><span class="preview-eyebrow">${escapeHtml(work.eyebrow)}</span>${svg ? `<svg class="preview-drawing" viewBox="0 0 300 160" fill="none"><use href="/icons/previews.svg#${work.preview}" /></svg>` : ''}<span class="preview-title">${escapeHtml(work.display)}</span>${work.preview === 'paper' ? '<div class="paper-lines"><span></span><span></span><span></span><span></span><span></span><span></span></div>' : ''}<span class="preview-note">${escapeHtml(work.note)}</span></div></div>`;
}
