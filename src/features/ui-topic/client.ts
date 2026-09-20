import {
  getResource,
  getGroup,
  buildTask,
  vocabulary,
  sourceWithLicense,
  type Selection,
  type Group,
} from './catalog.ts';
import { renderDetail } from './render.ts';
import { onPageLoad } from '../../scripts/page-lifecycle.ts';

export function bootTopic(signal: AbortSignal): void {
  const roots = [...document.querySelectorAll<HTMLElement>('[data-ui-topic]')];
  if (!roots.length) return;
  const selected = new Map<string, Selection>();
  const edits = new Map<string, Selection>();
  const dialog = document.querySelector<HTMLDialogElement>('[data-resource-dialog]');
  const taskDialog = document.querySelector<HTMLDialogElement>('[data-task-dialog]');
  const tray = document.querySelector<HTMLElement>('[data-selection-tray]');
  if (!dialog || !taskDialog || !tray) return;
  // Article sections may be hidden or clipped. Keep overlays outside that tree.
  const overlay = document.createElement('div');
  overlay.className = 'ui-topic not-prose';
  overlay.dataset.ready = 'true';
  overlay.dataset.uiTopicOverlay = '';
  overlay.dataset.articleInteractive = '';
  overlay.dataset.pagefindIgnore = '';
  overlay.append(dialog, taskDialog, tray);
  document.body.append(overlay);
  let previewTimer: ReturnType<typeof setTimeout> | undefined;
  let currentId = '';
  let currentList: string[] = [];
  let resourceOpener: HTMLElement | null = null;
  let taskOpener: HTMLElement | null = null;
  let savedOverflow = '';
  let locked = false;
  let activeVideo: HTMLVideoElement | undefined;
  const urls = new Map<string, string>();
  roots.forEach((r) => (r.dataset.ready = 'true'));
  dialog.dataset.ready = 'true';
  taskDialog.dataset.ready = 'true';
  const status = (selector: string, message: string) => {
    const node = document.querySelector<HTMLElement>(selector);
    if (node) node.textContent = message;
  };
  function lockScroll() {
    if (!locked) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      locked = true;
    }
  }
  function restoreScroll() {
    if (!dialog!.open && !taskDialog!.open && locked) {
      document.body.style.overflow = savedOverflow;
      locked = false;
    }
  }
  function pauseVideos() {
    document.querySelectorAll<HTMLVideoElement>('.ui-topic video').forEach((v) => v.pause());
    activeVideo = undefined;
  }
  async function playVideo(video: HTMLVideoElement) {
    if (activeVideo && activeVideo !== video) activeVideo.pause();
    activeVideo = video;
    if (!video.getAttribute('src') && video.dataset.videoSrc) video.src = video.dataset.videoSrc;
    try {
      await video.play();
    } catch {
      if (activeVideo === video) activeVideo = undefined;
      // A blocked video never hides the poster or the interactive preview.
    }
  }
  const visibility = new IntersectionObserver((entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting)
        entry.target.querySelectorAll<HTMLVideoElement>('video').forEach((v) => v.pause());
    }),
  );
  function connectVisuals(root: ParentNode) {
    root.querySelectorAll<HTMLElement>('.ut-thumb').forEach((frame) => {
      visibility.observe(frame);
    });
    root.querySelectorAll<HTMLImageElement>('.ut-thumb img').forEach((img) => {
      const fail = () => {
        if (
          !img.closest('[data-ui-topic],.ut-dialog') ||
          img.nextElementSibling?.classList.contains('ut-image-failure')
        )
          return;
        const msg = document.createElement('p');
        msg.className = 'ut-image-failure';
        msg.textContent = '预览图未载入。点开仍可试用并查看源码。';
        img.hidden = true;
        img.insertAdjacentElement('afterend', msg);
      };
      img.addEventListener('error', fail, { signal, once: true });
      if (img.complete && img.naturalWidth === 0 && img.src) fail();
    });
  }
  connectVisuals(document);
  function defaultSelection(id: string): Selection {
    return { id, borrow: [getResource(id)?.borrow || '布局'], target: '', changes: '' };
  }
  function readEditor(): Selection | null {
    const editor = dialog!.querySelector<HTMLFormElement>('[data-editor-resource]');
    if (!editor || !currentId) return null;
    return {
      id: currentId,
      borrow: [...editor.querySelectorAll<HTMLInputElement>('input[name=borrow]:checked')].map(
        (n) => n.value,
      ),
      target: editor.querySelector<HTMLInputElement>('[name=target]')!.value.slice(0, 200),
      changes: editor.querySelector<HTMLTextAreaElement>('[name=changes]')!.value.slice(0, 1200),
    };
  }
  function rememberEditor() {
    const item = readEditor();
    if (!item) return;
    edits.set(item.id, item);
    if (selected.has(item.id)) selected.set(item.id, item);
  }
  function refreshSelected() {
    document.querySelectorAll<HTMLButtonElement>('[data-toggle-resource]').forEach((b) => {
      const on = selected.has(b.dataset.toggleResource!);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? '✓' : '＋';
      b.setAttribute(
        'aria-label',
        `${on ? '取消选择' : '选择'}${getResource(b.dataset.toggleResource!)?.title || ''}`,
      );
    });
    const tray = document.querySelector<HTMLElement>('[data-selection-tray]');
    if (tray) tray.hidden = selected.size === 0;
    document
      .querySelectorAll('[data-selection-count]')
      .forEach((n) => (n.textContent = String(selected.size)));
    const add = dialog!.querySelector<HTMLButtonElement>('[data-add-current]');
    if (add) add.textContent = selected.has(currentId) ? '更新方案 ✓' : '加入方案';
  }
  function addSelection(item: Selection): boolean {
    if (selected.size >= 12 && !selected.has(item.id)) {
      status('[data-editor-status]', '一次最多选择 12 项。先在方案里移除一项。');
      status('[data-selection-status]', '最多选择12项，请先移除一项。');
      return false;
    }
    status('[data-selection-status]', '');
    selected.set(item.id, item);
    edits.set(item.id, item);
    refreshSelected();
    return true;
  }
  function showResource(id: string, opener?: HTMLElement, list?: string[]) {
    const r = getResource(id);
    if (!r) return;
    rememberEditor();
    pauseVideos();
    clearTimeout(previewTimer);
    currentId = id;
    if (list) currentList = list;
    if (opener) resourceOpener = opener;
    dialog!.querySelector('[data-detail-body]')!.innerHTML = renderDetail(r);
    dialog!.querySelector('#ut-resource-title')!.textContent = r.title;
    const old = edits.get(id) || selected.get(id) || defaultSelection(id);
    dialog!
      .querySelectorAll<HTMLInputElement>('input[name=borrow]')
      .forEach((n) => (n.checked = old.borrow.includes(n.value)));
    dialog!.querySelector<HTMLInputElement>('[name=target]')!.value = old.target;
    dialog!.querySelector<HTMLTextAreaElement>('[name=changes]')!.value = old.changes;
    dialog!.querySelector<HTMLButtonElement>('[data-prev-resource]')!.disabled =
      currentList.indexOf(id) <= 0;
    dialog!.querySelector<HTMLButtonElement>('[data-next-resource]')!.disabled =
      currentList.indexOf(id) >= currentList.length - 1;
    if (!dialog!.open) {
      lockScroll();
      dialog!.showModal();
    }
    dialog!.scrollTop = 0;
    previewTimer = setTimeout(() => {
      const frame = dialog!.querySelector<HTMLIFrameElement>('iframe');
      if (dialog!.open && !frame?.dataset.previewReady)
        status('[data-preview-status]', '预览未能启动，可以重开或查看下方源码。');
    }, 10000);
    refreshSelected();
  }
  function renderTask() {
    const list = taskDialog!.querySelector<HTMLElement>('[data-task-items]')!;
    list.replaceChildren();
    for (const item of selected.values()) {
      const entry = document.createElement('div');
      entry.className = 'ut-task-item';
      const label = document.createElement('span');
      label.textContent = getResource(item.id)?.title || item.id;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = '修改';
      edit.dataset.editSelection = item.id;
      edit.setAttribute('aria-label', '修改' + label.textContent);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.dataset.removeSelection = item.id;
      remove.setAttribute('aria-label', '移除' + label.textContent);
      entry.append(label, edit, remove);
      list.append(entry);
    }
    if (!selected.size) list.textContent = '还没有选中材料。关闭后选择一项。';
    taskDialog!.querySelector<HTMLTextAreaElement>('[data-task-text]')!.value = buildTask([
      ...selected.values(),
    ]);
    taskDialog!
      .querySelectorAll<HTMLButtonElement>('[data-copy-task],[data-copy-open],[data-download-task]')
      .forEach((b) => (b.disabled = selected.size === 0));
  }
  function showTask(opener?: HTMLElement) {
    rememberEditor();
    if (opener) taskOpener = opener;
    if (dialog!.open) dialog!.close();
    pauseVideos();
    renderTask();
    status('[data-task-status]', '');
    lockScroll();
    taskDialog!.showModal();
  }
  async function copyText(text: string, fallback?: HTMLTextAreaElement): Promise<boolean> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (fallback) {
        fallback.hidden = false;
        fallback.value = text;
        fallback.focus();
        fallback.select();
      }
      return false;
    }
  }
  async function copyTask(openAssistant: boolean) {
    const textarea = taskDialog!.querySelector<HTMLTextAreaElement>('[data-task-text]')!;
    const copied = await copyText(textarea.value, textarea);
    if (!copied) {
      status('[data-task-status]', '无法自动复制。已选中完整任务，请手动复制。');
      return;
    }
    if (!openAssistant) {
      status('[data-task-status]', '已复制。粘贴到你选择的 Agent 项目。');
      return;
    }
    const opener = document.querySelector<HTMLButtonElement>(
      'button[data-paseo-open]:not([data-paseo-article-open])',
    );
    if (!opener || opener.disabled) {
      status('[data-task-status]', '任务已复制。此独立预览没有连接 Paseo，请粘贴到你的 Agent。');
      return;
    }
    taskDialog!.close();
    opener.click();
    // Opening the existing assistant does not submit or attach this task.
    status('[data-task-status]', '任务已复制，助手已打开。请选择项目、粘贴，再发送。');
  }
  function updateGallery(gallery: HTMLElement) {
    const group = gallery.dataset.group as Group;
    const query = gallery
      .querySelector<HTMLInputElement>('[data-gallery-search]')!
      .value.trim()
      .toLowerCase();
    const tag =
      gallery.querySelector<HTMLElement>('[data-filter][aria-pressed=true]')?.dataset.filter || '';
    const items = getGroup(group).filter(
      (r) =>
        (!tag || r.tag === tag) &&
        `${r.title} ${r.author} ${r.description} ${r.behavior}`.toLowerCase().includes(query),
    );
    const more = gallery.dataset.expanded === 'true';
    const shown = items.slice(0, more ? 100 : 12).map((r) => r.id);
    gallery.querySelectorAll<HTMLElement>('[data-resource]').forEach((card) => {
      card.hidden = !shown.includes(card.dataset.resource!);
      if (card.hidden) card.querySelectorAll('video').forEach((v) => v.pause());
    });
    gallery.querySelector<HTMLElement>('[data-gallery-count]')!.textContent = String(items.length);
    gallery.querySelector<HTMLElement>('.ut-empty')!.hidden = items.length !== 0;
    const expand = gallery.querySelector<HTMLButtonElement>('[data-expand-gallery]')!;
    expand.hidden = items.length <= 12;
    expand.textContent = more ? '收起' : `展开其余 ${items.length - 12} 项`;
    gallery.querySelector<HTMLElement>('[data-gallery-position]')!.textContent =
      `显示 ${shown.length} / ${items.length} 项`;
  }
  document.querySelectorAll<HTMLElement>('.ut-gallery').forEach(updateGallery);
  function previewCommand(action: string, value?: number) {
    dialog!
      .querySelector<HTMLIFrameElement>('iframe')
      ?.contentWindow?.postMessage({ type: 'vibes-demo-control', action, value }, '*');
  }
  document.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Element)) return;
      const b = event.target.closest<HTMLElement>('button');
      if (!b || !b.closest('.ui-topic')) return;
      if (b.dataset.previewAction) previewCommand(b.dataset.previewAction);
      if (b.dataset.previewWidth) {
        const frame = dialog!.querySelector<HTMLElement>('.ut-preview-frame');
        if (frame) frame.dataset.viewport = b.dataset.previewWidth;
      }
      if (b.dataset.previewToken !== undefined) {
        const index = Number(b.dataset.previewToken);
        previewCommand('token', index);
        const r = getResource(currentId),
          area = dialog!.querySelector<HTMLTextAreaElement>('[name=changes]');
        if (r && area) {
          const change =
            r.id === 'props-spacing'
              ? ['--size-2 (.5rem)', '--size-3 (1rem)', '--size-5 (1.5rem)'][index]
              : r.id === 'props-radius'
                ? ['--radius-1 (2px)', '--radius-2 (5px)', '--radius-3 (1rem)'][index]
                : [
                    '--font-size-3 (1.25rem)',
                    '--font-size-5 (2rem)',
                    '--font-size-5 × 1.25 (Vibes 试调)',
                  ][index];
          area.value = (area.value + '\n采用参数：' + change + '，映射到项目现有规范。')
            .trim()
            .slice(0, 1200);
          rememberEditor();
        }
      }
      if (b.hasAttribute('data-copy-source')) {
        const r = getResource(currentId);
        if (r) {
          const fallback = dialog!.querySelector<HTMLTextAreaElement>('[data-source-fallback]')!;
          void copyText(sourceWithLicense(r), fallback).then((ok) =>
            status(
              '.ut-source-status',
              ok
                ? '代码与许可已复制；完整实现见上游文件。'
                : '自动复制失败，已选中完整代码与许可。',
            ),
          );
        }
      }
      if (b.dataset.openResource) {
        const gallery = b.closest<HTMLElement>('.ut-gallery');
        const list = gallery
          ? [...gallery.querySelectorAll<HTMLElement>('[data-resource]:not([hidden])')].map(
              (n) => n.dataset.resource!,
            )
          : [b.dataset.openResource];
        showResource(b.dataset.openResource, b, list);
      }
      if (b.dataset.toggleResource) {
        const id = b.dataset.toggleResource;
        if (selected.has(id)) {
          selected.delete(id);
          refreshSelected();
        } else addSelection(edits.get(id) || defaultSelection(id));
      }
      if (b.hasAttribute('data-close-resource')) dialog!.close();
      if (b.hasAttribute('data-prev-resource') || b.hasAttribute('data-next-resource')) {
        const next =
          currentList[
            currentList.indexOf(currentId) + (b.hasAttribute('data-next-resource') ? 1 : -1)
          ];
        if (next) showResource(next);
      }
      if (b.hasAttribute('data-word')) {
        const v = vocabulary[Number(b.dataset.word)];
        const text = dialog!.querySelector<HTMLTextAreaElement>('[name=changes]');
        if (v && text) {
          text.value = (text.value + (text.value ? '\n' : '') + v.text).slice(0, 1200);
          rememberEditor();
        }
      }
      if (b.hasAttribute('data-add-current') || b.hasAttribute('data-task-current')) {
        const item = readEditor();
        if (item && addSelection(item)) {
          status('[data-editor-status]', '已加入方案。可以继续挑选其他材料。');
          if (b.hasAttribute('data-task-current')) showTask(b);
        }
      }
      if (b.hasAttribute('data-open-task')) showTask(b);
      if (b.hasAttribute('data-close-task')) taskDialog!.close();
      if (b.dataset.removeSelection) {
        selected.delete(b.dataset.removeSelection);
        renderTask();
        refreshSelected();
      }
      if (b.dataset.editSelection) {
        taskDialog!.close();
        showResource(b.dataset.editSelection, resourceOpener || undefined, [...selected.keys()]);
      }
      if (b.hasAttribute('data-copy-task')) void copyTask(false);
      if (b.hasAttribute('data-copy-open')) void copyTask(true);
      if (b.hasAttribute('data-download-task')) {
        const url = URL.createObjectURL(
          new Blob([buildTask([...selected.values()])], { type: 'text/plain;charset=utf-8' }),
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vibes-ui-task.txt';
        a.click();
        URL.revokeObjectURL(url);
      }
      if (b.hasAttribute('data-filter')) {
        const gallery = b.closest<HTMLElement>('.ut-gallery')!;
        gallery
          .querySelectorAll('[data-filter]')
          .forEach((n) => n.setAttribute('aria-pressed', String(n === b)));
        updateGallery(gallery);
      }
      if (b.hasAttribute('data-density-toggle')) {
        const gallery = b.closest<HTMLElement>('.ut-gallery')!;
        const large = gallery.dataset.density !== 'large';
        gallery.dataset.density = large ? 'large' : 'comfortable';
        b.setAttribute('aria-pressed', String(large));
        b.textContent = large ? '紧凑' : '大图';
      }
      if (b.hasAttribute('data-expand-gallery')) {
        const gallery = b.closest<HTMLElement>('.ut-gallery')!;
        gallery.dataset.expanded = String(gallery.dataset.expanded !== 'true');
        updateGallery(gallery);
      }
      if (b.hasAttribute('data-copy-correction')) {
        const area = document.querySelector<HTMLTextAreaElement>('[data-correction]')!;
        if (!area.value.trim()) {
          status('[data-verify-status]', '先写出一处具体差异。');
          area.focus();
          return;
        }
        const checked = [
          ...document.querySelectorAll<HTMLInputElement>('[data-verify-check]:checked'),
        ].map((n) => n.value);
        const text = `请只修正当前界面的以下差异，不重新设计整页：\n${area.value.trim()}\n\n我手动检查过：${checked.join('；') || '尚未勾选检查项'}。\n参考图与结果图需要我另行附上；本页没有自动发送图片。\n保留其他已确认行为。修复后按相同操作和视口复查，说明已检查与未检查项。`;
        void copyText(
          text,
          document.querySelector<HTMLTextAreaElement>('[data-correction-fallback]')!,
        ).then((ok) =>
          status(
            '[data-verify-status]',
            ok
              ? '修正要求已复制。需要图片时，请同时附给 Agent。'
              : '无法自动复制，完整修正要求已选中。',
          ),
        );
      }
    },
    { signal },
  );
  document.addEventListener(
    'input',
    (event) => {
      const input = event.target;
      if (!(input instanceof Element)) return;
      if (input.hasAttribute('data-gallery-search'))
        updateGallery(input.closest<HTMLElement>('.ut-gallery')!);
      if (input.closest('[data-editor-resource]')) rememberEditor();
    },
    { signal },
  );
  document.addEventListener(
    'submit',
    (e) => {
      if (e.target instanceof Element && e.target.matches('[data-editor-resource]'))
        e.preventDefault();
    },
    { signal },
  );
  document.addEventListener(
    'change',
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.hasAttribute('data-compare-file')) return;
      const key = input.dataset.compareFile!;
      const file = input.files?.[0];
      if (!file) return;
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
        file.size > 15 * 1024 * 1024
      ) {
        status('[data-verify-status]', '请选择 15 MB 以内的 PNG、JPEG 或 WebP 图片。');
        input.value = '';
        return;
      }
      if (urls.has(key)) URL.revokeObjectURL(urls.get(key)!);
      const url = URL.createObjectURL(file);
      urls.set(key, url);
      const img = document.querySelector<HTMLImageElement>(`[data-compare-image="${key}"]`)!;
      img.onload = () => {
        img.hidden = false;
        document.querySelector<HTMLElement>(`[data-compare-placeholder="${key}"]`)!.hidden = true;
        status('[data-verify-status]', '图片已在本地打开，未上传。');
      };
      img.onerror = () => {
        img.hidden = true;
        document.querySelector<HTMLElement>(`[data-compare-placeholder="${key}"]`)!.hidden = false;
        status('[data-verify-status]', '这张图片无法解码，请换一张。');
      };
      img.src = url;
    },
    { signal },
  );
  document.addEventListener(
    'pointerover',
    (e) => {
      if (
        !(e.target instanceof Element) ||
        matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !matchMedia('(hover: hover)').matches ||
        dialog!.open ||
        taskDialog!.open
      )
        return;
      const video = e.target.closest('.ut-thumb')?.querySelector<HTMLVideoElement>('video');
      if (video && video !== activeVideo) void playVideo(video);
    },
    { signal },
  );
  document.addEventListener(
    'pointerout',
    (e) => {
      if (!(e.target instanceof Element)) return;
      const thumb = e.target.closest('.ut-thumb');
      if (thumb && (!(e.relatedTarget instanceof Node) || !thumb.contains(e.relatedTarget)))
        thumb.querySelector('video')?.pause();
    },
    { signal },
  );
  document.addEventListener(
    'toggle',
    (e) => {
      if (!(e.target instanceof HTMLDetailsElement) || !e.target.matches('.ut-recording')) return;
      const video = e.target.querySelector('video')!;
      if (e.target.open) {
        if (!video.src && video.dataset.videoSrc) video.src = video.dataset.videoSrc;
      } else video.pause();
    },
    { capture: true, signal },
  );
  document.addEventListener(
    'play',
    (e) => {
      const video = e.target;
      if (!(video instanceof HTMLVideoElement) || !video.closest('.ui-topic')) return;
      if (activeVideo && activeVideo !== video) activeVideo.pause();
      activeVideo = video;
    },
    { capture: true, signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        pauseVideos();
        previewCommand('pause');
      }
    },
    { signal },
  );
  window.addEventListener(
    'message',
    (event) => {
      const frame = dialog!.querySelector('iframe');
      if (!frame || event.source !== frame.contentWindow) return;
      if (event.data?.type === 'vibes-demo-escape') dialog!.close();
      if (event.data?.type === 'vibes-demo-ready') {
        frame.dataset.previewReady = 'true';
        clearTimeout(previewTimer);
        status('[data-preview-status]', '可以操作预览。');
        dialog!
          .querySelectorAll<HTMLButtonElement>('[data-await-preview]')
          .forEach((button) => (button.disabled = false));
      }
    },
    { signal },
  );
  dialog.addEventListener(
    'close',
    () => {
      if (dialog!.open) return;
      rememberEditor();
      const frame = dialog!.querySelector('iframe');
      if (frame) {
        frame.remove();
      }
      clearTimeout(previewTimer);
      pauseVideos();
      restoreScroll();
      if (!taskDialog.open) resourceOpener?.focus({ preventScroll: true });
    },
    { signal },
  );
  taskDialog.addEventListener(
    'close',
    () => {
      if (dialog.open || taskDialog.open) return;
      restoreScroll();
      (taskOpener?.isConnected && taskOpener.checkVisibility()
        ? taskOpener
        : resourceOpener
      )?.focus({ preventScroll: true });
    },
    { signal },
  );
  signal.addEventListener(
    'abort',
    () => {
      if (dialog.open) dialog.close();
      if (taskDialog.open) taskDialog.close();
      pauseVideos();
      clearTimeout(previewTimer);
      dialog.querySelector('iframe')?.remove();
      visibility.disconnect();
      urls.forEach((url) => URL.revokeObjectURL(url));
      restoreScroll();
      roots.forEach((r) => delete r.dataset.ready);
      overlay.remove();
    },
    { once: true },
  );
}
onPageLoad(bootTopic);
