import type { WorkCapability } from './model.ts';
import {
  learningSource,
  learningReference,
  learningSourceUrl,
} from '../../../lib/content/learning-sources.ts';

const roles = new Set([
  'navigate',
  'introduce',
  'showcase',
  'compare',
  'answer',
  'act',
  'feedback',
  'theme',
]);
const values: Record<string, string[]> = {
  framework: ['react', 'other'],
  input: ['pointer', 'touch'],
  externalData: ['allowed', 'blocked'],
};
const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(string);
const list = (value: unknown, test: (item: unknown) => boolean) =>
  Array.isArray(value) && value.every(test);

export function validateCapabilities(value: unknown): WorkCapability[] {
  if (!Array.isArray(value) || !value.length) throw new Error('组合材料为空或格式错误。');
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const work of value) {
    const source = record(work) ? learningSource(work.sourceId) : null;
    const prefix =
      source && record(work)
        ? `https://github.com/${source.repository}/blob/${work.sourceRevision}/`
        : '';
    if (
      !record(work) ||
      !source ||
      !string(work.id) ||
      ids.has(work.id) ||
      !string(work.slug) ||
      slugs.has(work.slug) ||
      !/^[a-z0-9-]+$/.test(work.slug) ||
      !string(work.title) ||
      !string(work.family) ||
      !strings(work.roles) ||
      !work.roles.length ||
      work.roles.some((role) => !roles.has(role)) ||
      !strings(work.provides) ||
      !strings(work.adaptations) ||
      !['native', 'adaptation', 'unknown'].includes(String(work.reducedMotion)) ||
      !['decorativeTransition', 'sourceReviewed', 'browserObserved'].every(
        (key) => typeof work[key] === 'boolean',
      ) ||
      !['sourceRevision', 'contentRevision', 'capabilityRevision'].every((key) =>
        string(work[key]),
      ) ||
      !list(
        work.requires,
        (requirement) =>
          record(requirement) &&
          string(requirement.key) &&
          values[requirement.key]?.includes(String(requirement.value)) &&
          string(requirement.reason) &&
          (requirement.adaptation === undefined || string(requirement.adaptation)),
      ) ||
      !list(
        work.resources,
        (resource) =>
          record(resource) &&
          string(resource.name) &&
          ['global', 'instance'].includes(String(resource.scope)) &&
          ['exclusive', 'read'].includes(String(resource.mode)) &&
          string(resource.phase),
      ) ||
      (work.source !== undefined &&
        (!source ||
          !string(work.source) ||
          !work.source.startsWith(prefix) ||
          work.source !==
            learningSourceUrl(
              work.sourceId,
              work.sourceRevision,
              work.source.slice(prefix.length),
            ))) ||
      (work.reference !== undefined &&
        (!string(work.reference) ||
          work.reference !== learningReference(work.sourceId, work.sourceSlug ?? work.slug)))
    )
      throw new Error('组合材料字段缺失、值无效或标识重复。');
    ids.add(work.id);
    slugs.add(work.slug);
  }
  return value as WorkCapability[];
}
