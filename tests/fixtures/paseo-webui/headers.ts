interface HeaderRule {
  path: RegExp;
  unset: string[];
  set: [string, string][];
}

/** The static path/splat subset used by this build; unsupported rules fail the fixture. */
export function parseFixtureHeaders(source: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let rule: HeaderRule | undefined;
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      if (!/^\/[a-zA-Z0-9_./*-]*$/.test(line) || (line.match(/\*/g)?.length || 0) > 1)
        throw new Error('Unsupported fixture header path: ' + line);
      const pattern = line.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('*', '.*');
      rule = { path: new RegExp('^' + pattern + '$'), unset: [], set: [] };
      rules.push(rule);
      continue;
    }
    if (!rule) throw new Error('Fixture header has no path rule.');
    const header = line.trim();
    const unset = header.match(/^!\s+([a-zA-Z0-9-]+)$/);
    if (unset) {
      rule.unset.push(unset[1].toLowerCase());
      continue;
    }
    const set = header.match(/^([a-zA-Z0-9-]+):\s*(.*)$/);
    if (!set) throw new Error('Unsupported fixture header declaration: ' + header);
    rule.set.push([set[1].toLowerCase(), set[2]]);
  }
  if (!rules.length) throw new Error('Missing built production header rules.');
  return rules;
}

export function fixtureHeadersForPath(
  rules: HeaderRule[],
  pathname: string,
  defaults: Record<string, string> = {},
): Record<string, string> {
  const headers = new Map(
    Object.entries(defaults).map(([key, value]) => [key.toLowerCase(), value]),
  );
  for (const rule of rules) {
    if (!rule.path.test(pathname)) continue;
    // Path-specific removals precede additions in that rule. Matching additions
    // without a removal combine, including CSP's multiple-policy semantics.
    for (const name of rule.unset) headers.delete(name);
    for (const [name, value] of rule.set)
      headers.set(name, headers.has(name) ? headers.get(name) + ', ' + value : value);
  }
  return Object.fromEntries(headers);
}
