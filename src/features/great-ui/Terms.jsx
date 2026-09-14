import { createContext, createElement, useContext, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
const TermContext = createContext(null);

export function TermProvider({ children, entry }) {
  const panel = useRef(null);
  const invoker = useRef(null);
  const [termId, setTermId] = useState(entry.terms[0]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const glossary = entry.glossary;
  const term = glossary[termId];
  function show(id, button) {
    setTermId(id);
    invoker.current = button;
    const rect = button.getBoundingClientRect();
    const width = Math.min(352, innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left, innerWidth - width - 12)),
      top: Math.min(rect.bottom + 10, Math.max(12, innerHeight - 430)),
    });
    panel.current.showPopover();
    setOpen(true);
    requestAnimationFrame(() => {
      // Measure the selected explanation after React commits its text; terms wrap differently.
      const bounds = panel.current.getBoundingClientRect();
      setPosition({
        left: Math.max(12, Math.min(rect.left, innerWidth - bounds.width - 12)),
        top: Math.max(12, Math.min(rect.bottom + 10, innerHeight - bounds.height - 12)),
      });
      panel.current.querySelector('button').focus({ preventScroll: true });
    });
  }
  function close() {
    panel.current.hidePopover();
    invoker.current?.focus({ preventScroll: true });
  }
  return (
    <TermContext.Provider value={{ show, open, termId, glossary, prose: entry.prose }}>
      {children}
      <div
        ref={panel}
        id="term-popover"
        popover="auto"
        role="dialog"
        aria-modal="false"
        aria-labelledby="term-title"
        className="term-popover"
        style={position}
        onToggle={(e) => setOpen(e.newState === 'open')}
      >
        <div className="popover-heading">
          <span className="eyebrow">{term.kind}</span>
          <button className="icon-button" onClick={close} aria-label="关闭术语解释">
            <X size={18} />
          </button>
        </div>
        <h2 id="term-title">
          {term.title}
          <span>{term.english}</span>
        </h2>
        <p>{term.definition}</p>
        <div className="term-context">
          <h3>在这个案例里</h3>
          <p>{term.context}</p>
          <p className="technical">{term.parameter}</p>
        </div>
        <p className="term-judgment">{term.judgment}</p>
        <a className="source-link" href={entry.source} target="_blank" rel="noreferrer">
          对照原作源码 <ArrowUpRight size={13} />
        </a>
      </div>
    </TermContext.Provider>
  );
}
export function Term({ id, children }) {
  const { show, open, termId, glossary } = useContext(TermContext);
  return (
    <button
      className="term"
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open && termId === id}
      onClick={(e) => show(id, e.currentTarget)}
    >
      {children || glossary[id].title}
    </button>
  );
}
const proseTags = new Set([
  'p',
  'strong',
  'em',
  'del',
  'a',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'br',
  'hr',
  'h4',
  'h5',
  'h6',
]);
const textParts = (text) =>
  text.split(/(\[\[[^\]]+\]\])/).map((part, i) => {
    const match = part.match(/^\[\[([^|]+)\|([^\]]+)\]\]$/);
    return match ? (
      <Term key={i} id={match[1]}>
        {match[2]}
      </Term>
    ) : (
      part
    );
  });
function proseNode(node, index) {
  if (typeof node.text === 'string') return <span key={index}>{textParts(node.text)}</span>;
  if (!proseTags.has(node.tag)) return null;
  const props = { key: index };
  if (node.tag === 'a' && /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(node.href || ''))
    props.href = node.href;
  if (node.tag === 'ol' && Number.isInteger(node.start)) props.start = node.start;
  return createElement(node.tag, props, ...(node.children || []).map(proseNode));
}
export function RichText({ text }) {
  const { prose } = useContext(TermContext);
  return prose?.[text] ? prose[text].map(proseNode) : <p>{textParts(text)}</p>;
}
