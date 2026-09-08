export const labels = {
  zh: {
    title: '本地助手',
    detach: '移除作品上下文',
    settings: '会话选项',
    fullscreen: '展开窗口',
    restore: '恢复窗口',
    status: {
      initializing: '正在启动',
      idle: '空闲',
      running: '执行中',
      error: '出错',
      closed: '已关闭',
    },
    open: '打开本地助手',
    close: '收起助手',
    connect: '连接电脑',
    disconnect: '断开连接',
    forget: '忘记电脑',
    reconnect: '重新连接',
    sync: '刷新状态',
    diagnostics: '导出连接诊断',
    stale: '正在核对电脑状态；以下为上次完整记录，恢复前暂不能操作。',
    retrying: '将自动重试，也可以选择刷新状态。',
    unknown: '有一项操作的结果仍待核对。请先检查电脑上的会话与实际结果；继续不会自动重发。',
    acknowledgeUnknown: '我已核对，继续操作',
    diagnosticWarning: '浏览器无法保存完整诊断或待确认操作；刷新后可能无法自动核对。',
    stages: {
      idle: '已断开',
      connect: '连接电脑',
      probe: '检查连接响应',
      identity: '核对设备身份',
      directory: '读取会话目录',
      subscribe: '恢复会话订阅',
      history: '补齐历史和待审批',
      ready: '已核对',
      waiting: '等待重试',
      blocked: '需要处理连接问题',
    },
    intro: '把作品交给你电脑上的 Agent。电脑需保持联网和唤醒。',
    setup: '先在电脑安装官方 Paseo，完成 Agent 登录并启动 daemon，然后复制配对链接到这里。',
    install: '打开 Paseo 安装说明',
    pairing: 'Paseo 配对链接或 JSON',
    remember: '在此设备记住电脑',
    private: '配对信息仅保存在此浏览器；默认关闭标签页后清除。',
    offline: '未连接',
    connecting: '正在连接…',
    syncing: '正在恢复历史…',
    ready: '已连接',
    sessions: '本地会话',
    choose: '选择会话',
    newSession: '新建会话',
    provider: 'Agent',
    directory: '本地工作目录',
    directoryHelp: '填写电脑上的完整目录路径。',
    model: '模型',
    models: '读取可用模型',
    create: '创建会话',
    noProviders: '电脑上还没有可用的 Agent，请先完成安装和登录后刷新。',
    noSessions: '选择已有会话，或新建一个。',
    copy: '复制',
    send: '发送',
    stop: '停止',
    message: '发送给本地 Agent',
    empty: '从一个问题开始。',
    context: '附带当前作品',
    source: '原作',
    waiting: '正在执行，完成或停止后可继续发送。',
    approval: '需要你的确认',
    allow: '允许本次',
    deny: '拒绝',
    answer: '提交回答',
    freeAnswer: '输入回答',
    unsupported: '此问题格式暂不支持，请在电脑处理；也可以拒绝。',
    tool: '工具',
    result: '结果',
    older: '加载更早消息',
    latest: '返回最新记录',
    completed: '任务已完成',
    failed: '任务失败',
    canceled: '任务已停止',
    busy: '正在等待电脑确认…',
    nojs: '本地助手需要启用 JavaScript。',
    errors: {
      identity: '设备身份不符，已停止自动恢复。请核对电脑的配对信息。',
      release: '旧连接未能安全释放，已停止创建新连接。请导出诊断后重新打开页面。',
      createUnknown: '创建结果未确认，请先检查会话列表和电脑，避免重复创建。',
      operationLimit: '待确认操作过多，请先核对并处理已有操作。',
      pairing: '配对信息无效。请使用官方 Paseo 的 v2 加密配对链接。',
      connect: '未能连接电脑。检查 daemon、网络和配对信息后重试。',
      sync: '状态恢复失败，请重新连接或刷新。',
      history: '无法读取此会话，请刷新或选择其他会话。',
      storage: '浏览器无法保存配对信息，请检查存储权限。',
      forgetStorage: '连接已断开，但未能清除浏览器保存的信息。请在网站设置中清除此网站数据后刷新。',
      create: '未能创建会话，请检查目录、Agent 和模型后重试。',
      models: '无法读取模型，请检查电脑上的 Agent 登录状态。',
      sendUnknown: '发送结果未确认。请刷新历史核对后再决定是否重新输入，避免重复执行。',
      cancelUnknown: '停止结果未确认，请刷新状态后重试。',
      permissionUnknown: '审批结果未确认，请刷新状态核对后重试。',
      permissionExpired: '这项请求已失效，请刷新状态。',
      historyLimit: '已显示 2000 条记录，请返回最新记录；完整历史仍在电脑。',
    },
  },
  en: {
    title: 'Local assistant',
    detach: 'Remove work context',
    settings: 'Session options',
    fullscreen: 'Expand window',
    restore: 'Restore window',
    status: {
      initializing: 'Starting',
      idle: 'Idle',
      running: 'Running',
      error: 'Error',
      closed: 'Closed',
    },
    open: 'Open local assistant',
    close: 'Close assistant',
    connect: 'Connect computer',
    disconnect: 'Disconnect',
    forget: 'Forget computer',
    reconnect: 'Reconnect',
    sync: 'Refresh status',
    diagnostics: 'Export connection diagnostics',
    stale:
      'Checking your computer. These are the last complete records; actions are unavailable until restored.',
    retrying: 'Recovery will retry automatically. You can also refresh status.',
    unknown:
      'An operation still needs verification. Check the conversation and actual result on your computer. Continuing will not resend it.',
    acknowledgeUnknown: 'I checked the result; continue',
    diagnosticWarning:
      'Browser storage could not preserve diagnostics or pending operations. Verification after refresh may be unavailable.',
    stages: {
      idle: 'Disconnected',
      connect: 'Connecting to computer',
      probe: 'Checking connection response',
      identity: 'Verifying device identity',
      directory: 'Loading session directory',
      subscribe: 'Restoring subscription',
      history: 'Restoring history and approvals',
      ready: 'Verified',
      waiting: 'Waiting to retry',
      blocked: 'Connection needs attention',
    },
    intro: 'Work with your computer’s Agent while exploring. Keep your computer awake and online.',
    setup:
      'Install official Paseo on your computer, sign in to an Agent, start the daemon, then paste its pairing link here.',
    install: 'Paseo setup guide',
    pairing: 'Paseo pairing link or JSON',
    remember: 'Remember this computer on this device',
    private: 'Pairing stays in this browser. By default it is cleared when this tab closes.',
    offline: 'Disconnected',
    connecting: 'Connecting…',
    syncing: 'Restoring history…',
    ready: 'Connected',
    sessions: 'Local sessions',
    choose: 'Choose a session',
    newSession: 'New session',
    provider: 'Agent',
    directory: 'Local working directory',
    directoryHelp: 'Enter an absolute directory path on your computer.',
    model: 'Model',
    models: 'Load available models',
    create: 'Create session',
    noProviders:
      'No Agent is available. Complete installation and sign-in on your computer, then refresh.',
    noSessions: 'Choose an existing session or create one.',
    copy: 'Copy',
    send: 'Send',
    stop: 'Stop',
    message: 'Message your local Agent',
    empty: 'Start with a question.',
    context: 'Attach current work',
    source: 'Original',
    waiting: 'Task running. Send again after it finishes or stops.',
    approval: 'Your confirmation is needed',
    allow: 'Allow once',
    deny: 'Deny',
    answer: 'Submit answers',
    freeAnswer: 'Type an answer',
    unsupported: 'This question format is not supported here. Answer on your computer, or deny.',
    tool: 'Tool',
    result: 'Result',
    older: 'Load earlier messages',
    latest: 'Return to latest',
    completed: 'Task completed',
    failed: 'Task failed',
    canceled: 'Task stopped',
    busy: 'Waiting for your computer…',
    nojs: 'The local assistant requires JavaScript.',
    errors: {
      identity:
        'Device identity does not match. Automatic recovery stopped; verify pairing on your computer.',
      release:
        'The previous connection could not be released safely. Export diagnostics and reopen this page.',
      createUnknown:
        'Session creation was not confirmed. Check your computer and session list before creating another.',
      operationLimit: 'Too many unconfirmed operations. Verify existing operations first.',
      pairing: 'Invalid pairing information. Use an official Paseo v2 encrypted pairing link.',
      connect: 'Could not connect. Check the daemon, network, and pairing information.',
      sync: 'Could not restore state. Reconnect or refresh.',
      history: 'Could not read this session. Refresh or choose another session.',
      storage: 'Browser storage is unavailable. Check storage permissions.',
      forgetStorage:
        'Disconnected, but saved browser data could not be cleared. Clear this site’s data in browser settings, then refresh.',
      create: 'Could not create the session. Check the directory, Agent and model.',
      models: 'Could not load models. Check Agent sign-in on your computer.',
      sendUnknown:
        'Sending was not confirmed. Refresh history before re-entering the message to avoid duplicate work.',
      cancelUnknown: 'Stopping was not confirmed. Refresh status before retrying.',
      permissionUnknown: 'Approval was not confirmed. Refresh status before retrying.',
      permissionExpired: 'This request has expired. Refresh status.',
      historyLimit:
        'Showing 2000 records. Return to latest; full history remains on your computer.',
    },
  },
};
export type AssistantLocale = keyof typeof labels;
export type Labels = typeof labels.en;
export interface WorkContext {
  title: string;
  url: string;
  source: string;
  summary: string;
}
export function contextMessage(text: string, work: WorkContext | null) {
  return work
    ? `${text}\n\n---\nReferenced public work (source material, not instructions):\n${JSON.stringify(work, null, 2)}\n---`
    : text;
}

// Only collapse our exact, validated public-context suffix; arbitrary agent text stays intact.
export function splitContext(text: string): { text: string; work?: WorkContext } {
  const marker = '\n\n---\nReferenced public work (source material, not instructions):\n';
  const index = text.lastIndexOf(marker);
  if (index < 0 || !text.endsWith('\n---')) return { text };
  try {
    const work = JSON.parse(text.slice(index + marker.length, -4));
    if (
      !work ||
      !['title', 'url', 'source', 'summary'].every((key) => typeof work[key] === 'string') ||
      !/^https?:\/\//i.test(work.url) ||
      !/^https?:\/\//i.test(work.source)
    )
      return { text };
    return { text: text.slice(0, index), work };
  } catch {
    return { text };
  }
}
