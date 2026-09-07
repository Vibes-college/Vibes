/** Keep native details usable without JS; animate measured height for reversible disclosure. */
export function enhanceDisclosures(root: HTMLElement, signal: AbortSignal) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  root.querySelectorAll<HTMLDetailsElement>('.reading-section').forEach((section) => {
    const summary = section.querySelector('summary')!;
    let animation: Animation | undefined;
    let desired = section.open;
    const reset = () => {
      animation?.cancel();
      animation = undefined;
      section.style.height = '';
      section.style.overflow = '';
      delete section.dataset.collapsing;
    };
    summary.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        desired = animation ? !desired : !section.open;
        const from = section.getBoundingClientRect().height;
        reset();
        if (reduced.matches) {
          section.open = desired;
          return;
        }
        section.open = true;
        section.toggleAttribute('data-collapsing', !desired);
        const to = desired ? section.scrollHeight : summary.getBoundingClientRect().height;
        section.style.overflow = 'hidden';
        animation = section.animate(
          { height: [`${from}px`, `${to}px`] },
          {
            duration: 260,
            easing: 'cubic-bezier(.22,.68,0,1)',
          },
        );
        animation.onfinish = () => {
          section.open = desired;
          reset();
        };
      },
      { signal },
    );
    signal.addEventListener('abort', reset, { once: true });
  });
}
