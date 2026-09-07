import { mediaLimits } from '../../config/media.ts';

export function parseChartData(source: string, keys: string[]): Record<string, number>[] {
  if (new TextEncoder().encode(source).length > mediaLimits.dataBytes)
    throw new Error('Chart data exceeds 128KiB');
  let rows: unknown;
  if (source.trimStart().startsWith('[')) rows = JSON.parse(source);
  else {
    // Numeric data only: column names are schema ids, not arbitrary CSV prose.
    const lines = source.trim().split(/\r?\n/);
    const header = lines.shift()!.split(',');
    if (header.join(',') !== keys.join(','))
      throw new Error('CSV header does not match declared columns');
    rows = lines.map((line) => {
      const values = line.split(',');
      if (values.length !== keys.length || values.some((value) => !value.trim()))
        throw new Error('Invalid CSV row');
      return Object.fromEntries(keys.map((key, i) => [key, Number(values[i])]));
    });
  }
  if (!Array.isArray(rows) || !rows.length || rows.length > mediaLimits.dataRows)
    throw new Error('Chart data must contain 1–2000 rows');
  for (const row of rows) {
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      Object.keys(row).length !== keys.length ||
      keys.some((key) => typeof row[key] !== 'number' || !Number.isFinite(row[key]))
    )
      throw new Error('Chart rows must contain exactly the declared finite numeric columns');
  }
  return rows;
}
