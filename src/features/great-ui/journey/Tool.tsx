import { useAssetBase } from '../AssetContext';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import * as motion from 'motion/react-m';
import { isProjectData } from './data';

interface CheckRow {
  title: string;
  state: 'pending' | 'passed' | 'failed';
  detail: string;
}

// Apply the upstream DeploymentChecklist's state-row pattern to real local checks.
// No fixed timeout, simulated deployment, external request, or preselected failure.
export function Tool({ reduced }: { reduced: boolean }) {
  const assetBase = useAssetBase();
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [running, setRunning] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const titleField = useRef<HTMLInputElement>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function check(event: FormEvent) {
    event.preventDefault();
    if (running) return;
    const current = new AbortController();
    controller.current = current;
    const titleOkay = Array.from(title.trim()).length >= 4;
    let sourceOkay = false;
    try {
      const url = new URL(source);
      sourceOkay = ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname);
    } catch {
      /* The result below explains invalid input. */
    }
    const initial: CheckRow[] = [
      {
        title: '标题足够明确',
        state: titleOkay ? 'passed' : 'failed',
        detail: titleOkay ? '至少有4个字符。' : '请用至少4个字符说明是什么作品。',
      },
      {
        title: '来源地址格式',
        state: sourceOkay ? 'passed' : 'failed',
        detail: sourceOkay
          ? '是HTTP或HTTPS地址；此检查没有访问外部网站。'
          : '请填写完整的HTTP或HTTPS来源地址。',
      },
      { title: '本地示例资料', state: 'pending', detail: '正在读取并核对资料…' },
    ];
    setRows(initial);
    setRunning(true);
    try {
      const response = await fetch(assetBase + '/journeys/field-notes.json', {
        signal: current.signal,
      });
      if (!response.ok) throw new Error('本地示例暂时无法读取，恢复后可重新检查。');
      const value: unknown = await response.json();
      if (!isProjectData(value)) throw new Error('本地示例缺少必要资料。');
      if (current.signal.aborted) return;
      setRows([
        ...initial.slice(0, 2),
        {
          title: '本地示例资料',
          state: 'passed',
          detail: `已读取「${value.title}」并核对简介、成果和问答字段。`,
        },
      ]);
    } catch (error) {
      if (current.signal.aborted) return;
      setRows([
        ...initial.slice(0, 2),
        {
          title: '本地示例资料',
          state: 'failed',
          detail: error instanceof Error ? error.message : '资料检查失败。',
        },
      ]);
    } finally {
      if (!current.signal.aborted) setRunning(false);
    }
  }

  const completed = rows.length > 0 && !running;
  const failed = rows.filter((row) => row.state === 'failed').length;
  function edit() {
    setRows([]);
    titleField.current?.focus();
  }
  return (
    <div className="journey-tool">
      <p className="journey-kicker">任务工具 · 真实状态反馈示例</p>
      <h1>把资料补全，再走下一步。</h1>
      <p className="journey-lead">
        填写一个标题和来源，查看实际检查结果。有问题时修改，再检查一次。
      </p>
      <form onSubmit={(event) => void check(event)} className="journey-form">
        <label>
          作品标题
          <input
            ref={titleField}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setRows([]);
            }}
            disabled={running}
            placeholder="例如：我的作品集首页"
          />
        </label>
        <label>
          来源地址
          <input
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setRows([]);
            }}
            disabled={running}
            placeholder="https://example.com/project"
            inputMode="url"
          />
        </label>
        <button className="primary-button" disabled={running}>
          {running ? '检查中…' : '检查资料'}
        </button>
      </form>
      {rows.length > 0 && (
        <section className="journey-checks" aria-label="检查结果">
          {rows.map((row) => (
            <motion.div
              key={row.title}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              data-state={row.state}
            >
              <span aria-hidden="true">
                {row.state === 'passed' ? '✓' : row.state === 'failed' ? '!' : '…'}
              </span>
              <div>
                <h2>{row.title}</h2>
                <p>{row.detail}</p>
              </div>
              <small>
                {row.state === 'passed' ? '通过' : row.state === 'failed' ? '待完善' : '检查中'}
              </small>
            </motion.div>
          ))}
          <p role="status">
            {running
              ? '正在检查资料。'
              : failed
                ? `有${failed}项需要完善。`
                : '3项检查通过，可以继续整理作品。'}
          </p>
          {completed && (
            <button className="journey-back" onClick={edit}>
              {failed ? '修改后重新检查' : '整理下一件作品'}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
