import { Component, lazy, Suspense } from 'react';

const Journey = lazy(() => import('./journey/Journey'));

class JourneyBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="load-state" role="alert">
        <p>组合示例暂时无法打开。可以返回说明，或重新加载页面后再试。</p>
        <button onClick={this.props.onExit}>返回设计说明</button>
        <button onClick={() => window.location.reload()}>重新加载页面</button>
      </div>
    );
  }
}

export function JourneyLoader({ kind, onExit }) {
  return (
    <JourneyBoundary onExit={onExit}>
      <Suspense fallback={<p role="status">正在打开组合体验…</p>}>
        <Journey kind={kind} onExit={onExit} />
      </Suspense>
    </JourneyBoundary>
  );
}
