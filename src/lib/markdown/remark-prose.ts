import { block, icon, safeUrl, text, walk, type Node } from './tree.ts';
const variants: Record<string, string> = {
  note: 'scroll-text',
  info: 'info',
  tip: 'lightbulb',
  warning: 'circle-alert',
  danger: 'triangle-alert',
};
const allowed: Record<string, string[]> = {
  callout: ['variant', 'title'],
  subtitle: [],
  caption: [],
  frame: ['align', 'caption'],
  cards: ['columns'],
  card: ['title', 'icon', 'color', 'href', 'horizontal', 'cta', 'arrow'],
  steps: ['titleSize'],
  step: ['title', 'icon'],
  tabs: ['groupId'],
  tab: ['value'],
  codegroup: ['groupId'],
  image: ['src', 'alt', 'width', 'height', 'zoom', 'href'],
};
const boolean = (value: string | null | undefined) =>
  value !== undefined && value !== null && value !== 'false';
function required(attrs: Node['attributes'], key: string): string {
  if (!attrs?.[key]) throw new Error(`Prose component requires ${key}`);
  return attrs[key];
}
function convert(node: Node): Node {
  const name = node.name!.toLowerCase();
  const attrs = node.attributes ?? {};
  if (!allowed[name]) throw new Error(`Unknown Markdown component: ${node.name}`);
  for (const key of Object.keys(attrs))
    if (!allowed[name].includes(key)) throw new Error(`Unknown ${name} attribute: ${key}`);
  const children = node.children ?? [];
  switch (name) {
    case 'subtitle':
      return block('p', 'subtitle', children);
    case 'caption':
      return block('figcaption', 'caption', children);
    case 'frame': {
      const align = attrs.align || 'left';
      if (!['left', 'right', 'center', 'stretch'].includes(align))
        throw new Error('Invalid Frame alignment');
      return block(
        'figure',
        'frame',
        [
          ...children,
          ...(attrs.caption ? [block('figcaption', 'caption', [text(attrs.caption)])] : []),
        ],
        { 'data-align': align },
      );
    }
    case 'callout': {
      const variant = attrs.variant || 'note';
      if (!variants[variant]) throw new Error(`Invalid Callout variant: ${variant}`);
      const mark = icon(variants[variant], 'callout-icon');
      return block(
        'div',
        'callout',
        [
          block('div', 'callout-content', [
            ...(attrs.title ? [block('div', 'callout-title', [mark, text(attrs.title)])] : []),
            block('div', 'callout-body-container', [
              ...(!attrs.title ? [mark] : []),
              block('div', 'callout-body', children),
            ]),
          ]),
        ],
        { 'data-variant': variant },
      );
    }
    case 'cards': {
      const columns = attrs.columns || '3';
      if (!['1', '2', '3'].includes(columns)) throw new Error('Cards columns must be 1, 2, or 3');
      return block('div', 'cards', children, { style: `--columns: ${columns}` });
    }
    case 'card': {
      const href = attrs.href ? safeUrl(attrs.href) : '';
      const external = /^https?:/.test(href);
      const arrow = attrs.arrow === undefined ? external : boolean(attrs.arrow);
      if (attrs.color && !/^#[\da-f]{3,8}$/i.test(attrs.color))
        throw new Error('Card color must be hexadecimal');
      return block(
        href ? 'a' : 'div',
        `card${href ? ' interactive' : ''}${boolean(attrs.horizontal) ? ' horizontal' : ''}`,
        [
          block('div', 'card-content', [
            block('div', 'card-header', [
              ...(attrs.icon
                ? [
                    block(
                      'span',
                      'card-icon',
                      [icon(attrs.icon)],
                      attrs.color ? { style: `color: ${attrs.color}` } : {},
                    ),
                  ]
                : []),
              block('div', 'card-text', [
                block('p', 'card-title', [text(required(attrs, 'title'))]),
              ]),
            ]),
            ...(children.length ? [block('div', 'card-body', children)] : []),
          ]),
          ...(attrs.cta || arrow
            ? [
                block('div', 'card-footer', [
                  ...(attrs.cta ? [block('span', 'card-cta', [text(attrs.cta)])] : []),
                  ...(arrow ? [icon('arrow-right', 'card-arrow')] : []),
                ]),
              ]
            : []),
        ],
        href ? { href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } : {},
      );
    }
    case 'steps': {
      const size = attrs.titleSize || 'base';
      if (!['base', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(size))
        throw new Error('Invalid Steps titleSize');
      return block('ol', 'steps', children, { 'data-title-size': size });
    }
    case 'step':
      return block('li', 'step', [
        block(
          'div',
          'step-indicator',
          [attrs.icon ? icon(attrs.icon) : block('span', 'step-number')],
          { 'aria-hidden': 'true' },
        ),
        block('div', 'step-content', [
          block('p', 'step-title', [text(required(attrs, 'title'))]),
          block('div', 'step-body', children),
        ]),
      ]);
    case 'tabs':
    case 'codegroup':
      return block('div', name === 'tabs' ? 'tabs' : 'code-group', children, {
        'data-prose-group': name,
        'data-sync': attrs.groupId || '',
      });
    case 'tab':
      return block('div', 'tab-content', children, { 'data-tab-value': required(attrs, 'value') });
    case 'image': {
      const properties: NonNullable<Node['properties']> = {
        src: safeUrl(required(attrs, 'src')),
        alt: required(attrs, 'alt'),
        loading: 'lazy',
        decoding: 'async',
        'data-zoom':
          attrs.zoom === undefined
            ? node.type === 'textDirective'
              ? 'false'
              : 'true'
            : boolean(attrs.zoom)
              ? 'true'
              : 'false',
      };
      for (const dimension of ['width', 'height'])
        if (attrs[dimension]) {
          if (!/^[1-9]\d*$/.test(attrs[dimension])) throw new Error(`Invalid image ${dimension}`);
          properties[dimension] = Number(attrs[dimension]);
        }
      const img = block('img', '', [], properties);
      return attrs.href ? block('a', '', [img], { href: safeUrl(attrs.href) }) : img;
    }
  }
  throw new Error(`Unsupported component: ${name}`);
}
export default function remarkProse() {
  return (input: unknown) => {
    const tree = input as Node;
    // Postorder conversion preserves Markdown nested inside directives.
    function transform(node: Node, parent?: Node) {
      for (const child of node.children ?? []) transform(child, node);
      if (node.type.endsWith('Directive')) Object.assign(node, convert(node));
      if (node.type === 'blockquote') {
        const first = node.children?.[0]?.children?.[0];
        const match = first?.value?.match(/^\[!(NOTE|INFO|TIP|WARNING|DANGER)\](?:\s*\n|$)/);
        if (match && first) {
          first.value = first.value!.slice(match[0].length);
          Object.assign(
            node,
            convert({ ...node, name: 'callout', attributes: { variant: match[1].toLowerCase() } }),
          );
        } else node.data = { ...node.data, hProperties: { className: ['blockquote'] } };
      }
      if (node.type === 'image')
        node.data = {
          ...node.data,
          hProperties: {
            loading: 'lazy',
            decoding: 'async',
            'data-zoom': parent?.children?.length === 1 ? 'true' : 'false',
          },
        };
      if (node.type === 'code') {
        const title = node.meta?.match(/title=(?:"([^"]*)"|'([^']*)')/);
        node.data = {
          ...node.data,
          hProperties: {
            'data-code-title': title?.[1] ?? title?.[2] ?? '',
            'data-code-language': node.lang || 'text',
            'data-code-lines': /\bshowLineNumbers\b/.test(node.meta || '') ? 'true' : 'false',
          },
        };
      }
    }
    transform(tree);
    // Headings nested in component panels would conflict with the page's major-section navigation.
    walk(tree, (node) => {
      if (node.data?.hName === 'a')
        walk(node, (child) => {
          if (child.type === 'link') throw new Error('Card body cannot contain a nested link');
        });
    });
  };
}
