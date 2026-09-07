// A shared structural subset lets the compiler helpers operate on Markdown and HTML trees.
export interface Node {
  type: string;
  name?: string;
  tagName?: string;
  value?: string;
  url?: string;
  alt?: string;
  lang?: string | null;
  meta?: string | null;
  attributes?: Record<string, string | null | undefined>;
  properties?: Record<string, string | number | boolean | string[]>;
  data?: Record<string, unknown>;
  children?: Node[];
}
export const text = (value: string): Node => ({ type: 'text', value });
export function element(
  tagName: string,
  className = '',
  children: Node[] = [],
  properties: Node['properties'] = {},
): Node {
  return {
    type: 'element',
    tagName,
    properties: { ...(className ? { className: className.split(' ') } : {}), ...properties },
    children,
  };
}
export function block(
  tag: string,
  cls = '',
  children: Node[] = [],
  properties: Node['properties'] = {},
): Node {
  return {
    type: 'paragraph',
    data: {
      hName: tag,
      hProperties: { ...(cls ? { className: cls.split(' ') } : {}), ...properties },
    },
    children,
  };
}
export function plain(node: Node): string {
  return node.value ?? (node.children ?? []).map(plain).join('');
}
export function walk(node: Node, visit: (node: Node, parent?: Node) => void, parent?: Node) {
  visit(node, parent);
  for (const child of node.children ?? []) walk(child, visit, node);
}
const icons = new Set([
  'scroll-text',
  'info',
  'lightbulb',
  'circle-alert',
  'triangle-alert',
  'book-open',
  'shapes',
  'sparkles',
  'code',
  'arrow-right',
  'rocket',
  'clipboard',
  'clipboard-copy',
  'check',
  'chevron-down',
  'x',
  'zoom-in',
]);
export function icon(name: string, cls = ''): Node {
  if (!icons.has(name)) throw new Error(`Unknown prose icon: ${name}`);
  return block('span', `prose-icon ${cls}`, [], {
    'aria-hidden': 'true',
    style: `--prose-icon: url('/icons/prose/${name}.svg')`,
  });
}
export function safeUrl(value: string): string {
  if (/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(value)) return value;
  throw new Error(`Unsupported prose URL: ${value}`);
}
