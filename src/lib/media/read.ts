/** Enforce the same byte limit even when a response omits Content-Length. */
export async function readLimited(response: Response, limit: number) {
  if (!response.ok || Number(response.headers.get('content-length')) > limit)
    throw new Error('Media unavailable or too large');
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if ((size += value.length) > limit) {
        await reader.cancel();
        throw new Error('Media too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
