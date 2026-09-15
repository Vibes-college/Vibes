/** Enforce the same byte limit even when a response omits Content-Length. */
export async function readLimited(response: Response, limit: number, type = '') {
  if (!response.ok || Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new Error('Media unavailable or too large');
  }
  const reader = response.body!.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
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
  return new Blob(chunks, { type });
}
