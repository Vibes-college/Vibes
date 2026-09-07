// Enhance compiled HTML only; Markdown, syntax highlighting, and formulas are already rendered.
import { onPageLoad } from './page-lifecycle';
onPageLoad((signal) => {
  const article = document.querySelector<HTMLElement>('.reading-page .prose-ui');
  if (!article) return;
  const groups = [...article.querySelectorAll<HTMLElement>('[data-prose-group]')];
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let zoom: HTMLDialogElement | undefined;
  let opener: HTMLElement | undefined;
  const read = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const save = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Reading remains available in private or restricted storage. */
    }
  };
  const panels = (group: HTMLElement) =>
    [...group.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.hasAttribute('data-panel-value'),
    );
  function paint(group: HTMLElement) {
    const tab = group.dataset.selectedTab;
    const lang = group.dataset.selectedLanguage;
    panels(group).forEach((panel) => {
      panel.hidden =
        panel.dataset.panelValue !== tab ||
        Boolean(panel.dataset.panelLanguage && panel.dataset.panelLanguage !== lang);
    });
    group.querySelectorAll<HTMLElement>('[data-prose-tab]').forEach((button) => {
      if (button.closest('[data-prose-group]') !== group) return;
      const active = button.dataset.proseTab === tab;
      button.setAttribute('aria-selected', String(active));
      button.dataset.state = active ? 'active' : 'inactive';
      button.tabIndex = active ? 0 : -1;
    });
    group.querySelectorAll<HTMLElement>('[data-language-option]').forEach((option) => {
      const selected = option.dataset.languageOption === lang;
      option.setAttribute('aria-selected', String(selected));
      if (selected) group.querySelector('[data-language-label]')!.textContent = option.textContent;
    });
  }
  function select(group: HTMLElement, value: string, language = false) {
    const sync = group.dataset.sync;
    const targets = language
      ? groups
      : sync
        ? groups.filter((other) => other.dataset.sync === sync)
        : [group];
    targets.forEach((other) => {
      const key = language ? 'panelLanguage' : 'panelValue';
      if (!panels(other).some((panel) => panel.dataset[key] === value)) return;
      other.dataset[language ? 'selectedLanguage' : 'selectedTab'] = value;
      paint(other);
    });
    if (language || sync)
      save(language ? 'prose-ui-code-lang' : `prose-ui-code-tab-${sync}`, value);
  }
  function closeLanguages() {
    article!.querySelectorAll<HTMLElement>('[data-language-toggle]').forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
      const list = document.getElementById(button.getAttribute('aria-controls')!);
      if (list) list.hidden = true;
    });
  }
  function languageMenu(button: HTMLElement) {
    const open = button.getAttribute('aria-expanded') !== 'true';
    closeLanguages();
    if (!open) return;
    button.setAttribute('aria-expanded', 'true');
    const list = document.getElementById(button.getAttribute('aria-controls')!)!;
    list.hidden = false;
    list.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }
  async function copy(button: HTMLElement) {
    const owner = button.closest<HTMLElement>('[data-prose-group], .code-block')!;
    const current = owner.hasAttribute('data-prose-group')
      ? panels(owner).find((panel) => !panel.hidden)
      : owner;
    const code = current?.querySelector('pre code')?.textContent?.replace(/\n$/, '') ?? '';
    try {
      await navigator.clipboard.writeText(code);
      if (signal.aborted) return;
      button.dataset.copied = 'true';
      button.setAttribute('aria-label', '已复制');
      button.title = '已复制';
      const timer = setTimeout(() => {
        delete button.dataset.copied;
        button.setAttribute('aria-label', '复制代码');
        button.title = '复制代码';
        timers.delete(timer);
      }, 3000);
      timers.add(timer);
    } catch {
      if (!signal.aborted) {
        button.setAttribute('aria-label', '复制失败，请手动选择代码');
        button.title = '复制失败，请手动选择代码';
      }
    }
  }
  function openImage(image: HTMLImageElement) {
    if (image.closest('a') || image.dataset.zoom !== 'true') return;
    zoom?.remove();
    opener = image;
    zoom = document.createElement('dialog');
    zoom.className = 'prose-image-dialog';
    zoom.setAttribute('aria-label', image.alt || '图片预览');
    const full = document.createElement('img');
    // Re-request the optimized fallback so zoom is not limited to whichever
    // responsive candidate happened to render in the article.
    full.src = image.src;
    full.alt = image.alt;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prose-image-close';
    button.setAttribute('aria-label', '关闭图片');
    const symbol = document.createElement('img');
    symbol.src = '/icons/prose/x.svg';
    symbol.width = 20;
    symbol.height = 20;
    symbol.alt = '';
    button.append(symbol);
    zoom.append(full, button);
    document.body.append(zoom);
    zoom.addEventListener('click', () => zoom?.close(), { signal });
    zoom.addEventListener(
      'close',
      () => {
        zoom?.remove();
        opener?.focus({ preventScroll: true });
      },
      { signal },
    );
    zoom.showModal();
    button.focus();
  }
  article.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element;
      const button = target.closest<HTMLElement>(
        '[data-prose-tab], [data-language-toggle], [data-language-option], [data-prose-copy]',
      );
      if (button) {
        const group = button.closest<HTMLElement>('[data-prose-group]');
        if (button.hasAttribute('data-prose-tab')) select(group!, button.dataset.proseTab!);
        else if (button.hasAttribute('data-language-toggle')) languageMenu(button);
        else if (button.hasAttribute('data-language-option')) {
          select(group!, button.dataset.languageOption!, true);
          closeLanguages();
          group!.querySelector<HTMLElement>('[data-language-toggle]')?.focus();
        } else void copy(button);
      }
      const image = target.closest<HTMLImageElement>('img[data-zoom="true"]');
      if (image) openImage(image);
    },
    { signal },
  );
  article.addEventListener(
    'keydown',
    (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('img[data-zoom="true"]') && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openImage(target as HTMLImageElement);
        return;
      }
      if (
        target.hasAttribute('data-language-toggle') &&
        ['ArrowDown', 'ArrowUp'].includes(event.key)
      ) {
        event.preventDefault();
        languageMenu(target);
        return;
      }
      const tab = target.hasAttribute('data-prose-tab');
      const option = target.hasAttribute('data-language-option');
      if (!tab && !option) return;
      const group = target.closest<HTMLElement>('[data-prose-group]')!;
      if (option && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeLanguages();
        group.querySelector<HTMLElement>('[data-language-toggle]')?.focus();
        return;
      }
      const keys = tab
        ? ['ArrowLeft', 'ArrowRight', 'Home', 'End']
        : ['ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const list = [
        ...target.parentElement!.querySelectorAll<HTMLElement>(
          tab ? '[data-prose-tab]' : '[data-language-option]',
        ),
      ];
      const at = list.indexOf(target);
      const index =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? list.length - 1
            : (at + (event.key === keys[0] ? -1 : 1) + list.length) % list.length;
      list[index].focus();
      if (tab) select(group, list[index].dataset.proseTab!);
    },
    { signal },
  );
  document.addEventListener(
    'click',
    (event) => {
      if (!(event.target as Element).closest('.prose-language')) closeLanguages();
    },
    { signal },
  );
  document.addEventListener(
    'focusin',
    (event) => {
      if (!(event.target as Element).closest('.prose-language')) closeLanguages();
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') closeLanguages();
    },
    { signal },
  );
  article.querySelectorAll<HTMLImageElement>('img[data-zoom="true"]').forEach((image) => {
    if (!image.closest('a')) {
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', `放大图片：${image.alt}`);
    }
  });
  groups.forEach((group) => {
    const savedTab = group.dataset.sync ? read(`prose-ui-code-tab-${group.dataset.sync}`) : null;
    const savedLang = read('prose-ui-code-lang');
    if (savedTab && panels(group).some((panel) => panel.dataset.panelValue === savedTab))
      group.dataset.selectedTab = savedTab;
    if (savedLang && panels(group).some((panel) => panel.dataset.panelLanguage === savedLang))
      group.dataset.selectedLanguage = savedLang;
    paint(group);
  });
  article.dataset.proseReady = 'true';
  signal.addEventListener(
    'abort',
    () => {
      timers.forEach(clearTimeout);
      zoom?.remove();
    },
    { once: true },
  );
});
