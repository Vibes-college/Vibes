import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isContentOnly } from '../../scripts/content-policy.ts';

test('content lane accepts prose, fenced examples and registered static component composition', () => {
  assert.ok(isContentOnly('# Title\n\nText {not JavaScript}\n\n```js\nalert(1)\n```', 'md'));
  assert.ok(
    isContentOnly(
      "---\ntitle: 'Title'\n---\nimport TabsDemo from '../../../components/demos/beui/TabsDemo';\n\n<details>\n<summary>Demo</summary>\n\n<TabsDemo client:visible />\n\n</details>",
      'mdx',
    ),
  );
});

test('executable or unknown MDX and raw HTML cannot silently take the content lane', () => {
  for (const source of [
    '{process.exit()}',
    'export const x = 1',
    "import X from './evil.ts';",
    "import {TabsDemo} from '../../../components/demos/beui/TabsDemo';",
    '<Unknown />',
    '<div {...props} />',
    '<div onClick="alert(1)" />',
    '<div title={process.exit()} />',
    '<script>alert(1)</script>',
    '<iframe src="https://example.com" />',
    '<a href="javascript:alert(1)">click</a>',
    '<a href="java&#x73;cript:alert(1)">click</a>',
    '<div set:html="<script />" />',
    '<div>',
  ])
    assert.equal(isContentOnly(source, 'mdx'), false, source);
  assert.equal(isContentOnly('<script>alert(1)</script>', 'md'), false);
});

test('registered MixDemo accepts only its bounded literal props', () => {
  const prefix = "import MixDemo from '../../../components/demos/MixDemo';\n\n";
  assert.ok(isContentOnly(prefix + '<MixDemo locale="zh" initial={35} client:visible />', 'mdx'));
  for (const props of [
    'initial={101}',
    'initial={1+2}',
    'initial={NaN}',
    'locale="other"',
    'style={{color:"red"}}',
  ])
    assert.equal(isContentOnly(prefix + `<MixDemo ${props} client:visible />`, 'mdx'), false);
});
