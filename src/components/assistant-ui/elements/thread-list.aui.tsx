'use client';
import { ui } from '@/lib/assistant/ui-text';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AuiIf,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react';
import {
  ArchiveIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from 'lucide-react';
import {
  forwardRef,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FC,
} from 'react';

export const ThreadList: FC = () => {
  const [search, setSearch] = useState('');
  const hasThreads = useAuiState((s) => s.threads.threadIds.length > 0);

  return (
    <ThreadListRoot>
      <ThreadListNew />
      {hasThreads && <ThreadListSearch value={search} onValueChange={setSearch} />}
      <ThreadListItems searchQuery={hasThreads ? search : ''} />
    </ThreadListRoot>
  );
};

export const ThreadListSearch = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> & {
    value: string;
    onValueChange: (value: string) => void;
  }
>(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <div data-slot="aui_thread-list-search" className="aui:relative aui:px-0.5 aui:py-1">
      <SearchIcon
        data-slot="aui_thread-list-search-icon"
        className="aui:text-muted-foreground aui:pointer-events-none aui:absolute aui:start-3 aui:top-1/2 aui:size-4 aui:-translate-y-1/2"
      />
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={ui('Search threads')}
        placeholder={ui('Search threads')}
        className={cn('aui:h-8 aui:ps-8 aui:text-sm', className)}
        {...props}
      />
    </div>
  );
});

ThreadListSearch.displayName = 'ThreadListSearch';

export const ThreadListRoot: FC<ComponentPropsWithoutRef<typeof ThreadListPrimitive.Root>> = ({
  className,
  ...props
}) => {
  return (
    <ThreadListPrimitive.Root
      data-slot="aui_thread-list-root"
      className={cn('aui:flex aui:flex-col aui:gap-0.5', className)}
      {...props}
    />
  );
};

export const ThreadListItems: FC<ComponentPropsWithoutRef<'div'> & { searchQuery?: string }> = ({
  className,
  searchQuery = '',
  ...props
}) => {
  return (
    <div
      data-slot="aui_thread-list-items"
      className={cn('aui:flex aui:flex-col aui:gap-0.5', className)}
      {...props}
    >
      <AuiIf condition={(s) => s.threads.isLoading}>
        <ThreadListSkeleton />
      </AuiIf>
      <AuiIf condition={(s) => !s.threads.isLoading}>
        <ThreadListItemGroups searchQuery={searchQuery} />
      </AuiIf>
    </div>
  );
};

const DAY_IN_MS = 86_400_000;

const dateGroupLabel = (date: Date | undefined, startOfToday: number): string => {
  if (!date || date.getTime() >= startOfToday) return ui('Today');
  if (date.getTime() >= startOfToday - DAY_IN_MS) return ui('Yesterday');
  return ui('Earlier');
};

export type ThreadListGroup = { label: string; indices: number[] };

/**
 * Filters the thread list by title and buckets the matches by last activity
 * (Today, Yesterday, Earlier). `groups` is null when no thread carries a
 * date, in which case `filteredIndices` keeps the runtime order.
 */
export const useThreadListGroups = (searchQuery = '') => {
  const threadIds = useAuiState((s) => s.threads.threadIds);
  const threadItems = useAuiState((s) => s.threads.threadItems);

  const query = searchQuery.trim().toLowerCase();

  return useMemo(() => {
    const itemsById = new Map(threadItems.map((item) => [item.id, item]));
    const dates = threadIds.map((id) => itemsById.get(id)?.lastMessageAt);
    const filteredIndices = threadIds
      .map((id, index) => ({ id, index }))
      .filter(
        ({ id }) =>
          !query || (itemsById.get(id)?.title || ui('New Chat')).toLowerCase().includes(query),
      )
      .map(({ index }) => index);
    if (!filteredIndices.some((index) => dates[index])) {
      return { threadIds, filteredIndices, groups: null };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const time = (index: number) => dates[index]?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const sorted = [...filteredIndices].sort((a, b) => time(b) - time(a));

    const result: ThreadListGroup[] = [];
    for (const index of sorted) {
      const label = dateGroupLabel(dates[index], startOfToday);
      const lastGroup = result[result.length - 1];
      if (lastGroup?.label === label) {
        lastGroup.indices.push(index);
      } else {
        result.push({ label, indices: [index] });
      }
    }
    return { threadIds, filteredIndices, groups: result };
  }, [threadIds, threadItems, query]);
};

const ThreadListItemGroups: FC<{ searchQuery?: string }> = ({ searchQuery = '' }) => {
  const { threadIds, filteredIndices, groups } = useThreadListGroups(searchQuery);
  const query = searchQuery.trim();

  if (query && filteredIndices.length === 0) {
    return (
      <div
        data-slot="aui_thread-list-empty"
        className="aui:text-muted-foreground aui:px-2.5 aui:py-4 aui:text-sm"
      >
        {ui('No threads found')}
      </div>
    );
  }

  if (!groups) {
    return filteredIndices.map((index) => (
      <ThreadListPrimitive.ItemByIndex
        key={threadIds[index]}
        index={index}
        components={{ ThreadListItem }}
      />
    ));
  }

  return groups.map((group) => (
    <Fragment key={group.label}>
      <div
        data-slot="aui_thread-list-group-label"
        className="aui:text-muted-foreground aui:px-2.5 aui:pt-3 aui:pb-1 aui:text-xs aui:font-medium"
      >
        {group.label}
      </div>
      {group.indices.map((index) => (
        <ThreadListPrimitive.ItemByIndex
          key={threadIds[index]}
          index={index}
          components={{ ThreadListItem }}
        />
      ))}
    </Fragment>
  ));
};

export const ThreadListNew = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Button> & { labelClassName?: string }
>(({ className, labelClassName, children, ...props }, ref) => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        ref={ref}
        variant="ghost"
        data-slot="aui_thread-list-new"
        className={cn(
          'aui:hover:bg-muted aui:data-active:bg-muted aui:h-8 aui:justify-start aui:gap-2 aui:rounded-md aui:px-2.5 aui:text-sm aui:font-normal',
          className,
        )}
        {...props}
      >
        {children ?? (
          <>
            <PlusIcon data-slot="aui_thread-list-new-icon" className="aui:size-4 aui:shrink-0" />
            <span
              data-slot="aui_thread-list-new-label"
              className={cn('aui:whitespace-nowrap', labelClassName)}
            >
              {ui('New Thread')}
            </span>
          </>
        )}
      </Button>
    </ThreadListPrimitive.New>
  );
});

ThreadListNew.displayName = 'ThreadListNew';

const ThreadListSkeleton: FC = () => {
  return (
    <div className="aui:flex aui:flex-col aui:gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label={ui('Loading threads')}
          data-slot="aui_thread-list-skeleton-wrapper"
          className="aui:flex aui:h-8 aui:items-center aui:px-2.5"
        >
          <Skeleton data-slot="aui_thread-list-skeleton" className="aui:h-3.5 aui:w-full" />
        </div>
      ))}
    </div>
  );
};

export const ThreadListItem: FC<{ actionsEnabled?: boolean }> = ({ actionsEnabled = false }) => {
  const isRunning = useAuiState((s) => s.threadListItem.isRunning);
  const [isRenaming, setIsRenaming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (isRenaming || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    triggerRef.current?.focus();
  }, [isRenaming]);

  return (
    <ThreadListItemPrimitive.Root
      data-slot="aui_thread-list-item"
      className="aui:group aui:hover:bg-muted aui:focus-visible:bg-muted aui:data-active:bg-muted aui:has-focus-visible:bg-muted aui:has-data-[state=open]:bg-muted aui:relative aui:flex aui:h-8 aui:items-center aui:rounded-md aui:transition-colors aui:focus-visible:outline-none"
    >
      {isRenaming ? (
        <ThreadListItemRename
          onDone={(restoreFocus) => {
            restoreFocusRef.current = restoreFocus;
            setIsRenaming(false);
          }}
        />
      ) : (
        <ThreadListItemPrimitive.Trigger
          ref={triggerRef}
          data-slot="aui_thread-list-item-trigger"
          className="aui:focus-visible:ring-ring/50 aui:flex aui:h-full aui:min-w-0 aui:flex-1 aui:items-center aui:rounded-md aui:px-2.5 aui:text-start aui:text-sm aui:outline-none aui:group-hover:pe-9 aui:group-has-focus-visible:pe-9 aui:group-has-data-[state=open]:pe-9 aui:group-data-active:pe-9 aui:focus-visible:ring-1"
        >
          {isRunning && (
            <Loader2Icon
              aria-hidden
              data-slot="aui_thread-list-item-running"
              className="aui:text-muted-foreground aui:me-1.5 aui:size-3.5 aui:shrink-0 aui:animate-spin"
            />
          )}
          <span
            data-slot="aui_thread-list-item-title"
            className="aui:min-w-0 aui:flex-1 aui:truncate"
          >
            <ThreadListItemPrimitive.Title fallback={ui('New Chat')} />
          </span>
          {isRunning && <span className="aui:sr-only">{ui('Running')}</span>}
        </ThreadListItemPrimitive.Trigger>
      )}
      {/* Paseo first release exposes switching and creation only. */}
      {actionsEnabled && <ThreadListItemMore onRename={() => setIsRenaming(true)} />}
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemRename: FC<{
  onDone: (restoreFocus: boolean) => void;
}> = ({ onDone }) => {
  const aui = useAui();
  const title = useAuiState((s) => s.threadListItem.title) ?? '';
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const commit = (restoreFocus: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;

    const next = value.trim();
    if (!next || next === title) {
      onDone(restoreFocus);
      return;
    }

    // Deferred so a synchronous throw lands on the rejection path too.
    Promise.resolve()
      .then(() => aui.threadListItem.rename(next))
      .then(
        () => onDone(restoreFocus),
        () => {
          settledRef.current = false;
          if (restoreFocus) inputRef.current?.focus();
        },
      );
  };

  const cancel = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    onDone(true);
  };

  return (
    <Input
      ref={inputRef}
      autoFocus
      data-slot="aui_thread-list-item-rename"
      aria-label={ui('Rename thread')}
      value={value}
      className="aui:h-7 aui:min-w-0 aui:flex-1 aui:ps-2.5 aui:pe-9 aui:text-sm"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => commit(false)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit(true);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancel();
        }
      }}
    />
  );
};

const ThreadListItemMore: FC<{ onRename: () => void }> = ({ onRename }) => {
  return (
    <ThreadListItemMorePrimitive.Root sharedFocusGroup>
      <ThreadListItemMorePrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-slot="aui_thread-list-item-more"
          className="aui:data-[state=open]:bg-accent aui:absolute aui:end-1.5 aui:top-1/2 aui:size-6 aui:-translate-y-1/2 aui:p-0 aui:opacity-0 aui:group-hover:opacity-100 aui:group-has-focus-visible:opacity-100 aui:group-data-active:opacity-100 aui:data-[state=open]:opacity-100"
        >
          <MoreHorizontalIcon className="aui:size-3.5" />
          <span className="aui:sr-only">{ui('More options')}</span>
        </Button>
      </ThreadListItemMorePrimitive.Trigger>
      <ThreadListItemMorePrimitive.Content
        side="right"
        align="start"
        sideOffset={6}
        data-slot="aui_thread-list-item-more-content"
        className="assistant-ui-scope aui:bg-popover aui:text-popover-foreground aui:data-[state=open]:fade-in-0 aui:data-[state=open]:zoom-in-95 aui:data-[state=open]:animate-in aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95 aui:data-[state=closed]:animate-out aui:data-[side=bottom]:slide-in-from-top-2 aui:data-[side=left]:slide-in-from-right-2 aui:data-[side=right]:slide-in-from-left-2 aui:data-[side=top]:slide-in-from-bottom-2 aui:z-50 aui:min-w-32 aui:overflow-hidden aui:rounded-xl aui:border aui:p-1.5"
      >
        <ThreadListItemMorePrimitive.Item
          data-slot="aui_thread-list-item-more-item"
          className="aui:hover:bg-accent aui:hover:text-accent-foreground aui:focus:bg-accent aui:focus:text-accent-foreground aui:flex aui:cursor-pointer aui:items-center aui:gap-2 aui:rounded-lg aui:px-2.5 aui:py-1.5 aui:text-sm aui:outline-none aui:select-none"
          onSelect={onRename}
        >
          <PencilIcon className="aui:size-4" />
          {ui('Rename')}
        </ThreadListItemMorePrimitive.Item>
        <ThreadListItemPrimitive.Archive asChild>
          <ThreadListItemMorePrimitive.Item
            data-slot="aui_thread-list-item-more-item"
            className="aui:hover:bg-accent aui:hover:text-accent-foreground aui:focus:bg-accent aui:focus:text-accent-foreground aui:flex aui:cursor-pointer aui:items-center aui:gap-2 aui:rounded-lg aui:px-2.5 aui:py-1.5 aui:text-sm aui:outline-none aui:select-none"
          >
            <ArchiveIcon className="aui:size-4" />
            {ui('Archive')}
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Archive>
        <ThreadListItemPrimitive.Delete asChild>
          <ThreadListItemMorePrimitive.Item
            data-slot="aui_thread-list-item-more-item"
            className="aui:text-destructive aui:hover:bg-destructive/10 aui:hover:text-destructive aui:focus:bg-destructive/10 aui:focus:text-destructive aui:flex aui:cursor-pointer aui:items-center aui:gap-2 aui:rounded-lg aui:px-2.5 aui:py-1.5 aui:text-sm aui:outline-none aui:select-none"
          >
            <TrashIcon className="aui:size-4" />
            {ui('Delete')}
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Delete>
      </ThreadListItemMorePrimitive.Content>
    </ThreadListItemMorePrimitive.Root>
  );
};
