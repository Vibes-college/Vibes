// Inspired by Rare UI Scroll Progress: https://www.rareui.com/components/scrollprogressindicator
// Native implementation: geometry is cached on resize, and the ring sleeps when settled.
export function installReadingProgress(root: HTMLElement, signal: AbortSignal) {
  const nav = root.querySelector<HTMLElement>('.reading-progress');
  if (!nav) return;
  const reading = root.querySelector<HTMLElement>('#reading')!;
  const surface = nav.querySelector<HTMLElement>('.progress-surface')!;
  const toggle = nav.querySelector<HTMLButtonElement>('button')!;
  const label = nav.querySelector<HTMLElement>('.progress-label')!;
  const menu = nav.querySelector<HTMLElement>('.progress-menu')!;
  const ring = nav.querySelector<SVGCircleElement>('[data-progress-ring]')!;
  const links = [...menu.querySelectorAll<HTMLAnchorElement>('a')];
  const headings = links.map((link) =>
    document.getElementById(decodeURIComponent(link.hash.slice(1)))!,
  );
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let tops: number[] = [],
    start = 0,
    end = 1,
    active = -1,
    frame = 0;
  let value = 0,
    velocity = 0,
    last = 0,
    open = false;
  let sizeAnimation: Animation | undefined;
  let labelAnimation: Animation | undefined;
  let outgoing: HTMLElement | undefined;
  // Sample an underdamped spring once; WAAPI interpolates without a JS animation loop.
  const spring = Array.from({ length: 31 }, (_, i) => {
    const t = i / 30;
    return i === 30 ? 1 : 1 - Math.exp(-8 * t) * (Math.cos(10 * t) + 0.8 * Math.sin(10 * t));
  });
  function resizeSurface() {
    const before = surface.getBoundingClientRect();
    const target = (open ? menu : toggle).getBoundingClientRect();
    sizeAnimation?.cancel();
    surface.style.width = `${target.width}px`;
    surface.style.height = `${target.height}px`;
    surface.style.borderRadius = open ? '26px' : '22px';
    if (reduced.matches || !before.width) return;
    sizeAnimation = surface.animate(
      spring.map((p) => ({
        width: `${before.width + (target.width - before.width) * p}px`,
        height: `${before.height + (target.height - before.height) * p}px`,
        borderRadius: `${(open ? 22 : 26) + (open ? 4 : -4) * p}px`,
      })),
      { duration: 500 },
    );
  }
  function setOpen(next: boolean, focus = false) {
    open = next;
    nav!.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.inert = open;
    menu.inert = !open;
    resizeSurface();
    if (focus) (open ? links[Math.max(active, 0)] : toggle).focus({ preventScroll: true });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function measure() {
    start = reading.getBoundingClientRect().top + scrollY;
    end = Math.max(start + 1, reading.getBoundingClientRect().bottom + scrollY - innerHeight);
    tops = headings.map((h) => h.getBoundingClientRect().top + scrollY);
    resizeSurface();
    schedule();
  }
  function update(now: number) {
    frame = 0;
    const visible = scrollY >= start - 32;
    if (nav!.hidden === visible) {
      nav!.hidden = !visible;
      if (visible) resizeSurface();
      else if (open) setOpen(false);
    }
    const target = scrollY >= end - 1 ? 1 : Math.max(0, (scrollY - start) / (end - start));
    // Stable semi-implicit integration, including after background-tab throttling.
    const dt = Math.min((now - last) / 1000 || 0.016, 0.032);
    last = now;
    velocity += (100 * (target - value) - 25 * velocity) * dt;
    value += velocity * dt;
    if (reduced.matches || (Math.abs(target - value) < 0.0005 && Math.abs(velocity) < 0.002)) {
      value = target;
      velocity = 0;
    }
    ring.setAttribute(
      'stroke-dashoffset',
      String(Math.round((1 - Math.max(0, Math.min(1, value))) * 1000) / 10),
    );
    let index = Math.max(
      0,
      tops.findLastIndex((top) => top <= scrollY + 120),
    );
    if (target === 1) index = links.length - 1;
    if (active !== index) {
      active = index;
      links.forEach((link, i) => {
        if (i === index) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      labelAnimation?.cancel();
      outgoing?.remove();
      if (!reduced.matches) {
        outgoing = label.cloneNode(true) as HTMLElement;
        outgoing.className = 'progress-outgoing';
        outgoing.setAttribute('aria-hidden', 'true');
        toggle.append(outgoing);
        const ghost = outgoing;
        ghost.animate(
          [
            { opacity: 1, filter: 'blur(0)' },
            { opacity: 0, filter: 'blur(1.5px)' },
          ],
          { duration: 220 },
        ).onfinish = () => ghost.remove();
      }
      label.textContent = links[index].textContent?.trim() ?? '';
      if (!reduced.matches)
        labelAnimation = label.animate(
          [
            { opacity: 0, filter: 'blur(1.5px)', transform: 'translateY(3px)' },
            { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
          ],
          { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' },
        );
      resizeSurface();
    }
    if (visible && value !== target) schedule();
  }
  toggle.addEventListener('click', () => setOpen(true, true), { signal });
  menu.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element).closest('a');
      if (!link) return;
      setOpen(false);
      // Let the real anchor own URL/history and native scrolling; focus the destination.
      const heading = headings[links.indexOf(link)];
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    },
    { signal },
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (open && !nav!.contains(event.target as Node)) setOpen(false);
    },
    { signal },
  );
  nav.addEventListener(
    'focusout',
    (event) => {
      if (open && event.relatedTarget && !nav!.contains(event.relatedTarget as Node))
        setOpen(false);
    },
    { signal },
  );
  nav.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setOpen(false, true);
      }
    },
    { signal },
  );
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', measure, { signal });
  reduced.addEventListener(
    'change',
    () => {
      sizeAnimation?.cancel();
      labelAnimation?.cancel();
      schedule();
    },
    { signal },
  );
  const observer = new ResizeObserver(measure);
  observer.observe(reading);
  observer.observe(root.querySelector('.detail-cover')!);
  measure();
  signal.addEventListener(
    'abort',
    () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizeAnimation?.cancel();
      labelAnimation?.cancel();
    },
    { once: true },
  );
}
