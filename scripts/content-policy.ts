import { createProcessor } from '@mdx-js/mdx';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const demos = [
  'Tilt',
  'Button',
  'Tabs',
  'Switch',
  'Checkbox',
  'Radio',
  'Range',
  'Accordion',
  'Badge',
  'Marquee',
];
export const approvedImports = new Map<string, string>([
  ...demos.map((name): [string, string] => [
    `../../../components/demos/beui/${name}Demo`,
    `${name}Demo`,
  ]),
  ['../../../components/demos/MixDemo', 'MixDemo'],
]);
const html = new Set(
  'a abbr b blockquote br caption code dd del details div dl dt em figcaption figure h2 h3 h4 h5 h6 hr i img kbd li mark ol p pre s section small span strong sub summary sup table tbody td th thead tr ul'.split(
    ' ',
  ),
);
const attributes = new Set(
  'id class className title href target rel src alt width height loading open colspan colSpan rowspan rowSpan'.split(
    ' ',
  ),
);
interface Ast {
  type: string;
  name?: string;
  value?: unknown;
  source?: Ast;
  local?: { name: string };
  specifiers?: Ast[];
  attributes?: Ast[];
  expression?: Ast;
  children?: Ast[];
  data?: { estree?: { body: Ast[] } };
}

// Parse syntax only: never import or evaluate contributor JavaScript during classification.
export function isContentOnly(source: string, format: 'md' | 'mdx'): boolean {
  try {
    const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
    const tree = createProcessor({ format }).parse(body) as unknown as Ast;
    const imported = new Set<string>();
    const nodes: Ast[] = [];
    const collect = (node: Ast) => {
      nodes.push(node);
      node.children?.forEach(collect);
    };
    collect(tree);
    for (const node of nodes.filter((node) => node.type === 'mdxjsEsm')) {
      const statements = node.data?.estree?.body;
      if (!statements?.length) return false;
      for (const statement of statements) {
        const name = approvedImports.get(String(statement.source?.value));
        const [specifier, ...rest] = statement.specifiers ?? [];
        if (
          statement.type !== 'ImportDeclaration' ||
          !name ||
          rest.length ||
          specifier?.type !== 'ImportDefaultSpecifier' ||
          specifier.local?.name !== name ||
          imported.has(name)
        )
          return false;
        imported.add(name);
      }
    }
    return nodes.every((node) => {
      // Raw Markdown HTML is outside this restricted lane, including scripts and event handlers.
      if (node.type === 'html' || /Expression$/.test(node.type)) return false;
      if (!node.type.startsWith('mdxJsx')) return true;
      const component = imported.has(node.name ?? '');
      if (!component && !html.has(node.name ?? '')) return false;
      return (node.attributes ?? []).every((attribute) => {
        if (attribute.type !== 'mdxJsxAttribute' || !attribute.name) return false;
        if (component) {
          if (attribute.name === 'client:visible') return attribute.value === null;
          if (node.name !== 'MixDemo') return false;
          if (attribute.name === 'locale')
            return attribute.value === 'zh' || attribute.value === 'en';
          if (
            attribute.name !== 'initial' ||
            !attribute.value ||
            typeof attribute.value !== 'object'
          )
            return false;
          const value = attribute.value as Ast;
          const statements = value.data?.estree?.body;
          const expression = statements?.[0]?.expression;
          return (
            statements?.length === 1 &&
            expression?.type === 'Literal' &&
            typeof expression.value === 'number' &&
            Number.isFinite(expression.value) &&
            expression.value >= 0 &&
            expression.value <= 100
          );
        }
        if (!attributes.has(attribute.name) && !/^aria-[a-z-]+$/.test(attribute.name)) return false;
        if (attribute.value !== null && typeof attribute.value !== 'string') return false;
        if (['href', 'src'].includes(attribute.name) && typeof attribute.value === 'string') {
          const url = [...attribute.value]
            .filter((character) => character.charCodeAt(0) > 32 && character.charCodeAt(0) !== 127)
            .join('');
          if (/^[a-z][a-z\d+.-]*:/i.test(url) && !/^(https?:|mailto:)/i.test(url)) return false;
        }
        return true;
      });
    });
  } catch {
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = JSON.parse(readFileSync(0, 'utf8')) as { source: string; format: 'md' | 'mdx' }[];
  process.exitCode = files.every((file) => isContentOnly(file.source, file.format)) ? 0 : 1;
}
