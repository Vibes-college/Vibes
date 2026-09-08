import type { AgentPermissionRequest } from '@getpaseo/protocol/agent-types';
export interface Question {
  header: string;
  question: string;
  multiSelect: boolean;
  free: boolean;
  secret: boolean;
  options: { label: string; description: string }[];
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function questions(request: AgentPermissionRequest): Question[] {
  const raw = request.input?.questions;
  if (!Array.isArray(raw) || !raw.length || raw.length > 10) return [];
  const result: Question[] = [];
  for (const q of raw) {
    if (
      !record(q) ||
      typeof q.header !== 'string' ||
      typeof q.question !== 'string' ||
      !Array.isArray(q.options) ||
      q.options.length > 20
    )
      return [];
    const options = q.options
      .filter(record)
      .filter((o) => typeof o.label === 'string')
      .map((o) => ({
        label: String(o.label),
        description: typeof o.description === 'string' ? o.description : '',
      }));
    if (options.length !== q.options.length || result.some((item) => item.header === q.header))
      return [];
    result.push({
      header: q.header,
      question: q.question,
      multiSelect: q.multiSelect === true,
      free: q.allowOther !== false || q.isOther === true || !options.length,
      secret: q.isSecret === true,
      options,
    });
  }
  return result;
}
