import { useReducedMotion } from 'motion/react';
import { Portfolio } from './Portfolio';
import { Product } from './Product';
import { Tool } from './Tool';
import { journeyNames, type JourneyKind } from './data';
import './journey.css';

export default function Journey({ kind, onExit }: { kind: JourneyKind; onExit: () => void }) {
  const reduced = Boolean(useReducedMotion());
  return (
    <div className="journey-workbench">
      <nav className="journey-toolbar" aria-label="组合体验">
        <button onClick={onExit}>← 返回设计说明</button>
        <span>可操作组合 · 本地示例</span>
      </nav>
      <p className="journey-path">{journeyNames[kind] || journeyNames.portfolio}</p>
      {kind === 'product' ? (
        <Product reduced={reduced} />
      ) : kind === 'tool' ? (
        <Tool reduced={reduced} />
      ) : (
        <Portfolio reduced={reduced} />
      )}
      <details className="journey-adaptations">
        <summary>这条路径做了哪些改造</summary>
        {kind === 'portfolio' ? (
          <p>
            保留错峰遮挡与滚动揭示的核心关系；使用三块面板，等待实际资料就绪，再按动画完成事件揭开。正文在退出后启用，中文按完整字素处理，减少动态效果时直接显示。问答补齐键盘语义，取消点击答案意外关闭。
          </p>
        ) : kind === 'product' ? (
          <p>
            省略全屏转场与逐字动效，直接展示重要差异；问答改成可同时展开，便于比较。确认只记录当前体验中的选择，不提交订单。
          </p>
        ) : (
          <p>
            把部署清单的状态行结构用于实际资料检查。标题、地址格式和本地资料读取决定结果，取消原作的固定延时与预设部署失败；没有执行外部部署。
          </p>
        )}
        <p>
          参考：
          <a href="https://www.great-ui.com" target="_blank" rel="noreferrer">
            by Great UI ↗
          </a>
          。这是针对这些示例的适配，不能证明已接入你的项目。
        </p>
      </details>
    </div>
  );
}
