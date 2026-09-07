import { parseChartData } from '../lib/media/data';
import { isMediaUrl, mediaLimits } from '../config/media';
import type { Media, MediaText } from '../lib/media/schema';
import type { Locale } from '../lib/i18n/routes';

export async function mountChart(
  root: HTMLElement,
  item: Extract<Media, { kind: 'chart' }>,
  text: MediaText[string],
  locale: Locale,
  signal: AbortSignal,
) {
  if (!isMediaUrl(item.dataset)) throw new Error('Invalid dataset source');
  const response = await fetch(item.dataset, { signal });
  if (!response.ok || Number(response.headers.get('content-length')) > mediaLimits.dataBytes)
    throw new Error('Chart data unavailable or too large');
  // Bound the body while reading, including chunked responses without Content-Length.
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > mediaLimits.dataBytes) {
        await reader.cancel();
        throw new Error('Chart data exceeds limit');
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  const rows = parseChartData(
    new TextDecoder().decode(all),
    item.columns.map((column) => column.key),
  );
  if (signal.aborted) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 720 360');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', text.title);
  const controls = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = locale === 'zh' ? '图表显示' : 'Chart display';
  controls.append(legend);
  const selected = new Set(item.chart.series);
  if (item.controls.series)
    for (const key of item.chart.series) {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.addEventListener(
        'change',
        () => {
          if (checkbox.checked) selected.add(key);
          else selected.delete(key);
          draw();
        },
        { signal },
      );
      label.append(checkbox, text.columns[key]);
      controls.append(label);
    }
  const range = document.createElement('input');
  range.type = 'range';
  range.min = String(Math.min(2, rows.length));
  range.max = String(rows.length);
  range.value = String(rows.length);
  const rangeLabel = document.createElement('label');
  const count = document.createElement('output');
  rangeLabel.append(locale === 'zh' ? '显示前 N 个采样 ' : 'First N samples ', range, count);
  range.addEventListener('input', draw, { signal });
  if (item.controls.range) controls.append(rangeLabel);
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = locale === 'zh' ? '查看数据表' : 'View data table';
  const table = document.createElement('table');
  const context = document.createElement('p');
  context.textContent = `${text.context || ''} ${item.sourceLocator} · ${item.dataAsOf}`;
  const source = document.createElement('a');
  source.href = item.provenance.url;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.textContent = item.provenance.credit;
  details.append(summary, context, source);
  for (const result of text.keyResults) {
    const note = document.createElement('p');
    note.textContent = `${result.label}: ${result.value} — ${result.context}`;
    details.append(note);
  }
  details.append(table);
  root.append(controls, svg, details);
  function node(tag: string, attributes: Record<string, string | number>, content?: string) {
    const element = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (content) element.textContent = content;
    svg.append(element);
    return element;
  }
  function draw() {
    const shown = rows.slice(0, Number(range.value));
    count.value = String(shown.length);
    const keys = item.chart.series.filter((key) => selected.has(key));
    svg.replaceChildren();
    table.replaceChildren();
    const xValues = shown.map((row) => row[item.chart.x]);
    const yValues = shown.flatMap((row) => keys.map((key) => row[key]));
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(0, ...yValues);
    const yMax = Math.max(0, ...yValues);
    const x = (value: number) => 64 + ((value - xMin) / (xMax - xMin || 1)) * 622;
    const y = (value: number) => 308 - ((value - yMin) / (yMax - yMin || 1)) * 276;
    node('path', { d: 'M64 24V308H696', stroke: '#7d858c', fill: 'none' });
    for (let step = 0; step <= 4; step++) {
      const value = yMin + ((yMax - yMin) * step) / 4;
      node(
        'text',
        { x: 56, y: y(value) + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#5a6268' },
        Number(value.toPrecision(3)).toString(),
      );
      node('path', { d: `M64 ${y(value)}H696`, stroke: '#d7dde2', 'stroke-width': 0.5 });
    }
    const unit = item.columns.find((column) => column.key === item.chart.x)?.unit;
    node(
      'text',
      { x: 380, y: 346, 'text-anchor': 'middle', 'font-size': 13, fill: '#333' },
      `${text.columns[item.chart.x]}${unit ? ` (${unit})` : ''}`,
    );
    node('text', { x: 64, y: 327, 'font-size': 12, fill: '#555' }, String(xMin));
    node(
      'text',
      { x: 686, y: 327, 'text-anchor': 'end', 'font-size': 12, fill: '#555' },
      String(xMax),
    );
    for (const [index, key] of keys.entries()) {
      const color = [
        '#216b8c',
        '#b85a34',
        '#5a7f3c',
        '#8a5ea4',
        '#a0781b',
        '#287b6e',
        '#9b425f',
        '#48569c',
      ][index];
      if (item.chart.kind === 'line')
        node('path', {
          d: shown
            .map((row, i) => `${i ? 'L' : 'M'}${x(row[item.chart.x])} ${y(row[key])}`)
            .join(' '),
          stroke: color,
          'stroke-width': 2,
          fill: 'none',
        });
      else
        for (const row of shown) {
          if (item.chart.kind === 'scatter')
            node('circle', { cx: x(row[item.chart.x]), cy: y(row[key]), r: 3, fill: color });
          else {
            const width = Math.min(24, 560 / shown.length / Math.max(1, keys.length));
            node('rect', {
              x: x(row[item.chart.x]) + index * width - (keys.length * width) / 2,
              y: Math.min(y(0), y(row[key])),
              width,
              height: Math.max(1, Math.abs(y(row[key]) - y(0))),
              fill: color,
            });
          }
        }
      node(
        'text',
        { x: 72 + index * 145, y: 16, 'font-size': 12, fill: color },
        `${text.columns[key]}${item.columns.find((c) => c.key === key)?.unit ? ` (${item.columns.find((c) => c.key === key)!.unit})` : ''}`,
      );
    }
    const header = table.createTHead().insertRow();
    for (const key of [item.chart.x, ...keys]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = text.columns[key];
      header.append(cell);
    }
    const body = table.createTBody();
    for (const row of shown) {
      const tr = body.insertRow();
      for (const key of [item.chart.x, ...keys]) tr.insertCell().textContent = String(row[key]);
    }
  }
  draw();
}
