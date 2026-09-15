import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  X,
  Check,
  Shuffle,
  ListOrdered,
  RotateCcw,
} from 'lucide-react';
import {
  browseMembers,
  moveBrowse,
  nextBrowseId,
  restartBrowse,
  selectBrowse,
  toggleBrowse,
} from './browsing';
import { useCaseBrowser } from './useCaseBrowser.jsx';

export function CaseNavigation({ entries, current, onSelect }) {
  const dialog = useRef(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(60);
  const { state, busy, error, apply } = useCaseBrowser(entries, current, onSelect);
  const scope = state?.scope || 'all';
  const shuffle = state?.shuffle ?? true;
  const members = browseMembers(entries, scope);
  const scopeLabel = scope === 'all' ? '全部分类' : scope;
  const categories = [...new Set(entries.map((item) => item.category))];
  const filtered = entries.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      `${item.title} ${item.english} ${item.summary} ${item.classification.purpose.join(' ')} ${item.classification.behavior.join(' ')}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const index = shuffle
    ? (state?.seen.indexOf(current.id) ?? 0)
    : members.findIndex((item) => item.id === current.id);
  const nextId = state && nextBrowseId(state, entries);
  const next = entries.find((item) => item.id === nextId);
  const previous = state && entries.find((item) => item.id === state.trail[state.cursor - 1]);
  const ended = state && !next;
  const disabled = !state || busy;
  const close = () => dialog.current.close();
  const select = (entry) => {
    close();
    if (state) void apply(selectBrowse(state, entries, entry.id, category));
  };
  return (
    <>
      <nav className="case-navigation" aria-label="作品切换">
        <div className="case-browse-controls">
          <button
            className="case-picker"
            disabled={disabled}
            aria-label={`浏览作品：${scopeLabel}`}
            onClick={() => {
              setCategory(scope);
              setQuery('');
              setLimit(60);
              dialog.current.showModal();
              document.body.style.overflow = 'hidden';
            }}
            aria-haspopup="dialog"
          >
            <LayoutGrid size={15} />
            <span>{scopeLabel}</span>
          </button>
          <button
            className="icon-button case-order"
            disabled={disabled}
            aria-label={shuffle ? '切换为顺序浏览' : '切换为随机浏览'}
            title={shuffle ? '随机浏览 · 点击切换为顺序' : '顺序浏览 · 点击切换为随机'}
            onClick={() => void apply(toggleBrowse(state, entries))}
          >
            <span className="case-order-glyph">
              {shuffle ? (
                <Shuffle size={13} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <ListOrdered size={13} strokeWidth={1.5} aria-hidden="true" />
              )}
            </span>
          </button>
        </div>
        <span className="case-position" aria-live="polite">
          {String(index + 1).padStart(2, '0')}{' '}
          <span>/ {String(members.length).padStart(2, '0')}</span>
        </span>
        <div className="case-arrows">
          <button
            className="icon-button"
            disabled={disabled || !previous}
            onClick={() => void apply(moveBrowse(state, entries, -1))}
            aria-label="上一个作品"
            title={previous?.title || '还没有上一件浏览记录'}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            className="icon-button"
            disabled={disabled || members.length < 2}
            onClick={() =>
              void apply(ended ? restartBrowse(state, entries) : moveBrowse(state, entries, 1))
            }
            aria-label={ended ? '开始新一轮浏览' : '下一个作品'}
            title={
              members.length < 2
                ? '当前范围只有一件作品'
                : next?.title || (shuffle ? '本轮已看完，开始新一轮浏览' : '已到末尾，从头顺序浏览')
            }
          >
            {ended ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          </button>
        </div>
      </nav>
      {ended && members.length > 1 && (
        <p className="case-round-status" role="status">
          {shuffle ? '本轮已看完' : '已到顺序末尾'} · 点击{' '}
          <RotateCcw size={11} aria-hidden="true" /> 开始新一轮
        </p>
      )}
      {error && <p role="alert">{error}</p>}
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
            <h2 id="case-list-title">浏览作品</h2>
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
