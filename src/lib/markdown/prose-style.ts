import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const id = 'virtual:prose-ui.css';

// Resolve design tokens on the prose container, not the page root. This preserves the
// existing site shell and makes nested light/dark samples resolve their own aliases.
export function proseStyle() {
  return {
    name: 'prose-ui-container-tokens',
    resolveId(source: string) {
      if (source === id) return `\0${id}`;
    },
    load(source: string) {
      if (source === `\0${id}`)
        return readFileSync(require.resolve('@prose-ui/style/prose-ui.css'), 'utf8').replaceAll(
          ':root',
          ':where(.prose-ui)',
        );
    },
  };
}
