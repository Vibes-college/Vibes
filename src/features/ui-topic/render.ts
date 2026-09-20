import {
  getGroup,
  groupNames,
  groupHints,
  vocabulary,
  type Group,
  type UIResource,
} from './catalog.ts';
import { escapeHtml } from '../../lib/escape.ts';
export type TopicSection = Group | 'intro' | 'verify';
const button = (text: string, attrs = '', primary = false) =>
  `<button type="button" class="ut-btn${primary ? ' ut-primary' : ''}" ${attrs}>${text}</button>`;
export function renderCard(r: UIResource): string {
  const label =
    r.tag === 'Tokens' ? '参数试用' : r.groups.includes('pages') ? '首屏节选' : '开源实装';
  const preview = r.video
    ? `<video muted playsinline loop preload="none" poster="${escapeHtml(r.image)}" data-video-src="${escapeHtml(r.video)}" aria-label="${escapeHtml(r.title)}：上游实现的本地录屏"></video>`
    : `<img loading="lazy" decoding="async" src="${escapeHtml(r.image)}" alt="${escapeHtml(r.title)}，${escapeHtml(r.author)}，${escapeHtml(r.scope)}" width="1000" height="700" />`;
  return `<article class="ut-card" data-resource="${r.id}" data-tag="${escapeHtml(r.tag)}"><div class="ut-thumb" data-shape="${r.groups.includes('pages') ? 'page' : 'component'}">${preview}<span class="ut-preview-label">${label}</span><button type="button" class="ut-open ut-js-only" data-open-resource="${r.id}" aria-label="打开${escapeHtml(r.title)}，同页预览"></button></div><div class="ut-card-bottom"><div><h3>${escapeHtml(r.title)}</h3><small>${escapeHtml(r.author.split(' · ')[0])} · ${escapeHtml(r.tag)}</small></div><button type="button" class="ut-select ut-js-only" data-toggle-resource="${r.id}" aria-label="选择${escapeHtml(r.title)}" aria-pressed="false">＋</button></div><a class="ut-source" href="${escapeHtml(r.source)}" target="_blank" rel="noopener noreferrer">MIT · 源码 ↗</a></article>`;
}
export function renderGallery(group: Group): string {
  const items = getGroup(group),
    tags = [...new Set(items.map((r) => r.tag))];
  return `<div class="ut-gallery" data-group="${group}" data-density="comfortable"><div class="ut-section-bar"><p>${groupHints[group]} <span data-gallery-count>${items.length}</span> 项</p><div class="ut-controls ut-js-only"><input type="search" data-gallery-search aria-label="搜索${groupNames[group]}" placeholder="搜效果、用途或原库" /><button type="button" class="ut-control" data-density-toggle aria-pressed="false">大图</button></div></div><div class="ut-tags ut-js-only"><button type="button" class="ut-tag" data-filter="" aria-pressed="true">全部</button>${tags.map((t) => `<button type="button" class="ut-tag" data-filter="${escapeHtml(t)}" aria-pressed="false">${escapeHtml(t)}</button>`).join('')}</div><div class="ut-grid">${items.map((r) => renderCard(r)).join('')}</div><p class="ut-empty" hidden>没有匹配项，换一个词试试。</p><div class="ut-gallery-footer ut-js-only"><span data-gallery-position>${items.length} 项开源材料</span>${button('展开更多', 'data-expand-gallery hidden')}</div></div>`;
}
export function renderDetail(r: UIResource): string {
  const token = r.groups.includes('tokens'),
    motion = r.id.startsWith('props-') && !token;
  const frame = `src="${escapeHtml(r.previewSrc)}"`;
  const controls = motion
    ? `${button('重播', 'data-preview-action="replay" data-await-preview disabled')}${button('暂停', 'data-preview-action="pause" data-await-preview disabled')}`
    : token
      ? ['紧凑 / 小', '默认', '宽松 / 大']
          .map((t, i) => button(t, `data-preview-token="${i}" data-await-preview disabled`))
          .join('')
      : '';
  const words = vocabulary
    .map((w, i) => ({ w, i }))
    .filter(({ i }) =>
      motion
        ? [0, 2, 3].includes(i)
        : r.groups.includes('pages')
          ? [0, 1, 4].includes(i)
          : [0, 1].includes(i),
    );
  return `<div class="ut-dialog-layout"><div class="ut-viewer"><div class="ut-view-toolbar"><span>${escapeHtml(r.author)} · MIT</span><div>${button('宽屏', 'data-preview-width="wide"')}${button('手机', 'data-preview-width="phone"')}</div></div><div class="ut-preview-frame"><iframe sandbox="allow-scripts" ${frame} title="${escapeHtml(r.title)}：隔离预览" class="ut-source-frame"></iframe></div><div class="ut-preview-controls">${controls}</div><p class="ut-status" role="status" data-preview-status>正在载入预览…</p><p class="ut-viewer-caption">${escapeHtml(r.scope)}。${r.groups.includes('pages') ? '此处不是完整模板；取用时读取完整上游文件。' : token ? '变量来自上游，控件是对照用的演示外壳。' : '本页只演示，不连接业务或上传输入。'}</p><details class="ut-provenance"><summary>代码与来源</summary><p>${escapeHtml(r.provenance)}</p><a href="${escapeHtml(r.source)}" target="_blank" rel="noopener noreferrer">完整上游源码 ↗</a><p>文件版本：<code>${r.upstreamBlobSha}</code></p>${button('复制当前代码节选', 'data-copy-source')}<pre class="ut-source-code"><code>${escapeHtml(r.sourceText)}</code></pre><p class="ut-source-status" role="status"></p><textarea data-source-fallback class="ut-task-text" readonly hidden aria-label="代码与许可，手动复制"></textarea></details></div><form class="ut-editor" data-editor-resource="${r.id}"><p class="ut-description">${escapeHtml(r.description)}</p><div class="ut-translation"><span>大白话 → 实现</span><b>${escapeHtml(r.terms[0])}</b><code>${escapeHtml(r.terms[1])}</code><small>${escapeHtml(r.terms[2])}</small></div><fieldset><legend>借什么</legend><div class="ut-borrow">${['布局', '配色', '字体', '动效', '交互', '规范', '整套'].map((v) => `<label><input type="checkbox" name="borrow" value="${v}"${v === r.borrow ? ' checked' : ''} />${v}</label>`).join('')}</div></fieldset><label>放哪里<input type="text" name="target" placeholder="例如：首页导航" maxlength="200" autocomplete="off" /></label><label>怎么改<textarea name="changes" rows="3" maxlength="1200" placeholder="例如：只借交互，保留我的配色"></textarea></label><div class="ut-wordlist"><small>点一句，加入要求</small>${words.map(({ w, i }) => button(escapeHtml(w.label), `data-word="${i}"`)).join('')}</div><details class="ut-behavior"><summary>行为与检查</summary><p>${escapeHtml(r.behavior)}</p><p>${escapeHtml(r.check)}</p></details>${button('加入方案', 'data-add-current', true)}${button('用这一项生成任务', 'data-task-current')}<p class="ut-status" role="status" data-editor-status></p></form></div>`;
}
export function renderIntro(): string {
  return `<div class="ut-method"><div><b>目标</b><span>看见想要的</span></div><div><b>实现</b><span>取用做法</span></div><div><b>反馈</b><span>对照修改</span></div></div><nav class="ut-map" aria-label="开发地图">${Object.entries(
    groupNames,
  )
    .map(([, name]) => `<a href="#${name}">${name}<span>↗</span></a>`)
    .join(
      '',
    )}<a href="#验证">验证<span>↗</span></a></nav><p class="ut-caption">按需求进入，不用从头学完。选材从大到小，规范贯穿各层。</p><div class="ut-tray ut-js-only" data-selection-tray hidden><div><p>已选 <b data-selection-count>0</b> 项</p><small>拼成一份明确的要求</small><small role="status" data-selection-status></small></div>${button('查看方案 →', 'data-open-task', true)}</div><dialog class="ui-topic not-prose ut-dialog" data-resource-dialog aria-labelledby="ut-resource-title"><header class="ut-dialog-header"><h3 id="ut-resource-title"></h3><div>${button('←', 'data-prev-resource aria-label="上一项"')}${button('→', 'data-next-resource aria-label="下一项"')}${button('关闭', 'data-close-resource')}</div></header><div data-detail-body></div></dialog><dialog class="ui-topic not-prose ut-dialog" data-task-dialog aria-labelledby="ut-task-title"><header class="ut-dialog-header"><h3 id="ut-task-title">交给 Agent</h3>${button('关闭', 'data-close-task')}</header><div class="ut-task-body"><div><p class="ut-caption">只带上你选中的材料。</p><div class="ut-task-items" data-task-items></div><p class="ut-caption">删除或修改任一项，任务会同步更新。</p></div><div><label for="ut-task-text">完整任务</label><textarea id="ut-task-text" class="ut-task-text" readonly spellcheck="false" data-task-text></textarea><div class="ut-task-actions">${button('复制任务', 'data-copy-task', true)}${button('复制并打开助手', 'data-copy-open')}${button('保存 .txt', 'data-download-task')}</div><p class="ut-status" role="status" data-task-status></p><p class="ut-caption">不会自动发送或修改项目。打开助手后，选择项目并粘贴任务。</p></div></div></dialog>`;
}
export function renderVerification(): string {
  return `<div class="ut-verification"><div class="ut-verify-inputs ut-js-only"><label>参考图<input type="file" accept="image/png,image/jpeg,image/webp" data-compare-file="reference" /></label><label>结果图<input type="file" accept="image/png,image/jpeg,image/webp" data-compare-file="result" /></label></div><p class="ut-caption">图片仅在当前浏览器对照，不上传，也不会自动附给 Agent。动态图请在实际页面重复同一操作。</p><div class="ut-compare"><figure><div data-compare-placeholder="reference">参考图</div><img data-compare-image="reference" alt="用户选择的参考图" hidden /><figcaption>想要的效果</figcaption></figure><figure><div data-compare-placeholder="result">结果图</div><img data-compare-image="result" alt="用户选择的结果图" hidden /><figcaption>实际的结果</figcaption></figure></div><div class="ut-checks">${['外观：布局、字体、颜色', '动效：触发、节奏、中断', '操作：点击、切换、失败', '适配：手机、长中文、键盘'].map((v) => `<label><input type="checkbox" data-verify-check value="${escapeHtml(v)}" />${escapeHtml(v)}</label>`).join('')}</div><label class="ut-feedback-text">哪里不对？<textarea rows="3" maxlength="1600" data-correction placeholder="例如：导航太挤；选中底色动得太快；手机上按钮被遮住。"></textarea></label><div class="ut-js-only">${button('复制修正要求', 'data-copy-correction', true)}</div><p class="ut-status" role="status" data-verify-status></p><textarea class="ut-task-text" data-correction-fallback readonly hidden aria-label="可手动复制的修正要求"></textarea></div>`;
}
export function renderTopic(section: TopicSection): string {
  if (section === 'intro') return renderIntro();
  if (section === 'verify') return renderVerification();
  return renderGallery(section);
}
