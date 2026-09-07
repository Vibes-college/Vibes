import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pcmPeaks, localInput } from '../../scripts/media-tools.ts';
import { preparationArgs } from '../../scripts/prepare-media.ts';
import { parseChartData } from '../../src/lib/media/data.ts';

test('waveform buckets represent decoded PCM including negative peaks and silence', () => {
  const pcm = Buffer.alloc(12);
  [0, 32767, -32768, 0, 16384, 0].forEach((value, index) => pcm.writeInt16LE(value, index * 2));
  assert.deepEqual(pcmPeaks(pcm, 3), [1, 1, 0.5]);
  assert.deepEqual(pcmPeaks(Buffer.alloc(8), 2), [0, 0]);
  assert.throws(() => pcmPeaks(Buffer.alloc(0)), /no samples/);
});

test('preparation rejects remote input, unsafe ids and unbounded options', () => {
  assert.throws(() => localInput('https://remote.test/file.mp4'), /local files/);
  for (const args of [
    ['video', 'a.mp4', '../bad'],
    ['video', 'a.mp4', 'ok', '--seconds', '13'],
    ['audio', 'a.mp3', 'ok', '--start', '-1'],
    ['image', 'a.png', 'ok', '--seconds', '3'],
    ['video', 'a.mp4', 'ok', '--remote', 'true'],
  ])
    assert.throws(() => preparationArgs(args));
  assert.deepEqual(preparationArgs(['video', 'a.mp4', 'ok']), {
    kind: 'video',
    input: 'a.mp4',
    id: 'ok',
    start: 0,
    seconds: 8,
  });
});

test('chart data validates numeric JSON/CSV, exact columns and budgets', () => {
  const rows = [
    { x: 0, y: 1 },
    { x: 1, y: 2 },
  ];
  assert.deepEqual(parseChartData(JSON.stringify(rows), ['x', 'y']), rows);
  assert.deepEqual(parseChartData('x,y\n0,1\n1,2', ['x', 'y']), rows);
  for (const input of [
    '[]',
    '[{"x":0,"y":"text"}]',
    'x,y\n1,',
    'y,x\n0,1',
    '[{"x":0,"y":1,"z":2}]',
    JSON.stringify(Array(2001).fill(rows[0])),
  ])
    assert.throws(() => parseChartData(input, ['x', 'y']));
});
