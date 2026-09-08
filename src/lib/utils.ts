import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
// The official registry is namespaced so its utilities cannot restyle Explore.
const merge = extendTailwindMerge({ prefix: 'aui' });
export const cn = (...inputs: ClassValue[]) => merge(clsx(inputs));
