import { element as el, plain, text, walk, type Node } from './tree.ts';
function classHas(node: Node, name: string) {
  return String(node.properties?.className ?? '')
    .split(/[, ]/)
    .includes(name);
}
function mark(name: string, cls = '') {
  return el('span', `prose-icon ${cls}`, [], {
    'aria-hidden': 'true',
    style: `--prose-icon: url('/icons/prose/${name}.svg')`,
  });
}
export function copyButton(): Node {
  return el(
    'button',
    'copy-button',
    [
      el('div', 'copy-button-icon-wrapper', [
        mark('clipboard', 'copy-button-icon copy-button-icon-default'),
        mark('clipboard-copy', 'copy-button-icon copy-button-icon-hover'),
      ]),
    ],
    { type: 'button', 'data-prose-copy': '', 'aria-label': '复制代码', title: '复制代码' },
  );
}
function codeBlock(pre: Node): Node {
  const code = pre.children?.find((child) => child.tagName === 'code');
  const props = code?.properties ?? {};
  const title = String(props['data-code-title'] ?? pre.properties?.['data-code-title'] ?? '');
  const language = String(
    props['data-code-language'] ?? pre.properties?.['data-code-language'] ?? 'text',
  );
  const numbered = (props['data-code-lines'] ?? pre.properties?.['data-code-lines']) === 'true';
  const raw = plain(code ?? pre).replace(/\n$/, '');
  const numbers = numbered
    ? [
        el(
          'div',
          'line-numbers',
          raw.split('\n').map((_, i) => el('div', 'line-number', [text(String(i + 1))])),
          { 'aria-hidden': 'true' },
        ),
      ]
    : [];
  const body = el('div', 'code-block-body', [
    el('div', 'code-scroll', [
      el('div', 'code-block-inner', [...numbers, el('div', 'code-container', [pre])]),
    ]),
    ...(!title ? [copyButton()] : []),
  ]);
  return el(
    'div',
    'code-block',
    [
      ...(title
        ? [
            el('div', 'code-block-header', [
              el('div', 'code-block-title', [text(title)]),
              copyButton(),
            ]),
          ]
        : []),
      body,
    ],
    {
      ...(title ? { 'data-has-title': '' } : {}),
      ...(numbered ? { 'data-show-line-numbers': '' } : {}),
      'data-code-title': title,
      'data-code-language': language,
    },
  );
}
function group(root: Node, uid: string) {
  const isCode = root.properties?.['data-prose-group'] === 'codegroup';
  const panels = (root.children ?? []).filter((node) => node.type === 'element');
  if (!panels.length) throw new Error('Empty prose tab group');
  if (
    panels.some((node) => (isCode ? !classHas(node, 'code-block') : !classHas(node, 'tab-content')))
  )
    throw new Error(
      `Invalid ${isCode ? 'CodeGroup' : 'Tabs'} children: ${panels.map((node) => node.tagName + ':' + node.properties?.className).join(', ')}`,
    );
  const titles = [
    ...new Set(
      panels.map((node) =>
        String(node.properties?.[isCode ? 'data-code-title' : 'data-tab-value'] ?? ''),
      ),
    ),
  ];
  if (titles.some((title) => !title)) throw new Error('Every code in a CodeGroup requires a title');
  if (!isCode && titles.length !== panels.length) throw new Error('Duplicate tab value');
  const languages = isCode
    ? [...new Set(panels.map((node) => String(node.properties?.['data-code-language'])))]
    : [];
  const signatures = new Set<string>();
  panels.forEach((panel, index) => {
    const value = String(panel.properties?.[isCode ? 'data-code-title' : 'data-tab-value']);
    const lang = String(panel.properties?.['data-code-language'] ?? '');
    const signature = `${value}:${lang}`;
    if (signatures.has(signature)) throw new Error(`Duplicate code variant: ${signature}`);
    signatures.add(signature);
    const properties = {
      'data-panel-value': value,
      'data-panel-language': lang,
      id: `${uid}-panel-${index}`,
      role: 'tabpanel',
      'aria-labelledby': `${uid}-tab-${titles.indexOf(value)}`,
      tabIndex: 0,
    };
    if (isCode) {
      panel.children = (panel.children ?? []).filter((child) => classHas(child, 'code-block-body'));
      walk(panel, (node) => {
        if (node.children)
          node.children = node.children.filter((child) => !classHas(child, 'copy-button'));
      });
      panel.properties = { ...properties, className: ['code-group-panel'] };
    } else panel.properties = { ...panel.properties, ...properties };
  });
  if (isCode && panels.length !== titles.length * languages.length)
    throw new Error('Every code title must provide each language in its group');
  const triggers = titles.map((title, index) =>
    el('button', isCode ? 'code-group-tab-trigger' : 'tab-trigger', [text(title)], {
      type: 'button',
      role: 'tab',
      id: `${uid}-tab-${index}`,
      'data-prose-tab': title,
      'aria-selected': index === 0 ? 'true' : 'false',
      'aria-controls': panels
        .filter((p) => p.properties?.['data-panel-value'] === title)
        .map((p) => p.properties!.id)
        .join(' '),
      tabIndex: index === 0 ? 0 : -1,
      'data-state': index === 0 ? 'active' : 'inactive',
    }),
  );
  const list = el('div', isCode ? 'code-group-tabs-list' : 'tabs-list', triggers, {
    role: 'tablist',
    'aria-label': isCode ? '代码文件' : '内容选项',
  });
  let header: Node;
  if (isCode) {
    const selector =
      languages.length > 1
        ? [
            el('div', 'prose-language', [
              el(
                'button',
                'select-trigger',
                [
                  el('span', '', [text(languageLabel(languages[0]))], {
                    'data-language-label': '',
                  }),
                  mark('chevron-down', 'select-icon'),
                ],
                {
                  type: 'button',
                  'data-size': 'sm',
                  'data-language-toggle': '',
                  'aria-label': '代码语言',
                  'aria-haspopup': 'listbox',
                  'aria-expanded': 'false',
                  'aria-controls': `${uid}-languages`,
                },
              ),
              el(
                'div',
                'prose-ui-select-content',
                [
                  el(
                    'div',
                    'prose-ui-select-viewport',
                    languages.map((language) =>
                      el(
                        'button',
                        'prose-ui-select-item',
                        [
                          text(languageLabel(language)),
                          el('span', 'prose-ui-select-item-indicator', [
                            mark('check', 'prose-ui-select-check-icon'),
                          ]),
                        ],
                        {
                          type: 'button',
                          role: 'option',
                          'data-language-option': language,
                          'aria-selected': language === languages[0] ? 'true' : 'false',
                          tabIndex: -1,
                        },
                      ),
                    ),
                  ),
                ],
                { id: `${uid}-languages`, role: 'listbox', 'aria-label': '代码语言', hidden: true },
              ),
            ]),
          ]
        : [];
    header = el('div', 'code-group-header', [
      titles.length > 1
        ? list
        : el('div', 'code-group-title', [text(titles[0])], { id: `${uid}-tab-0` }),
      el('div', 'code-group-header-actions', [...selector, copyButton()]),
    ]);
  } else header = el('div', 'tabs-header', [list]);
  root.properties = {
    ...root.properties,
    'data-selected-tab': titles[0],
    'data-selected-language': languages[0] || '',
  };
  // All panels remain readable until the progressive enhancement has initialized.
  root.children = [header, ...panels];
}
export function languageLabel(language: string) {
  return (
    (
      {
        ts: 'Typescript',
        typescript: 'Typescript',
        js: 'Javascript',
        javascript: 'Javascript',
        bash: 'Bash',
        shell: 'Shell',
        sh: 'Shell',
        python: 'Python',
        py: 'Python',
        json: 'JSON',
        html: 'HTML',
        css: 'CSS',
        text: 'Text',
      } as Record<string, string>
    )[language] ?? language
  );
}
export default function rehypeProse() {
  return (input: unknown, file: { messages: { source?: string; message: string }[] }) => {
    const mathError = file.messages.find((message) => message.source === 'rehype-katex');
    if (mathError) throw new Error(mathError.message);
    const tree = input as Node;
    let index = 0;
    function transform(node: Node, parent?: Node) {
      for (const child of node.children ?? []) transform(child, node);
      if (node.tagName === 'h2' && parent?.type !== 'root')
        node.properties = { ...node.properties, 'data-prose-nested': 'true' };
      if (node.tagName === 'pre' && node.children?.some((child) => child.tagName === 'code'))
        Object.assign(node, codeBlock({ ...node }));
      if (node.properties?.['data-prose-group']) group(node, `prose-${index++}`);
      if (node.tagName === 'table' && parent) {
        // A wrapper localizes wide-table scrolling without changing semantic column alignment.
        const at = parent.children!.indexOf(node);
        parent.children![at] = el('div', 'prose-table-scroll', [node], {
          tabIndex: 0,
          role: 'region',
          'aria-label': '表格，可横向滚动',
        });
      }
    }
    transform(tree);
  };
}
