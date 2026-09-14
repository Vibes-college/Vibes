import { learningMaterials } from './site-content.ts';
import { compileProse } from './compile-prose.ts';

// The site and standalone exporter read the same Markdown content.
const materials = learningMaterials();
export const entries = await Promise.all(materials.entries.map(compileProse));
export const { index, capabilities } = materials;
