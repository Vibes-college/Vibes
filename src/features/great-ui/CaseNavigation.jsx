import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, LayoutGrid, X, Check } from 'lucide-react';

export function CaseNavigation({ entries, current, onSelect }) {
  const dialog = useRef(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(60);
  const categories = [...new Set(entries.map((item) => item.category))];
  const filtered = entries.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      `${item.title} ${item.english} ${item.summary} ${item.classification.purpose.join(' ')} ${item.classification.behavior.join(' ')}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const index = entries.findIndex((item) => item.id === current.id);
  const close = () => dialog.current.close();
  const select = (entry) => {
    close();
    onSelect(entry);
  };
  return (
    <>
      <nav className="case-navigation" aria-label="作品切换">
        <button
          className="case-picker"
          onClick={() => {
            dialog.current.showModal();
            document.body.style.overflow = 'hidden';
          }}
          aria-haspopup="dialog"
        >
          <LayoutGrid size={15} />
          <span>全部作品</span>
          <small>{entries.length}</small>
        </button>
        <span className="case-position" aria-live="polite">
          {String(index + 1).padStart(2, '0')}{' '}
          <span>/ {String(entries.length).padStart(2, '0')}</span>
        </span>
        <div className="case-arrows">
          <button
            className="icon-button"
            disabled={index === 0}
            onClick={() => onSelect(entries[index - 1])}
            aria-label="上一个作品"
            title={entries[index - 1]?.title || '已是第一个作品'}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            className="icon-button"
            disabled={index === entries.length - 1}
            onClick={() => onSelect(entries[index + 1])}
            aria-label="下一个作品"
            title={entries[index + 1]?.title || '已是最后一个作品'}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </nav>
      <dialog
        className="case-dialog"
        ref={dialog}
        aria-labelledby="case-list-title"
        onClose={() => {
          document.body.style.overflow = '';
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            close();
        }}
      >
        <div className="dialog-heading">
          <div>
            <h2 id="case-list-title">全部作品</h2>
          </div>
          <button className="icon-button" aria-label="关闭作品列表" onClick={close}>
            <X size={19} />
          </button>
        </div>

        <div className="case-filters">
          <label>
            搜索作品
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(60);
              }}
              placeholder="名称、用途或行为"
            />
          </label>
          <label>
            分类
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setLimit(60);
              }}
            >
              <option value="all">全部分类</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="case-result-count" role="status">
          找到 {filtered.length} 件作品
        </p>
        <div className="case-list">
          {filtered.slice(0, limit).map((item) => (
            <button
              className="case-card"
              key={item.id}
              onClick={() => select(item)}
              aria-current={item.id === current.id ? 'page' : undefined}
              aria-label={`查看${item.title}`}
            >
              {item.poster ? (
                <img src={item.poster} alt="" loading="lazy" />
              ) : (
                <span className="case-monogram" aria-hidden="true">
                  {item.english
                    .split(/\s+/)
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join('')}
                </span>
              )}
              <span className="case-card-copy">
                <small>
                  {String(entries.indexOf(item) + 1).padStart(2, '0')} /{' '}
                  {item.classification.purpose[0]}
                </small>
                <strong>{item.title}</strong>
              </span>
              {item.id === current.id ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          ))}
        </div>
        {!filtered.length && <p>没有匹配的作品，试试其他用途或清空搜索。</p>}
        {filtered.length > limit && (
          <button onClick={() => setLimit((value) => value + 60)}>再显示 60 件</button>
        )}
      </dialog>
    </>
  );
}
