// A real response gives this viewer its own policy. The HTTP sandbox also applies
// when someone opens its URL directly; file contents arrive only from our parent.
(() => {
  const parentWindow = window.parent;
  if (parentWindow === window) return;
  const appOrigin = new URL(location.href).origin;
  let token;
  const record = (value, keys) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return (
      Reflect.ownKeys(value).length === keys.length &&
      keys.every((key) => descriptors[key] && 'value' in descriptors[key])
    );
  };
  const receive = (event) => {
    if (event.source !== parentWindow || event.origin !== appOrigin) return;
    const data = event.data;
    if (
      !token &&
      record(data, ['version', 'type', 'token']) &&
      data.version === 1 &&
      data.type === 'vibes-html-init' &&
      typeof data.token === 'string' &&
      /^[A-Za-z0-9_-]{16,128}$/.test(data.token)
    ) {
      token = data.token;
      parentWindow.postMessage({ version: 1, type: 'vibes-html-ready', token }, appOrigin);
      return;
    }
    if (
      !token ||
      !record(data, ['version', 'type', 'token', 'html']) ||
      data.version !== 1 ||
      data.type !== 'vibes-html-content' ||
      data.token !== token ||
      typeof data.html !== 'string' ||
      data.html.length > 64 * 1024 * 1024
    )
      return;
    // Remove the bridge before untrusted scripts run. Each new file uses a new
    // frame; a document which navigated itself must never receive another file.
    window.removeEventListener('message', receive);
    token = undefined;
    document.open();
    document.write(data.html);
    document.close();
  };
  window.addEventListener('message', receive);
})();
