import type { AssistantLocale } from './contract';

export const shellCopy = {
  zh: {
    assistant: '本地助手',
    article: '和 Agent 聊这篇',
    introTitle: '把电脑上的 Agent 带到这里',
    intro: '一边读作品，一边让自己的 Agent 帮你思考和动手。你的电脑需要保持开机，运行 Paseo。',
    installTitle: '1. 在电脑上安装 Paseo',
    install: '桌面 App 打开后会自动启动连接服务。也可以使用官方 CLI。',
    download: '下载桌面 App',
    docs: 'CLI 与安装说明',
    agentTitle: '2. 准备你的 Agent',
    agent:
      '在电脑上安装并登录 Codex 或其他受支持的 Agent。Paseo 不包含模型账号，使用沿用你的账号与配置。',
    pairTitle: '3. 连接这台电脑',
    pair: '在 Paseo 桌面 App 的 Settings → 你的 host → Pair Device 获取配对信息；CLI 启动后按提示启用中继并显示配对二维码。接着在这里完成配对。',
    mobile: '用手机也可以浏览和对话，但仍需要一台正在运行 Paseo 的电脑。',
    connect: '已安装，去连接',
    preparing: '安装过程中，工作台会在后台准备。',
    help: '安装与连接帮助',
    expand: '专注交流',
    compact: '返回边读边聊',
    close: '收起助手',
    retry: '重试加载',
    reload: '刷新页面',
    referenceRetry: '重试附带文章',
    noscript: '启用 JavaScript 后可打开本地助手。',
    idle: '正在准备工作台…',
    loading: '正在准备工作台…',
    initializing: '正在打开 Paseo…',
    operable: '工作台已准备，可继续连接电脑。',
    resourceError: '工作台资源加载失败，请检查网络后重试。',
    fatal: '工作台初始化失败，请刷新页面后再打开。',
    disposed: '正在退出；电脑上的任务不会因此停止。',
    stalled: '工作台仍在加载。可以继续查看安装说明，或刷新页面重试。',
    referenceError: '文章引用尚未附上，原有草稿仍然保留。',
  },
  en: {
    assistant: 'Local assistant',
    article: 'Discuss this with your Agent',
    introTitle: 'Bring your computer’s Agent here',
    intro:
      'Explore a work while your own Agent helps you think and make things. Keep your computer awake with Paseo running.',
    installTitle: '1. Install Paseo on your computer',
    install:
      'The desktop app starts its connection service automatically. The official CLI also works.',
    download: 'Download desktop app',
    docs: 'CLI and setup guide',
    agentTitle: '2. Prepare your Agent',
    agent:
      'Install and sign in to Codex or another supported Agent on your computer. Paseo does not include a model account; your existing account and configuration apply.',
    pairTitle: '3. Connect your computer',
    pair: 'In the desktop app, open Settings → your host → Pair Device. With the CLI, follow the startup prompts to enable relay and show a pairing QR code. Then finish pairing here.',
    mobile: 'You can browse and chat on your phone, with Paseo still running on a computer.',
    connect: 'Already installed — connect',
    preparing: 'The workspace prepares in the background while you set up.',
    help: 'Setup and connection help',
    expand: 'Focus on the conversation',
    compact: 'Return to reading and chat',
    close: 'Hide assistant',
    retry: 'Retry loading',
    reload: 'Reload page',
    referenceRetry: 'Retry article reference',
    noscript: 'Enable JavaScript to open the local assistant.',
    idle: 'Preparing the workspace…',
    loading: 'Preparing the workspace…',
    initializing: 'Opening Paseo…',
    operable: 'The workspace is ready. You can continue to connect your computer.',
    resourceError: 'Workspace resources failed to load. Check your connection and retry.',
    fatal: 'Workspace initialization failed. Reload the page and try again.',
    disposed: 'Exiting; tasks on your computer will continue.',
    stalled: 'The workspace is still loading. You can read the setup guide or reload to retry.',
    referenceError: 'The article reference has not been added. Your existing draft is preserved.',
  },
} as const;

export type ShellCopyKey = keyof typeof shellCopy.zh;
export function updateShellCopy(panel: HTMLElement, locale: AssistantLocale): void {
  const text = shellCopy[locale];
  for (const element of panel.querySelectorAll<HTMLElement>('[data-paseo-copy]')) {
    const key = element.dataset.paseoCopy as ShellCopyKey;
    if (key in text) element.textContent = text[key];
  }
  for (const button of panel.querySelectorAll<HTMLElement>('[data-paseo-label]')) {
    const key = button.dataset.paseoLabel as ShellCopyKey;
    if (key in text) {
      button.setAttribute('aria-label', text[key]);
      button.title = text[key];
    }
  }
  panel.setAttribute('aria-label', text.assistant);
}
