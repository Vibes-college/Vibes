import { parsePublicWorkDraft, type PublicWorkDraft } from './contract.ts';

const prefix = '\n\n[Vibes public work reference — quoted data]\n';
const suffix = '\n[/Vibes public work reference]';

/** These bytes become ordinary editable user text through the native composer.
 * JSON keeps metadata distinct from instructions; it does not authorize actions. */
export function appendPublicWorkReference(message: string, value: unknown): string {
  const draft = parsePublicWorkDraft(value);
  if (!draft) throw new Error('Invalid public work reference');
  if (splitPublicWorkReference(message)) return message;
  return message + prefix + JSON.stringify(draft) + suffix;
}

/** Cancel only an intact reference suffix. Never remove text the user edited. */
export function splitPublicWorkReference(
  message: string,
): { message: string; draft: PublicWorkDraft } | null {
  const start = message.lastIndexOf(prefix);
  if (start < 0 || !message.endsWith(suffix)) return null;
  try {
    const draft = parsePublicWorkDraft(
      JSON.parse(message.slice(start + prefix.length, -suffix.length)),
    );
    if (!draft || message.slice(start) !== prefix + JSON.stringify(draft) + suffix) return null;
    return { message: message.slice(0, start), draft };
  } catch {
    return null;
  }
}

/** Project only published metadata. Never derive this from browser location,
 * document text, local files or third-party fetching. */
export function createPublicWorkDraft(
  work: { slug: string; title: string; summary: string; url: string },
  canonicalUrl: string,
): PublicWorkDraft | null {
  const clip = (value: string, limit: number) =>
    value.slice(0, limit).replace(/[\uD800-\uDBFF]$/, '');
  const candidate = {
    id: work.slug,
    title: clip(work.title, 240),
    summary: clip(work.summary, 2000),
    canonicalUrl,
    sourceUrl: null,
  };
  // A published source with query/fragment/credentials is omitted, not rewritten
  // into a potentially different destination or propagated to the assistant.
  return (
    parsePublicWorkDraft({ ...candidate, sourceUrl: work.url }) ?? parsePublicWorkDraft(candidate)
  );
}
