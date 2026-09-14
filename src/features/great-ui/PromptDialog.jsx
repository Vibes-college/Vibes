import { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, ArrowUpRight } from 'lucide-react';
import { createTask, taskText } from './task.mjs';

export function PromptDialog({ dialogRef, entry, form, onFormChange, compose }) {
  const { placement, changes } = form;
  const setPlacement = (placement) => onFormChange({ ...form, placement });
  const setChanges = (changes) => onFormChange({ ...form, changes });
  const [status, setStatus] = useState('');
  const textRef = useRef(null);
  const task = createTask(entry, form, compose || null);
  const text = taskText(task);
  useEffect(() => {
    setStatus('');
  }, [text]);
  useEffect(() => {
    const dialog = dialogRef.current;
    const sync = () => {
      document.body.style.overflow = dialog.open ? 'hidden' : '';
    };
    const observer = new MutationObserver(sync);
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="prompt-dialog"
      aria-labelledby="prompt-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            dialogRef.current.close();
        }
      }}
    >
      <div className="dialog-heading">
        <div>
          <h2 id="prompt-title">{compose ? compose.title : entry.title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="关闭复制材料"
          onClick={() => dialogRef.current.close()}
        >
          <X size={20} />
        </button>
      </div>
      <p className="muted">参考、修改目标和检查要求会一起带过去。</p>
      {!compose && (
        <p className="task-goal">
          目标：
          {entry.learning.goals.find((goal) => goal.id === form.goalId)?.title ||
            entry.learning.goals[0].title}
        </p>
      )}
      <label className="field">
        用在哪里
        <input
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          placeholder={entry.placementHint}
        />
      </label>
      <label className="field">
        保留什么，改什么
        <textarea
          rows={2}
          value={changes}
          onChange={(e) => setChanges(e.target.value)}
          placeholder={entry.changesHint}
        />
      </label>
      <div className="material-includes">
        <Check size={14} /> 原作参考 <Check size={14} /> 固定版本源码 <Check size={14} /> 修改目标
      </div>
      <details>
        <summary>查看完整任务</summary>
        <textarea
          className="prompt-text"
          ref={textRef}
          value={text}
          readOnly
          aria-label="完整 Prompt"
        />
      </details>
      <button
        className="primary-button wide"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setStatus('已复制，粘贴到 Paseo 或你的项目 Agent 即可。');
          } catch {
            setStatus('自动复制未成功，已展开完整材料，请全选复制。');
            textRef.current.closest('details').open = true;
            textRef.current.focus();
            textRef.current.select();
          }
        }}
      >
        {status.startsWith('已复制') ? <Check size={17} /> : <Copy size={17} />}复制 Prompt
      </button>
      <p className="copy-status" role="status">
        {status || '复制后由你粘贴到项目会话。不会自动发送。'}
      </p>
      <details>
        <summary>查看同一任务的 JSON</summary>
        <textarea
          readOnly
          aria-label="结构化任务"
          className="prompt-text"
          value={JSON.stringify(task, null, 2)}
        />
      </details>
      <a className="source-link" href={`/content/${entry.slug}.json`} target="_blank">
        查看同源结构化内容 <ArrowUpRight size={13} />
      </a>
    </dialog>
  );
}
