'use client';
import { ui } from '@/lib/assistant/ui-text';

import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from '@/components/assistant-ui/elements/attachment.aui';
import { File } from '@/components/assistant-ui/elements/file';
import { ThreadFollowupSuggestions } from '@/components/assistant-ui/elements/follow-up-suggestions.aui';
import { Image } from '@/components/assistant-ui/elements/image';
import { MarkdownText } from '@/components/assistant-ui/elements/markdown-text';
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from '@/components/assistant-ui/elements/reasoning.aui';
import { ToolFallback } from '@/components/assistant-ui/elements/tool-fallback.aui';
import {
  ToolGroupContent,
  ToolGroupRoot,
  ToolGroupTrigger,
} from '@/components/assistant-ui/elements/tool-group.aui';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  type AssistantState,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  groupPartByType,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  type FileMessagePartComponent,
  type ImageMessagePartComponent,
  type ToolCallMessagePartComponent,
  useAuiState,
} from '@assistant-ui/react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MicIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
} from 'lucide-react';
import {
  createContext,
  useContext,
  type ComponentType,
  type FC,
  type PropsWithChildren,
} from 'react';

export type ThreadGroupPart = MessagePrimitive.GroupedParts.GroupPart;

/**
 * Optional component overrides for the thread. `AssistantMessage` and
 * `Welcome` replace whole sections; the remaining slots override how the
 * assistant message renders tool calls and part groups. Tool UIs registered
 * by name (toolkit `render`, `useAssistantDataUI`) take precedence over
 * `ToolFallback`.
 */
export type ThreadComponents = {
  UserContext?: ComponentType | undefined;
  ComposerLeading?: ComponentType | undefined;
  AssistantMessage?: ComponentType | undefined;
  Welcome?: ComponentType | undefined;
  ToolFallback?: ToolCallMessagePartComponent | undefined;
  ToolGroup?: ComponentType<PropsWithChildren<{ group: ThreadGroupPart }>> | undefined;
  ReasoningGroup?: ComponentType<PropsWithChildren<{ group: ThreadGroupPart }>> | undefined;
};

export type ThreadProps = {
  components?: ThreadComponents | undefined;
  autoFocus?: boolean | undefined;
};

const groupChatParts = groupPartByType({
  reasoning: ['group-chainOfThought', 'group-reasoning'],
  'tool-call': ['group-chainOfThought', 'group-tool'],
  'standalone-tool-call': [],
});
const EMPTY_COMPONENTS: ThreadComponents = {};

const ThreadComponentsContext = createContext<ThreadComponents>(EMPTY_COMPONENTS);

// Startup exposes a loading placeholder thread; treat it as a new chat so
// the composer mounts centered. Loads after startup keep the docked layout.
const isNewChatView = (s: AssistantState) =>
  s.thread.messages.length === 0 && (!s.thread.isLoading || s.threads.isLoading);

// A switched thread that is still fetching its history: skeleton, not welcome.
const isHistoryLoadingView = (s: AssistantState) =>
  s.thread.messages.length === 0 &&
  s.thread.isLoading &&
  !s.thread.isDisabled &&
  !s.threads.isLoading;

const ThreadHistorySkeleton: FC = () => (
  <div
    data-slot="aui_thread-history-skeleton"
    role="status"
    className="aui:animate-in aui:fade-in aui:fill-mode-both aui:flex aui:flex-col aui:gap-y-6 aui:[animation-delay:150ms] aui:[animation-duration:200ms]"
  >
    <span className="aui:sr-only">{ui('Loading conversation')}</span>
    <Skeleton className="aui:ml-auto aui:h-9 aui:w-2/5 aui:rounded-xl aui:motion-reduce:animate-none" />
    <div className="aui:flex aui:flex-col aui:gap-y-2">
      <Skeleton className="aui:h-4 aui:w-11/12 aui:motion-reduce:animate-none" />
      <Skeleton className="aui:h-4 aui:w-4/5 aui:motion-reduce:animate-none" />
      <Skeleton className="aui:h-4 aui:w-3/5 aui:motion-reduce:animate-none" />
    </div>
    <Skeleton className="aui:ml-auto aui:h-9 aui:w-1/3 aui:rounded-xl aui:motion-reduce:animate-none" />
    <div className="aui:flex aui:flex-col aui:gap-y-2">
      <Skeleton className="aui:h-4 aui:w-10/12 aui:motion-reduce:animate-none" />
      <Skeleton className="aui:h-4 aui:w-2/3 aui:motion-reduce:animate-none" />
    </div>
  </div>
);

export const Thread: FC<ThreadProps> = ({ components = EMPTY_COMPONENTS, autoFocus = true }) => {
  const isEmpty = useAuiState(isNewChatView);

  return (
    <ThreadComponentsContext.Provider value={components}>
      <ThreadRoot isEmpty={isEmpty} autoFocus={autoFocus} />
    </ThreadComponentsContext.Provider>
  );
};

const ThreadRoot: FC<{ isEmpty: boolean; autoFocus: boolean }> = ({ isEmpty, autoFocus }) => {
  const { Welcome = ThreadWelcome } = useContext(ThreadComponentsContext);

  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root aui:bg-background aui:@container aui:flex aui:h-full aui:flex-col"
      style={{
        ['--thread-max-width' as string]: '44rem',
        ['--composer-bg' as string]: 'var(--color-card)',
        ['--composer-radius' as string]: '1.5rem',
        ['--composer-padding' as string]: '8px',
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        data-slot="aui_thread-viewport"
        className="aui:relative aui:flex aui:flex-1 aui:flex-col aui:overflow-x-auto aui:overflow-y-scroll aui:scroll-smooth"
      >
        <div
          className={cn(
            'aui:mx-auto aui:flex aui:w-full aui:max-w-(--thread-max-width) aui:flex-1 aui:flex-col aui:px-4 aui:pt-4',
            isEmpty && 'aui:justify-center',
          )}
        >
          <AuiIf condition={isNewChatView}>
            <Welcome />
          </AuiIf>
          <AuiIf condition={isHistoryLoadingView}>
            <ThreadHistorySkeleton />
          </AuiIf>

          <div
            data-slot="aui_message-group"
            className="aui:mb-14 aui:flex aui:flex-col aui:gap-y-6 aui:empty:hidden"
          >
            <ThreadPrimitive.Messages>{() => <ThreadMessage />}</ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter
            className={cn(
              'aui-thread-viewport-footer aui:bg-background aui:flex aui:flex-col aui:gap-4 aui:overflow-visible aui:pb-4 aui:md:pb-6',
              !isEmpty && 'aui:sticky aui:bottom-0 aui:mt-auto aui:rounded-t-(--composer-radius)',
            )}
          >
            <ThreadScrollToBottom />
            <ThreadFollowupSuggestions />
            <Composer autoFocus={autoFocus} />
            <AuiIf condition={(s) => isNewChatView(s) && s.composer.isEmpty}>
              <ThreadSuggestions />
            </AuiIf>
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const { AssistantMessage: AssistantMessageComponent = AssistantMessage } =
    useContext(ThreadComponentsContext);
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);

  if (isEditing) return <EditComposer />;
  if (role === 'user') return <UserMessage />;
  return <AssistantMessageComponent />;
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip={ui('Scroll to bottom')}
        variant="outline"
        className="aui-thread-scroll-to-bottom aui:dark:border-border aui:dark:bg-background aui:dark:hover:bg-accent aui:absolute aui:-top-12 aui:z-10 aui:self-center aui:rounded-full aui:p-4 aui:disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root aui:mb-6 aui:flex aui:flex-col aui:items-center aui:px-4 aui:text-center">
      <h1 className="aui-thread-welcome-message-inner aui:fade-in aui:slide-in-from-bottom-1 aui:animate-in aui:fill-mode-both aui:text-2xl aui:font-medium aui:tracking-tight aui:duration-200">
        {ui('How can I help you today?')}
      </h1>
    </div>
  );
};

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions aui:flex aui:w-full aui:flex-wrap aui:items-center aui:justify-center aui:gap-2 aui:px-4">
      <ThreadPrimitive.Suggestions>{() => <ThreadSuggestionItem />}</ThreadPrimitive.Suggestions>
    </div>
  );
};

const ThreadSuggestionItem: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestion-display aui:fade-in aui:slide-in-from-bottom-2 aui:animate-in aui:fill-mode-both aui:duration-200">
      <SuggestionPrimitive.Trigger send asChild>
        <Button
          variant="ghost"
          className="aui-thread-welcome-suggestion aui:text-foreground aui:hover:bg-muted aui:border-border/60 aui:h-auto aui:gap-1.5 aui:rounded-full aui:border aui:px-3.5 aui:py-1.5 aui:text-sm aui:font-normal aui:whitespace-nowrap aui:transition-colors"
        >
          <SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1" />
          <SuggestionPrimitive.Description className="aui-thread-welcome-suggestion-text-2 aui:empty:hidden" />
        </Button>
      </SuggestionPrimitive.Trigger>
    </div>
  );
};

const Composer: FC<{ autoFocus: boolean }> = ({ autoFocus }) => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root aui:relative aui:flex aui:w-full aui:flex-col">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div
          data-slot="aui_composer-shell"
          className="aui:border-border/60 aui:data-[dragging=true]:border-ring aui:focus-within:border-border aui:dark:border-muted-foreground/15 aui:dark:focus-within:border-muted-foreground/30 aui:flex aui:w-full aui:cursor-text aui:flex-col aui:gap-2 aui:rounded-(--composer-radius) aui:border aui:bg-(--composer-bg) aui:p-(--composer-padding) aui:transition-[border-color] aui:data-[dragging=true]:border-dashed aui:data-[dragging=true]:bg-[color-mix(in_oklab,var(--color-accent)_50%,var(--color-background))]"
        >
          <ComposerAttachments />
          <ComposerPrimitive.Input
            placeholder={ui('Send a message...')}
            className="aui-composer-input aui:caret-primary aui:placeholder:text-muted-foreground/60 aui:max-h-48 aui:min-h-10 aui:w-full aui:resize-none aui:bg-transparent aui:px-2.5 aui:py-1 aui:text-base aui:leading-6 aui:outline-none"
            rows={1}
            autoFocus={autoFocus}
            enterKeyHint="send"
            aria-label={ui('Message input')}
          />
          <ComposerAction />
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  const { ComposerLeading } = useContext(ThreadComponentsContext);
  return (
    <div className="aui-composer-action-wrapper aui:relative aui:flex aui:items-center aui:justify-between">
      <div className="aui:flex aui:min-w-0 aui:flex-1 aui:items-center aui:gap-1">
        <AuiIf condition={(s) => s.thread.capabilities.attachments}>
          <ComposerAddAttachment />
        </AuiIf>
        {ComposerLeading && <ComposerLeading />}
      </div>
      <div className="aui:flex aui:items-center aui:gap-1.5">
        <AuiIf condition={(s) => s.thread.capabilities.dictation}>
          <AuiIf condition={(s) => s.composer.dictation == null}>
            <ComposerPrimitive.Dictate asChild>
              <TooltipIconButton
                tooltip={ui('Voice input')}
                side="bottom"
                type="button"
                variant="ghost"
                size="icon"
                className="aui-composer-dictate aui:text-muted-foreground aui:hover:text-foreground aui:size-7 aui:rounded-full"
                aria-label={ui('Start voice input')}
              >
                <MicIcon className="aui-composer-dictate-icon aui:size-4" />
              </TooltipIconButton>
            </ComposerPrimitive.Dictate>
          </AuiIf>
          <AuiIf condition={(s) => s.composer.dictation != null}>
            <ComposerPrimitive.StopDictation asChild>
              <TooltipIconButton
                tooltip={ui('Stop dictation')}
                side="bottom"
                type="button"
                variant="ghost"
                size="icon"
                className="aui-composer-stop-dictation aui:text-destructive aui:size-7 aui:rounded-full"
                aria-label={ui('Stop voice input')}
              >
                <SquareIcon className="aui-composer-stop-dictation-icon aui:size-3.5 aui:animate-pulse aui:fill-current" />
              </TooltipIconButton>
            </ComposerPrimitive.StopDictation>
          </AuiIf>
        </AuiIf>
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send asChild>
            <TooltipIconButton
              tooltip={ui('Send message')}
              side="bottom"
              type="button"
              variant="default"
              size="icon"
              className="aui-composer-send aui:size-7 aui:rounded-full"
              aria-label={ui('Send message')}
            >
              <ArrowUpIcon className="aui-composer-send-icon aui:size-4" />
            </TooltipIconButton>
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel asChild>
            <Button
              type="button"
              variant="default"
              size="icon"
              className="aui-composer-cancel aui:size-7 aui:rounded-full"
              aria-label={ui('Stop generating')}
            >
              <SquareIcon className="aui-composer-cancel-icon aui:size-3.5 aui:fill-current" />
            </Button>
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root aui:border-destructive aui:bg-destructive/10 aui:text-destructive aui:dark:bg-destructive/5 aui:mt-2 aui:rounded-md aui:border aui:p-3 aui:text-sm aui:dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message aui:line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  const {
    ToolFallback: ToolFallbackComponent = ToolFallback,
    ToolGroup,
    ReasoningGroup,
  } = useContext(ThreadComponentsContext);

  const ACTION_BAR_PT = 'aui:pt-1.5';
  // Keep the action bar inside the contained root's paint box, then cancel its reserved space in flow.
  const ACTION_BAR_HEIGHT = `aui:min-h-7.5 ${ACTION_BAR_PT}`;

  return (
    <MessagePrimitive.Root
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      className="aui:fade-in aui:slide-in-from-bottom-1 aui:animate-in aui:relative aui:-mb-7.5 aui:pb-7.5 aui:duration-150 aui:[contain-intrinsic-size:auto_200px] aui:[content-visibility:auto]"
    >
      <div
        data-slot="aui_assistant-message-content"
        className="aui:text-foreground aui:px-2 aui:leading-relaxed aui:wrap-break-word"
      >
        <MessagePrimitive.GroupedParts
          groupBy={(part, context) =>
            part.type === 'tool-call' && part.approval ? [] : groupChatParts(part, context)
          }
        >
          {({ part, children }) => {
            switch (part.type) {
              case 'group-chainOfThought':
                return <div data-slot="aui_chain-of-thought">{children}</div>;
              case 'group-tool':
                if (ToolGroup) {
                  return <ToolGroup group={part}>{children}</ToolGroup>;
                }
                return (
                  <ToolGroupRoot variant="ghost">
                    <ToolGroupTrigger
                      count={part.indices.length}
                      active={part.status.type === 'running'}
                    />
                    <ToolGroupContent>{children}</ToolGroupContent>
                  </ToolGroupRoot>
                );
              case 'group-reasoning': {
                if (ReasoningGroup) {
                  return <ReasoningGroup group={part}>{children}</ReasoningGroup>;
                }
                const running = part.status.type === 'running';
                return (
                  <ReasoningRoot streaming={running}>
                    <ReasoningTrigger active={running} />
                    <ReasoningContent aria-busy={running}>
                      <ReasoningText>{children}</ReasoningText>
                    </ReasoningContent>
                  </ReasoningRoot>
                );
              }
              case 'text':
                return <MarkdownText />;
              case 'reasoning':
                return <Reasoning {...part} />;
              case 'tool-call':
                return part.toolUI ?? <ToolFallbackComponent {...part} />;
              case 'data':
                return part.dataRendererUI;
              case 'file':
                return (
                  <div data-slot="aui_assistant-message-file" className="aui:py-1">
                    <File {...part} />
                  </div>
                );
              case 'image':
                return (
                  <div data-slot="aui_assistant-message-image" className="aui:py-1">
                    <Image {...part} />
                  </div>
                );
              case 'indicator':
                return (
                  <span
                    data-slot="aui_assistant-message-indicator"
                    className="aui:animate-pulse aui:font-sans"
                    aria-label={ui('Assistant is working')}
                  >
                    {'●'}
                  </span>
                );
              default:
                return null;
            }
          }}
        </MessagePrimitive.GroupedParts>
        <MessageError />
      </div>

      <div
        data-slot="aui_assistant-message-footer"
        className={cn('aui:ms-2 aui:flex aui:items-center', ACTION_BAR_HEIGHT)}
      >
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root aui:text-muted-foreground aui:animate-in aui:fade-in aui:col-start-3 aui:row-start-2 aui:-ms-1 aui:flex aui:gap-1 aui:duration-200"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip={ui('Copy')}>
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon className="aui:animate-in aui:zoom-in-50 aui:fade-in aui:duration-200 aui:ease-out" />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon className="aui:animate-in aui:zoom-in-75 aui:fade-in aui:duration-150" />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <AuiIf condition={(s) => s.thread.capabilities.reload}>
        <ActionBarPrimitive.Reload asChild>
          <TooltipIconButton tooltip={ui('Refresh')}>
            <RefreshCwIcon />
          </TooltipIconButton>
        </ActionBarPrimitive.Reload>
      </AuiIf>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton tooltip={ui('More')} className="aui:data-[state=open]:bg-accent">
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="assistant-ui-scope aui-action-bar-more-content aui:bg-popover aui:text-popover-foreground aui:data-[state=open]:fade-in-0 aui:data-[state=open]:zoom-in-95 aui:data-[state=open]:animate-in aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95 aui:data-[state=closed]:animate-out aui:data-[side=bottom]:slide-in-from-top-2 aui:data-[side=left]:slide-in-from-right-2 aui:data-[side=right]:slide-in-from-left-2 aui:data-[side=top]:slide-in-from-bottom-2 aui:z-50 aui:min-w-[8rem] aui:overflow-hidden aui:rounded-xl aui:border aui:p-1.5"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item aui:hover:bg-accent aui:hover:text-accent-foreground aui:focus:bg-accent aui:focus:text-accent-foreground aui:flex aui:cursor-pointer aui:items-center aui:gap-2 aui:rounded-lg aui:px-2.5 aui:py-1.5 aui:text-sm aui:outline-none aui:select-none">
              <DownloadIcon className="aui:size-4" />
              {ui('Export as Markdown')}
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserFilePart: FileMessagePartComponent = (part) => (
  <div data-slot="aui_user-message-file" className="aui:py-1">
    <File {...part} />
  </div>
);

const UserImagePart: ImageMessagePartComponent = (part) => (
  <div data-slot="aui_user-message-image" className="aui:py-1">
    <Image {...part} />
  </div>
);

const UserMessage: FC = () => {
  const { UserContext } = useContext(ThreadComponentsContext);
  return (
    <MessagePrimitive.Root
      data-slot="aui_user-message-root"
      className="aui:fade-in aui:slide-in-from-bottom-1 aui:animate-in aui:grid aui:auto-rows-auto aui:grid-cols-[minmax(72px,1fr)_auto] aui:content-start aui:gap-y-2 aui:px-2 aui:duration-150 aui:[contain-intrinsic-size:auto_200px] aui:[content-visibility:auto] aui:[&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />
      {UserContext && <UserContext />}

      <div className="aui-user-message-content-wrapper aui:relative aui:col-start-2 aui:min-w-0">
        <div className="aui-user-message-content aui:peer aui:bg-muted aui:text-foreground aui:rounded-xl aui:px-4 aui:py-2 aui:wrap-break-word aui:empty:hidden">
          <MessagePrimitive.Parts components={{ File: UserFilePart, Image: UserImagePart }} />
        </div>
        <div className="aui-user-action-bar-wrapper aui:absolute aui:start-0 aui:top-1/2 aui:-translate-x-full aui:-translate-y-1/2 aui:pe-2 aui:peer-empty:hidden aui:rtl:translate-x-full">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker
        data-slot="aui_user-branch-picker"
        className="aui:col-span-full aui:col-start-1 aui:row-start-3 aui:-me-1 aui:justify-end"
      />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root aui:flex aui:flex-col aui:items-end"
    >
      <AuiIf condition={(s) => s.thread.capabilities.edit}>
        <ActionBarPrimitive.Edit asChild>
          <TooltipIconButton tooltip={ui('Edit')} className="aui-user-action-edit">
            <PencilIcon />
          </TooltipIconButton>
        </ActionBarPrimitive.Edit>
      </AuiIf>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_edit-composer-wrapper"
      className="aui:flex aui:flex-col aui:px-2 aui:[contain-intrinsic-size:auto_200px] aui:[content-visibility:auto]"
    >
      <ComposerPrimitive.Root className="aui-edit-composer-root aui:border-border/60 aui:dark:border-muted-foreground/15 aui:ms-auto aui:flex aui:w-full aui:max-w-[85%] aui:cursor-text aui:flex-col aui:rounded-(--composer-radius) aui:border aui:bg-(--composer-bg)">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input aui:text-foreground aui:min-h-14 aui:w-full aui:resize-none aui:bg-transparent aui:px-4 aui:pt-3 aui:pb-1 aui:text-base aui:outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer aui:mx-2.5 aui:mb-2.5 aui:flex aui:items-center aui:gap-1.5 aui:self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" className="aui:h-8 aui:rounded-full aui:px-3.5">
              {ui('Cancel')}
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" className="aui:h-8 aui:rounded-full aui:px-3.5">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        'aui-branch-picker-root aui:text-muted-foreground aui:-ms-2 aui:me-2 aui:inline-flex aui:items-center aui:text-xs',
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip={ui('Previous')}>
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state aui:font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip={ui('Next')}>
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
