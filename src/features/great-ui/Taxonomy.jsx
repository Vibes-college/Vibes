import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function Taxonomy({ entry }) {
  const group = useRef(null);
  useEffect(() => {
    const dismiss = (event) => {
      const escape = event.type === 'keydown' && event.key === 'Escape';
      if (event.type === 'keydown' && !escape) return;
      if (!escape && group.current.contains(event.target)) return;
      for (const detail of group.current.querySelectorAll('details[open]')) {
        detail.open = false;
        if (escape) detail.querySelector('summary').focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, []);
  const fields = [
    { label: '分类', value: entry.category },
    { label: '类型', value: entry.classification.type },
    { label: '用途', value: entry.classification.purpose.join(' / ') },
    { label: '行为', value: entry.classification.behavior.join(' / ') },
  ];
  return (
    <div className="taxonomy" ref={group} aria-label="作品分类与许可">
      {fields.map(({ label, value }) => (
        <span className="tag-item" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </span>
      ))}
      <details className="license-detail">
        <summary>
          <span>License</span>
          <strong>{entry.licenseLabel.split(' · ')[0]}</strong>
        </summary>
        <div className="tag-panel">
          <h2>{entry.licenseLabel}</h2>
          <p>{entry.licenseNote}</p>
          <a href={entry.license} target="_blank" rel="noreferrer">
            查看许可原文 <ArrowUpRight size={12} />
          </a>
        </div>
      </details>
    </div>
  );
}
