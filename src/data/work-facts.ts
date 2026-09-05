import { formats, type Work } from './works';

export interface WorkFact {
  label: string;
  value: string;
  href: string;
}

// 从每件作品自己的已知数据生成可点击信息，避免编造价格、授权或能力。
export function workFacts(work: Work): WorkFact[] {
  const facts = [
    { label: '作者', value: work.creator, href: `/?q=${encodeURIComponent(work.creator)}` },
    { label: '类型', value: formats[work.type], href: `/?type=${work.type}` },
  ];
  const labels = {
    paper: '研究主题',
    code: '项目',
    video: '观看内容',
    audio: '节目',
    website: '体验',
    article: '阅读主题',
  };
  facts.push({ label: labels[work.type], value: work.note, href: '#reading' });
  return facts;
}
