import type { CatalogWork, Locale } from '../../lib/content/schema.ts';
import { parseLearningBody } from '../../lib/content/learning.ts';
import observations from './data/observations.json' with { type: 'json' };
import recordings from './data/local-recordings.json' with { type: 'json' };

const licenseNote =
  'Great UI 使用自定义许可，允许在个人及商业应用、网站中使用和修改；限制重新打包为 UI 套件、模板或组件库。这里提供原创学习说明与应用示例，保留原作和固定源码链接。';

/** Build-time adapter shared by the Astro page and the local workbench exporter. */
export function learningEntry(work: CatalogWork, locale: Locale, origin?: string) {
  const meta = work.meta.learning;
  const version = work.versions[locale];
  if (!meta || !version?.data.learning)
    throw new Error(`${work.meta.id}: missing learning content`);
  const text = version.data.learning;
  const body = parseLearningBody(version.body, version.file);
  const repo = `https://github.com/Saurabh-2607/GreatUI/blob/${meta.revision}`;
  const observation = (observations as Record<string, unknown>)[meta.slug];
  const recording = (recordings as Record<string, unknown>)[meta.slug];
  const media = (value: string | undefined) => value || null;
  return {
    id: work.meta.id,
    slug: meta.slug,
    kind: meta.slug,
    title: version.data.title,
    summary: version.data.summary,
    english: meta.english,
    author: 'Saurabh Sharma · Great UI',
    category: text.category,
    classification: text.classification,
    reference: work.meta.sourceUrl,
    source: `${repo}/${meta.implementation}`,
    sourceRaw: `https://raw.githubusercontent.com/Saurabh-2607/GreatUI/${meta.revision}/${meta.implementation}`,
    previewSource: `${repo}/${meta.previewSource}`,
    revision: meta.revision,
    license: `${repo}/LICENSE`,
    licenseNote,
    licenseLabel: '可商用 · 自定义许可',
    recording: media(meta.media.video || meta.media.image),
    previewRecording: media(meta.media.video),
    previewImage: media(meta.media.image),
    poster: meta.media.poster,
    recordingCredit: '本地录制 Great UI 原作交互',
    recordingNote:
      '在原作公开页面实际操作并捕获画面，由 Vibes 维护预览。页面录制时间与源码版本分别记录，录屏不代表目标项目已完成接入。',
    publicUrl: origin ? new URL(`/${locale}/works/${work.meta.id}/`, origin).href : null,
    localRecordingPath: origin ? null : `public${meta.media.video || meta.media.image}`,
    sections: body.sections,
    suitable: body.suitable,
    avoid: body.avoid,
    preserve: text.preserve,
    checks: text.checks,
    terms: Object.keys(text.glossary),
    glossary: text.glossary,
    placementHint: text.placementHint,
    changesHint: text.changesHint,
    learning: {
      goals: text.goals,
      adjustments: text.adjustments,
      practice: body.practice,
      useIntro: body.useIntro,
      combinationIntro: body.combinationIntro,
    },
    verification: {
      source: {
        revision: meta.revision,
        implementation: meta.implementation,
        preview: meta.previewSource,
        reviewed: true,
      },
      browser: observation || null,
      recording: recording || null,
      scope: '固定版本源码与原作交互已核对；预览捕获于原作页面，时间与素材记录分别保留。',
      limitation:
        '原作线上页面无法证明部署 SHA；源码结论固定于标注版本。未代表所有变体、真实手机或你的项目已通过验证。',
    },
  };
}
