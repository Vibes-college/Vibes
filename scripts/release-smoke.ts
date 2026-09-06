// 轮询短暂的边缘传播，必须看到确切SHA及两个语言页面；失败绝不报告上线完成。
export async function smokeRelease(origin: string, sha: string): Promise<void> {
  let error: unknown;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const marker = await fetch(`${origin}/__release.json?t=${Date.now()}`, {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      });
      if (!marker.ok || ((await marker.json()) as { sha?: string }).sha !== sha)
        throw new Error('Live deployment SHA mismatch');
      for (const locale of ['zh', 'en']) {
        const page = await fetch(`${origin}/${locale}/`, { signal: AbortSignal.timeout(10000) });
        const body = await page.text();
        if (!page.ok || !body.includes('<html') || !body.includes('Vibes'))
          throw new Error(`Live ${locale} page failed`);
      }
      return;
    } catch (cause) {
      error = cause;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  throw error;
}
