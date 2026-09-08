import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  useAuiState,
  type ToolCallMessagePartProps,
} from '@assistant-ui/react';
import {
  FileTextIcon,
  Maximize2Icon,
  Minimize2Icon,
  MoreHorizontalIcon,
  XIcon,
} from 'lucide-react';
import type { AssistantStore } from '../../lib/assistant/store';
import {
  contextMessage,
  labels,
  type AssistantLocale,
  type WorkContext,
} from '../../lib/assistant/labels';
import { toMessages } from '../../lib/assistant/timeline';
import { permissionMessages, respondToApproval } from '../../lib/assistant/approvals';
import { AssistantModal } from '../assistant-ui/elements/assistant-modal.aui';
import { Thread } from '../assistant-ui/elements/thread.aui';
import { ThreadListSidebar } from '../assistant-ui/elements/threadlist-sidebar.aui';
import { ToolFallback } from '../assistant-ui/elements/tool-fallback.aui';
import { Sources } from '../assistant-ui/elements/sources.aui';
import { TooltipIconButton } from '../assistant-ui/elements/tooltip-icon-button';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { TooltipProvider } from '../ui/tooltip';
import { Alert, AlertDescription } from '../ui/alert';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { sourceVariants } from '../assistant-ui/elements/sources.aui';
import { ui } from '../../lib/assistant/ui-text';
import { Button } from '../ui/button';
import { PairingForm } from './PairingForm';
import { SessionForm } from './SessionForm';
import { QuestionForm } from './QuestionForm';
const identity = <T,>(value: T) => value;

export function WorkSource({ work }: { work: WorkContext }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className={sourceVariants({ variant: 'outline' })}
          aria-label={ui('Work context')}
        >
          <FileTextIcon className="aui:size-3" />
          <Sources.Title>{work.title}</Sources.Title>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="aui:max-h-96 aui:space-y-3 aui:overflow-y-auto">
        <p className="aui:text-sm aui:font-medium">{work.title}</p>
        <p className="aui:text-sm aui:leading-relaxed aui:text-muted-foreground">{work.summary}</p>
        <div className="aui:flex aui:flex-wrap aui:gap-2">
          <Sources.Root href={work.url} referrerPolicy="no-referrer">
            Vibes
          </Sources.Root>
          <Sources.Root href={work.source} referrerPolicy="no-referrer">
            {ui('Original work')}
          </Sources.Root>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserContext() {
  const work = useAuiState((s) => s.message.metadata.custom.work) as WorkContext | undefined;
  return work ? (
    <div className="aui:col-start-2 aui:justify-self-end">
      <WorkSource work={work} />
    </div>
  ) : null;
}

export function App({
  store,
  locale,
  work,
}: {
  store: AssistantStore;
  locale: AssistantLocale;
  work: WorkContext | null;
}) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const t = labels[locale];
  const [open, setOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [newSession, setNewSession] = useState(false);
  const [attached, setAttached] = useState(true);
  useEffect(() => setAttached(true), [work?.url]);
  useEffect(() => {
    const show = () => setOpen(true);
    document.addEventListener('assistant:open', show);
    return () => document.removeEventListener('assistant:open', show);
  }, []);
  const running = state.agent?.status === 'running' || state.agent?.status === 'initializing';
  const messages = useMemo(
    () => [
      ...toMessages(state.rows, running),
      ...permissionMessages(state.agent?.pendingPermissions ?? [], t),
    ],
    [state.rows, state.agent?.pendingPermissions, running, t],
  );
  const disabled =
    state.connection !== 'ready' ||
    state.busy ||
    state.loading ||
    !state.agent ||
    running ||
    !!state.agent.pendingPermissions.length ||
    !!state.error?.endsWith('Unknown');
  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage: identity,
    isRunning: running,
    isLoading: state.loading,
    isSendDisabled: disabled,
    onNew: async (message) => {
      await store.send(
        contextMessage(
          message.content
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('\n'),
          attached ? work : null,
        ),
      );
    },
    onCancel: store.cancel,
    onRefetchThread: store.resync,
    onRespondToToolApproval: (options) => respondToApproval(store, options),
    adapters: {
      threadList: {
        threadId: state.selectedId || 'unselected',
        isLoading: state.connection === 'syncing',
        threads: state.agents.map((agent) => ({
          id: agent.id,
          title: agent.title || agent.id.slice(0, 8),
          status: 'regular' as const,
          custom: { status: agent.status },
        })),
        onSwitchToThread: store.select,
        onSwitchToNewThread: () => setNewSession(true),
      },
    },
  });
  const Tool = useMemo(
    () =>
      function PaseoTool(props: ToolCallMessagePartProps) {
        const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
        const request = store
          .getSnapshot()
          .agent?.pendingPermissions.find((p) => p.id === props.approval?.id);
        return request?.kind === 'question' ? (
          <QuestionForm request={request} store={store} t={t} {...props} />
        ) : (
          <fieldset
            disabled={
              snapshot.busy ||
              snapshot.loading ||
              snapshot.connection !== 'ready' ||
              !!snapshot.error?.endsWith('Unknown')
            }
          >
            <ToolFallback {...props} />
          </fieldset>
        );
      },
    [store, t],
  );
  const ComposerLeading = () => (
    <div className="aui:flex aui:min-w-0 aui:items-center aui:gap-1">
      {work && attached && (
        <>
          <WorkSource work={work} />
          <TooltipIconButton tooltip={t.detach} onClick={() => setAttached(false)}>
            <XIcon />
          </TooltipIconButton>
        </>
      )}
      {state.agent?.model && (
        <span
          className="aui:truncate aui:text-xs aui:text-muted-foreground"
          title={state.agent.model}
        >
          {state.agent.model}
        </span>
      )}
    </div>
  );
  return (
    <TooltipProvider key={locale}>
      <AssistantRuntimeProvider runtime={runtime}>
        <AssistantModal open={open} onOpenChange={setOpen} title={t.title} fullscreen={fullscreen}>
          <SidebarProvider
            defaultOpen={false}
            className="aui:relative aui:h-full aui:min-h-0 aui:overflow-hidden"
            style={{ '--sidebar-width': '15rem' } as React.CSSProperties}
          >
            {state.device && <ThreadListSidebar className="aui:absolute aui:h-full" />}
            <SidebarInset className="aui:min-w-0 aui:bg-background">
              <header className="aui:flex aui:h-14 aui:shrink-0 aui:items-center aui:gap-2 aui:border-b aui:px-4">
                {state.device && <SidebarTrigger />}
                <div className="aui:min-w-0 aui:flex-1">
                  <h2 className="aui:truncate aui:text-sm aui:font-medium">
                    {state.agent?.title || t.title}
                  </h2>
                  <p role="status" className="aui:truncate aui:text-xs aui:text-muted-foreground">
                    {state.outcome ? t[state.outcome] : t[state.connection]}
                    {state.agent ? ` · ${t.status[state.agent.status]}` : ''}
                  </p>
                </div>
                {state.device && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <TooltipIconButton tooltip={t.settings}>
                        <MoreHorizontalIcon />
                      </TooltipIconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {state.agent && (
                        <>
                          <DropdownMenuLabel className="aui:max-w-72 aui:font-normal">
                            <p>
                              {state.agent.provider} · {state.agent.model}
                            </p>
                            <p
                              className="aui:mt-1 aui:break-all aui:text-muted-foreground"
                              aria-label={t.directory}
                            >
                              {state.agent.cwd}
                            </p>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        disabled={state.busy || state.loading}
                        onSelect={() => void store.resync()}
                      >
                        {t.sync}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          state.connection === 'offline'
                            ? void store.connect()
                            : void store.disconnect()
                        }
                      >
                        {state.connection === 'offline' ? t.reconnect : t.disconnect}
                      </DropdownMenuItem>
                      {work && (
                        <DropdownMenuCheckboxItem checked={attached} onCheckedChange={setAttached}>
                          {t.context}
                        </DropdownMenuCheckboxItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => void store.forget()}>
                        {t.forget}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <TooltipIconButton
                  className="aui:max-sm:hidden"
                  tooltip={fullscreen ? t.restore : t.fullscreen}
                  onClick={() => setFullscreen(!fullscreen)}
                >
                  {fullscreen ? <Minimize2Icon /> : <Maximize2Icon />}
                </TooltipIconButton>
                <TooltipIconButton tooltip={t.close} onClick={() => setOpen(false)}>
                  <XIcon />
                </TooltipIconButton>
              </header>
              {state.error && (
                <Alert variant="destructive" className="aui:mx-4 aui:mt-3 aui:w-auto">
                  <AlertDescription>
                    {t.errors[state.error as keyof typeof t.errors] ?? t.errors.sync}
                  </AlertDescription>
                </Alert>
              )}
              {!state.device ? (
                <PairingForm store={store} t={t} />
              ) : (
                <>
                  {state.hasOlder && (
                    <div className="aui:flex aui:justify-center aui:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={state.loading}
                        onClick={() => void store.older()}
                      >
                        {t.older}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={state.loading}
                        onClick={() => void store.select(state.selectedId)}
                      >
                        {t.latest}
                      </Button>
                    </div>
                  )}
                  {!state.selectedId ? (
                    <div className="aui:flex aui:flex-1 aui:flex-col aui:items-center aui:justify-center aui:gap-4 aui:p-6">
                      <p>{t.noSessions}</p>
                      <Button
                        onClick={() => setNewSession(true)}
                        disabled={state.connection !== 'ready'}
                      >
                        {t.newSession}
                      </Button>
                    </div>
                  ) : (
                    <div className="aui:min-h-0 aui:flex-1">
                      <Thread components={{ ToolFallback: Tool, UserContext, ComposerLeading }} />
                    </div>
                  )}
                </>
              )}
            </SidebarInset>
          </SidebarProvider>
          <SessionForm
            open={newSession}
            onOpenChange={setNewSession}
            store={store}
            state={state}
            t={t}
          />
        </AssistantModal>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
