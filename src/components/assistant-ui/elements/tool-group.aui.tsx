'use client';

import { memo, useCallback, useRef, useState, type FC, type PropsWithChildren } from 'react';
import { ChevronDownIcon, LoaderIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { useScrollLock } from '@assistant-ui/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const ANIMATION_DURATION = 200;

const toolGroupVariants = cva('aui-tool-group-root aui:group/tool-group aui:w-full', {
  variants: {
    variant: {
      outline: 'aui:rounded-lg aui:border aui:py-3',
      ghost: 'aui:',
      muted: 'aui:border-muted-foreground/30 aui:bg-muted/30 aui:rounded-lg aui:border aui:py-3',
    },
  },
  defaultVariants: { variant: 'outline' },
});

export type ToolGroupRootProps = Omit<
  React.ComponentProps<typeof Collapsible>,
  'open' | 'onOpenChange'
> &
  VariantProps<typeof toolGroupVariants> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  };

function ToolGroupRoot({
  className,
  variant,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
  children,
  ...props
}: ToolGroupRootProps) {
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      lockScroll();
      if (!isControlled) {
        setUncontrolledOpen(open);
      }
      controlledOnOpenChange?.(open);
    },
    [lockScroll, isControlled, controlledOnOpenChange],
  );

  return (
    <Collapsible
      ref={collapsibleRef}
      data-slot="tool-group-root"
      data-variant={variant ?? 'outline'}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn(toolGroupVariants({ variant }), 'aui:group/tool-group-root', className)}
      style={
        {
          '--animation-duration': `${ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </Collapsible>
  );
}

function ToolGroupTrigger({
  count,
  active = false,
  className,
  ...props
}: React.ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
  active?: boolean;
}) {
  const label = document.documentElement.lang.startsWith('zh')
    ? `${count} 次工具调用`
    : `${count} tool ${count === 1 ? 'call' : 'calls'}`;

  return (
    <CollapsibleTrigger
      data-slot="tool-group-trigger"
      className={cn(
        'aui-tool-group-trigger aui:group/trigger aui:flex aui:origin-left aui:items-center aui:gap-2 aui:text-sm aui:transition-[color,scale] aui:active:scale-[0.98]',
        'aui:group-data-[variant=ghost]/tool-group-root:text-muted-foreground aui:group-data-[variant=ghost]/tool-group-root:hover:text-foreground aui:group-data-[variant=ghost]/tool-group-root:py-1.5',
        'aui:group-data-[variant=outline]/tool-group-root:w-full aui:group-data-[variant=outline]/tool-group-root:px-4',
        'aui:group-data-[variant=muted]/tool-group-root:w-full aui:group-data-[variant=muted]/tool-group-root:px-4',
        className,
      )}
      {...props}
    >
      {active && (
        <LoaderIcon
          data-slot="tool-group-trigger-loader"
          className="aui-tool-group-trigger-loader aui:size-3 aui:shrink-0 aui:animate-spin aui:[animation-duration:0.6s]"
        />
      )}
      <span
        data-slot="tool-group-trigger-label"
        className={cn(
          'aui-tool-group-trigger-label-wrapper aui:inline-block aui:text-start aui:text-xs aui:leading-none aui:font-medium',
          'aui:group-data-[variant=ghost]/tool-group-root:font-normal',
          'aui:group-data-[variant=outline]/tool-group-root:grow',
          'aui:group-data-[variant=muted]/tool-group-root:grow',
          active && 'aui:shimmer aui:motion-reduce:animate-none',
        )}
      >
        {label}
      </span>
      <ChevronDownIcon
        data-slot="tool-group-trigger-chevron"
        className={cn(
          'aui-tool-group-trigger-chevron aui:size-3 aui:shrink-0',
          'aui:transition-transform aui:duration-(--animation-duration) aui:ease-[cubic-bezier(0.32,0.72,0,1)] aui:motion-reduce:transition-none',
          'aui:-rotate-90',
          'aui:group-data-open/trigger:rotate-0',
          'aui:group-data-panel-open/trigger:rotate-0',
        )}
      />
    </CollapsibleTrigger>
  );
}

function ToolGroupContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      data-slot="tool-group-content"
      className={cn(
        'aui-tool-group-content aui:relative aui:overflow-hidden aui:text-sm aui:outline-none',
        'aui:group/collapsible-content aui:ease-[cubic-bezier(0.32,0.72,0,1)] aui:motion-reduce:animate-none',
        'aui:data-closed:animate-collapsible-up',
        'aui:data-open:animate-collapsible-down',
        'aui:data-closed:fill-mode-forwards',
        'aui:data-closed:pointer-events-none',
        'aui:[--tw-duration:var(--animation-duration)]',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'aui:mt-2 aui:flex aui:flex-col aui:gap-2',
          'aui:group-data-[variant=ghost]/tool-group-root:mt-1 aui:group-data-[variant=ghost]/tool-group-root:gap-1',
          'aui:group-data-[variant=outline]/tool-group-root:mt-3 aui:group-data-[variant=outline]/tool-group-root:border-t aui:group-data-[variant=outline]/tool-group-root:px-4 aui:group-data-[variant=outline]/tool-group-root:pt-3',
          'aui:group-data-[variant=muted]/tool-group-root:mt-3 aui:group-data-[variant=muted]/tool-group-root:border-t aui:group-data-[variant=muted]/tool-group-root:px-4 aui:group-data-[variant=muted]/tool-group-root:pt-3',
          'aui:[&>*]:animate-in aui:[&>*]:fade-in-0 aui:[&>*]:blur-in-[2px] aui:[&>*]:slide-in-from-top-1 aui:[&>*]:animation-duration-(--animation-duration) aui:[&>*]:ease-[cubic-bezier(0.32,0.72,0,1)]',
          'aui:[&>*]:motion-reduce:animate-none',
          'aui:[&>*:nth-child(2)]:[animation-delay:40ms]',
          'aui:[&>*:nth-child(3)]:[animation-delay:80ms]',
          'aui:[&>*:nth-child(4)]:[animation-delay:120ms]',
          'aui:[&>*:nth-child(n+5)]:[animation-delay:160ms]',
        )}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

type ToolGroupComponent = FC<PropsWithChildren<{ startIndex: number; endIndex: number }>> & {
  Root: typeof ToolGroupRoot;
  Trigger: typeof ToolGroupTrigger;
  Content: typeof ToolGroupContent;
};

const ToolGroupImpl: FC<PropsWithChildren<{ startIndex: number; endIndex: number }>> = ({
  children,
  startIndex,
  endIndex,
}) => {
  const toolCount = endIndex - startIndex + 1;

  return (
    <ToolGroupRoot>
      <ToolGroupTrigger count={toolCount} />
      <ToolGroupContent>{children}</ToolGroupContent>
    </ToolGroupRoot>
  );
};

/**
 * @deprecated This wrapper targets the legacy `components.ToolGroup` prop
 * on `<MessagePrimitive.Parts>`. Use `<MessagePrimitive.GroupedParts>` with
 * a `groupBy` returning `"group-tool"` and compose `ToolGroupRoot` /
 * `ToolGroupTrigger` / `ToolGroupContent` directly. See `thread.tsx`.
 */
const ToolGroup = memo(ToolGroupImpl) as unknown as ToolGroupComponent;

ToolGroup.displayName = 'ToolGroup';
ToolGroup.Root = ToolGroupRoot;
ToolGroup.Trigger = ToolGroupTrigger;
ToolGroup.Content = ToolGroupContent;

export { ToolGroup, ToolGroupRoot, ToolGroupTrigger, ToolGroupContent, toolGroupVariants };
