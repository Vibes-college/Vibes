import { parsePublicWorkDraft, type PublicWorkDraft } from './contract.ts';

export type PublicWorkReference = Omit<PublicWorkDraft, 'requestId'>;

/** Published metadata has no request identity. Merely visiting a page must
 * never become an instruction to change the native composer. */
export function parsePublicWorkReference(value: unknown): PublicWorkReference | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = ['id', 'title', 'canonicalUrl'];
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (
    Reflect.ownKeys(value).length !== keys.length ||
    !keys.every((key) => descriptors[key] && 'value' in descriptors[key])
  )
    return null;
  const parsed = parsePublicWorkDraft({
    requestId: 'metadata-validation',
    id: descriptors.id.value,
    title: descriptors.title.value,
    canonicalUrl: descriptors.canonicalUrl.value,
  });
  return parsed ? { id: parsed.id, title: parsed.title, canonicalUrl: parsed.canonicalUrl } : null;
}

/** Project published identity only, never browser location, article body, local
 * files, source-site query strings or credentials. */
export function createPublicWorkReference(
  work: { slug: string; title: string },
  canonicalUrl: string,
): PublicWorkReference | null {
  return parsePublicWorkReference({
    id: work.slug,
    title: work.title.slice(0, 240).replace(/[\uD800-\uDBFF]$/, ''),
    canonicalUrl,
  });
}

/** Only the explicit article entry supplies a new requestId. The native
 * composer owns attachment persistence, deletion and delivery deduplication. */
export function createPublicWorkDraft(value: unknown, requestId: string): PublicWorkDraft | null {
  const reference = parsePublicWorkReference(value);
  return reference ? parsePublicWorkDraft({ ...reference, requestId }) : null;
}
