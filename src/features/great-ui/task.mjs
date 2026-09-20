export const plain = (text) => text.replace(/\[\[([^|]+)\|([^\]]+)\]\]/g, '$2');

/** @param {(import('./composition/model.ts').CompositionPlan & {handoffs?: string[], verification?: import('./composition/model.ts').VerificationRecord | null}) | null} plan */
export function createTask(entry, form, plan = null) {
  // A PR preview must export links to its own available files, before production has them.
  const learningUrl = entry.publicUrl
    ? new URL(
        new URL(entry.publicUrl).pathname,
        typeof window === 'undefined' ? entry.publicUrl : window.location.origin,
      ).href
    : null;
  const selectedGoal =
    entry.learning.goals.find((item) => item.id === form.goalId) || entry.learning.goals[0];
  const goal = plan
    ? {
        id: plan.templateId,
        title: plan.title,
        action: '按完整路径分配各环节职责，落实列出的适配与交接；省略的效果不再加入。',
        judge: '实际走完所列路径，结果来自真实状态；每个交接与适配均有操作证据。',
      }
    : selectedGoal;
  const commonChecks = [
    '完整内容、键盘与触摸操作均可用；窄屏不裁切必要内容。',
    '减少动态效果时可以直接完成同一任务；失败、取消和重复操作不会留下阻塞。',
  ];
  // Original behavior is evidence, not an unconditional requirement after adaptation.
  const preserve = plan
    ? [...(plan.handoffs || []), ...plan.issues.map((issue) => issue.detail)]
    : goal.id === 'faithful'
      ? entry.preserve
      : [goal.action];
  const checks = plan
    ? [
        ...plan.steps
          .filter((step) => !step.omitted)
          .map((step) => `${step.slot.title}：${step.slot.purpose}`),
        ...preserve,
        goal.judge,
        ...commonChecks,
      ]
    : goal.id === 'faithful'
      ? [...entry.checks, goal.judge]
      : [goal.judge, ...commonChecks];
  return {
    schemaVersion: 2,
    mode: plan ? 'composition' : 'single',
    placement: form.placement.trim(),
    changes: form.changes.trim(),
    selected: {
      id: entry.id,
      title: entry.title,
      source: entry.source,
      sourceRaw: entry.sourceRaw,
      revision: entry.revision,
      reference: entry.reference,
      previewSource: entry.previewSource,
      learningUrl,
    },
    goal,
    referenceDesign: {
      note: '以下记录原作，供比较和追溯；修改后的行为由 goal、preserve、checks 和 plan 决定。',
      explanation: entry.sections.map((item) => ({ ...item, text: plain(item.text) })),
      adjustments: entry.learning.adjustments,
      preserve: entry.preserve,
      checks: entry.checks,
    },
    preserve,
    checks,
    glossary: Object.fromEntries(entry.terms.map((id) => [id, entry.glossary[id]])),
    verification: entry.verification,
    media: {
      url: learningUrl
        ? new URL(entry.previewRecording || entry.recording, learningUrl).href
        : entry.previewRecording || entry.recording,
      note: entry.recordingNote,
      localPath: entry.publicUrl ? null : entry.localRecordingPath || null,
      mobileUrl: entry.recordingMedia?.mobile
        ? learningUrl
          ? new URL(entry.recordingMedia.mobile.video, learningUrl).href
          : entry.recordingMedia.mobile.video
        : null,
    },
    license: { url: entry.license, note: entry.licenseNote },
    plan: plan
      ? {
          id: plan.id,
          title: plan.title,
          templateId: plan.templateId,
          status: plan.status,
          contextKey: plan.contextKey,
          ruleVersion: plan.ruleVersion,
          issues: plan.issues,
          steps: plan.steps.map((step) => ({
            title: step.slot.title,
            purpose: step.slot.purpose,
            omitted: step.omitted,
            work: step.work
              ? { ...step.work, source: step.work.source, reference: step.work.reference }
              : null,
            base: step.work ? null : step.slot.base,
            issues: step.issues,
          })),
          handoffs: plan.handoffs || [],
          verification: plan.verification || null,
        }
      : null,
  };
}

export function taskText(task) {
  const { selected, goal, plan, referenceDesign } = task;
  return `请帮我${plan ? `实现这条操作路径：${plan.title}` : `把「${selected.title}」接入项目`}。
任务模式：${plan ? '组合完整操作路径' : '接入并改进单个效果'}
接入位置：${task.placement || '先查看项目并定位合适位置；必要信息不足时再确认。'}
我的要求：${task.changes || '保留现有配色、字体、内容和布局，只处理这个任务。'}

参考材料
${selected.learningUrl ? `学习说明：${selected.learningUrl}\n` : ''}原作：${selected.reference}
固定源码：${selected.source}
可读取源码：${selected.sourceRaw}
原作者示例：${selected.previewSource}
版本：${selected.revision}
原作媒体：${task.media.url || '在原作页面实际操作'}
${task.media.mobileUrl && task.media.mobileUrl !== task.media.url ? `手机录屏：${task.media.mobileUrl}\n` : ''}素材说明：${task.media.note}
${task.media.localPath ? `本机素材：${task.media.localPath}\n无法访问本机素材时明确说明，请用户提供附件；不要声称已经读取。` : ''}
许可：${task.license.url}
${task.license.note}

原作参考
${referenceDesign.note}
${referenceDesign.explanation.map((section) => `${section.title}：${section.text}`).join('\n')}
原作核心关系：${referenceDesign.preserve.join('；')}。
原作相关检查要求：${referenceDesign.checks.join('；')}

修改目标：${goal.title}
让 Agent 这样改：${goal.action}
改好后看什么：${goal.judge}
目标要求：${task.preserve.join('；')}。
原作可调整的位置（按目标取用）：
${referenceDesign.adjustments.map(([title, source, note]) => `${title} / ${source}：${note}`).join('\n')}
数值建议只作为比较起点，不代表最优参数。
${
  plan
    ? `
完整路径（${plan.status === 'verified' ? '下列固定示例已验证，用户项目仍需验证' : '建议方案，尚未在用户项目验证'}）
项目条件：${plan.contextKey}
规则版本：${plan.ruleVersion}
方案ID：${plan.id}
${plan.steps.map((step, i) => `${i + 1}. ${step.title}：${step.purpose}\n${step.omitted ? '省略此可选效果。' : step.work ? `使用${step.work.title}；来源：${step.work.source}；固定版本：${step.work.sourceRevision}；内容版本：${step.work.contentRevision}；能力版本：${step.work.capabilityRevision}` : `基础实现：${step.base?.task}`}\n${step.issues.map((issue) => issue.detail).join('；')}`).join('\n')}
必须处理的条件与适配：
${plan.issues.map((issue) => `${issue.severity}：${issue.detail}`).join('\n') || '当前已知规则未发现冲突；这不等于完成接入。'}
环节交接：${plan.handoffs.join('；')}
验证记录：${plan.verification ? JSON.stringify(plan.verification) : '无本方案的整条路径验收记录。'}
`
    : ''
}
术语与本案例关系
${Object.values(task.glossary)
  .map(
    (term) =>
      `${term.title} / ${term.english}：${term.definition}\n词条：${term.reference}\n出处：${term.sources.map((source) => `${source.author}，${source.title}，${source.section}（${source.url}）`).join('；')}\n本例：${term.context}\n参数：${term.parameter}`,
  )
  .join('\n\n')}

执行要求
1. 查看真实项目与固定版本源码，先核对框架、依赖、路由、共享状态和数据；不要按名字猜能力，也不要盲目执行 latest 安装命令。
2. 缺少状态、事件、数据或兼容能力时，落实上面的适配任务；未知条件不得当作已兼容。新增依赖先说明必要性。
3. 原作或素材无法访问时说明范围，不重试规避限流；测试桩和录屏不能代替真实操作。
4. 将效果接到指定位置，保留完整内容、键盘操作、触摸操作、减少动态效果与错误恢复。
5. 运行项目并实际完成整条操作路径，分别检查正常、失败、中断、重复操作和前进后退。

验收
${task.checks.map((check, i) => `${i + 1}. ${check}`).join('\n')}
交付修改文件、运行入口、实际验证环境和未完成项。改变来源、内容、适配器或规则版本后重新核对受影响证据。

材料验证范围
${task.verification.scope}
${task.verification.limitation}`;
}
