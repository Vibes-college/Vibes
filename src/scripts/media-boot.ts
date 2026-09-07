import { onPageLoad } from './page-lifecycle';

onPageLoad((signal) => {
  let installed = false;
  const install = () => {
    if (installed || !document.querySelector('[data-media-root]')) return;
    installed = true;
    void import('./media')
      .then((module) => {
        if (!signal.aborted) module.installMedia(signal);
      })
      .catch(() => {
        installed = false;
      });
  };
  document.addEventListener('media:refresh', install, { signal });
  install();
});
