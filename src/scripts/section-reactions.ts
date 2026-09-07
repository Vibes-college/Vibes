export function installReactions(
  signal: AbortSignal,
  reactionFaces: string[],
  reactionKey: (id: string) => string,
  showReaction: (button: HTMLButtonElement, face: string) => void,
) {
  const noop = () => {};
  if (signal.aborted) return noop;
  const zh = document.documentElement.lang.startsWith('zh');
  const labels = zh
    ? ['喜爱', '惊喜', '困惑', '感动', '开心']
    : ['Love', 'Amazed', 'Confused', 'Moved', 'Happy'];
  const menu = document.createElement('div');
  menu.className = 'reaction-menu';
  menu.popover = 'manual';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', zh ? '选择表情' : 'Choose a reaction');
  const overlay = document.createElement('div');
  overlay.className = 'reaction-particles';
  overlay.popover = 'manual';
  overlay.setAttribute('aria-hidden', 'true');
  const choices = reactionFaces.map((face, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = face;
    button.setAttribute('aria-label', labels[index]);
    button.setAttribute('role', 'menuitemradio');
    button.setAttribute('aria-checked', 'false');
    menu.append(button);
    return button;
  });
  document.body.append(menu, overlay);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let anchor: HTMLButtonElement | undefined;
  let down = false;
  let anchorTop = 0;
  let hold: ReturnType<typeof setInterval> | undefined;
  let pressed: HTMLButtonElement | undefined;
  const particles = new Set<HTMLElement>();
  function stopHold() {
    clearInterval(hold);
    hold = undefined;
    pressed = undefined;
    choices.forEach((button) => button.removeAttribute('data-hover'));
  }
  function clearParticles() {
    for (const particle of particles) {
      particle.getAnimations().forEach((animation) => animation.cancel());
      particle.remove();
    }
    particles.clear();
    overlay.hidePopover();
  }
  function close() {
    stopHold();
    clearParticles();
    menu.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    menu.hidePopover();
    anchor?.setAttribute('aria-expanded', 'false');
    anchor = undefined;
  }
  function burst(button: HTMLButtonElement, face: string) {
    if (reduced.matches) return;
    const rect = button.getBoundingClientRect();
    overlay.showPopover();
    for (let i = 0; i < 5 && particles.size < 40; i++) {
      const particle = document.createElement('span');
      particle.className = 'reaction-particle';
      particle.textContent = face;
      particle.style.left = `${rect.left + rect.width / 2 - 13}px`;
      particle.style.top = `${rect.top + rect.height / 2 - 13}px`;
      overlay.append(particle);
      particles.add(particle);
      const drift = (Math.random() - 0.5) * 156;
      const travel = (down ? 1 : -1) * 450 * (0.86 + Math.random() * 0.14);
      const tilt = (1 + Math.random() * 3) * (drift < 0 ? -1 : 1);
      const scale = 0.78 + Math.random() * 0.27;
      const transform = (t: number, s: number, rotate: number) =>
        `translate(${drift * t}px,${travel * t}px) scale(${s}) rotate(${rotate}deg)`;
      const animation = particle.animate(
        [
          { transform: transform(0, 0.6, 0), opacity: 0, filter: 'blur(0)', offset: 0 },
          { transform: transform(0.03, scale, tilt), opacity: 1, filter: 'blur(0)', offset: 0.03 },
          {
            transform: transform(0.12, scale * 1.15, tilt),
            opacity: 1,
            filter: 'blur(0)',
            offset: 0.12,
          },
          {
            transform: transform(0.65, scale, -tilt * 0.65),
            opacity: 1,
            filter: 'blur(2px)',
            offset: 0.65,
          },
          {
            transform: transform(1, scale * 0.75, tilt * 0.35),
            opacity: 0,
            filter: 'blur(6px)',
            offset: 1,
          },
        ],
        {
          duration: 1400 + Math.random() * 400,
          delay: i * 250,
          easing: 'cubic-bezier(.4,.3,.5,1)',
          fill: 'both',
        },
      );
      animation.onfinish = () => {
        particle.remove();
        particles.delete(particle);
        if (!particles.size) overlay.hidePopover();
      };
    }
  }
  function select(button: HTMLButtonElement) {
    if (!anchor) return;
    const face = reactionFaces[choices.indexOf(button)];
    showReaction(anchor, face);
    choices.forEach((choice) => choice.setAttribute('aria-checked', String(choice === button)));
    try {
      localStorage.setItem(reactionKey(anchor.dataset.reaction!), face);
    } catch {
      /* This session still works when browser storage is blocked or full. */
    }
    burst(button, face);
  }
  menu.addEventListener(
    'pointerdown',
    (event) => {
      const button = (event.target as Element).closest('button');
      if (!(button instanceof HTMLButtonElement)) return;
      event.preventDefault();
      stopHold();
      pressed = button;
      select(button);
      hold = setInterval(() => {
        if (pressed) select(pressed);
      }, 550);
    },
    { signal },
  );
  menu.addEventListener(
    'pointermove',
    (event) => {
      if (!pressed) return;
      const button = document.elementFromPoint(event.clientX, event.clientY)?.closest('button');
      if (button instanceof HTMLButtonElement && choices.includes(button)) {
        choices.forEach((choice) => choice.toggleAttribute('data-hover', choice === button));
        if (pressed !== button) {
          pressed = button;
          select(button);
        }
      } else stopHold();
    },
    { signal },
  );
  menu.addEventListener('pointerleave', stopHold, { signal });
  // Keyboard-generated clicks have no preceding pointerdown.
  menu.addEventListener(
    'click',
    (event) => {
      if (event.detail === 0 && event.target instanceof HTMLButtonElement) select(event.target);
    },
    { signal },
  );
  menu.addEventListener(
    'keydown',
    (event) => {
      const index = choices.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? 4
            : event.key === 'ArrowRight'
              ? (index + 1) % 5
              : event.key === 'ArrowLeft'
                ? (index + 4) % 5
                : -1;
      if (next >= 0) {
        event.preventDefault();
        choices[next].focus();
      }
      if (event.key === 'Tab') close();
    },
    { signal },
  );
  document.addEventListener('pointerup', stopHold, { signal });
  document.addEventListener('pointercancel', stopHold, { signal });
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (anchor && !menu.contains(event.target as Node) && !anchor.contains(event.target as Node))
        close();
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && anchor) {
        const previous = anchor;
        close();
        previous.focus({ preventScroll: true });
      }
    },
    { signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) close();
    },
    { signal },
  );
  window.addEventListener('wheel', close, { signal, passive: true });
  window.addEventListener(
    'scroll',
    () => {
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) {
        close();
        return;
      }
      const delta = rect.top - anchorTop;
      if (Math.abs(delta) > 1) {
        menu.style.top = `${Math.max(8, Math.min(innerHeight - menu.offsetHeight - 8, parseFloat(menu.style.top) + delta))}px`;
        anchorTop = rect.top;
      }
    },
    { signal, passive: true },
  );
  window.addEventListener('resize', close, { signal });
  reduced.addEventListener('change', close, { signal });
  signal.addEventListener(
    'abort',
    () => {
      close();
      menu.remove();
      overlay.remove();
    },
    { once: true },
  );
  return (button: HTMLButtonElement) => {
    if (anchor === button) {
      close();
      return;
    }
    close();
    anchor = button;
    button.setAttribute('aria-expanded', 'true');
    choices.forEach((choice) =>
      choice.setAttribute(
        'aria-checked',
        String(choice.textContent === button.querySelector('[data-reaction-value]')?.textContent),
      ),
    );
    const rect = button.getBoundingClientRect();
    anchorTop = rect.top;
    down = button === document.querySelector('[data-reaction]') || rect.top < 100;
    menu.dataset.direction = down ? 'down' : 'up';
    menu.showPopover();
    const width = menu.offsetWidth;
    const left = Math.max(
      8,
      Math.min(innerWidth - width - 8, rect.left + rect.width / 2 - width / 2),
    );
    menu.style.left = `${left}px`;
    menu.style.top = `${Math.max(8, Math.min(innerHeight - menu.offsetHeight - 8, down ? rect.bottom + 8 : rect.top - menu.offsetHeight - 8))}px`;
    menu.style.setProperty(
      '--tail',
      `${Math.max(12, Math.min(width - 20, rect.left + rect.width / 2 - left - 6))}px`,
    );
    if (!reduced.matches) {
      menu.animate(
        [
          { opacity: 0, transform: `translateY(${down ? -10 : 10}px) scale(.85)` },
          { opacity: 1, transform: 'translateY(0) scale(1.035)', offset: 0.65 },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 320, easing: 'cubic-bezier(.2,.8,.3,1)' },
      );
      choices.forEach((choice, index) =>
        choice.animate(
          [
            { opacity: 0, transform: 'scale(.4)' },
            { opacity: 1, transform: 'scale(1.12)', offset: 0.65 },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 280, delay: 40 + index * 35, fill: 'backwards' },
        ),
      );
    }
    choices[0].focus({ preventScroll: true });
  };
}
