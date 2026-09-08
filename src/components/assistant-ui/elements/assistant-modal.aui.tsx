'use client';
import { ui } from '@/lib/assistant/ui-text';

import { BotIcon, ChevronDownIcon } from 'lucide-react';

import { type FC, type ReactNode, forwardRef } from 'react';
import { AssistantModalPrimitive } from '@assistant-ui/react';

import { Thread } from '@/components/assistant-ui/elements/thread.aui';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';

export const AssistantModal: FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  fullscreen?: boolean;
  title: string;
}> = ({ open, onOpenChange, children, fullscreen, title }) => {
  return (
    <AssistantModalPrimitive.Root
      unstable_openOnRunStart={false}
      open={open}
      onOpenChange={onOpenChange}
    >
      <AssistantModalPrimitive.Anchor className="assistant-ui-scope aui-root aui-modal-anchor aui:fixed aui:end-4 aui:bottom-4 aui:size-11">
        <AssistantModalPrimitive.Trigger asChild>
          <AssistantModalButton />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        sideOffset={16}
        onKeyDownCapture={(event) => {
          // Nested dialogs and menus own their Escape; a tooltip must not swallow the panel close.
          if (
            event.key === 'Escape' &&
            (event.target as HTMLElement).closest('[role=dialog]') === event.currentTarget
          ) {
            event.preventDefault();
            event.stopPropagation();
            onOpenChange(false);
          }
        }}
        id="assistant-dialog"
        aria-label={title}
        style={
          fullscreen ? { width: 'calc(100vw - 2rem)', height: 'calc(100dvh - 6rem)' } : undefined
        }
        className="assistant-ui-scope aui-root aui-modal-content aui:bg-popover aui:text-popover-foreground aui:border-border/60 aui:dark:border-muted-foreground/15 aui:data-[state=open]:animate-in aui:data-[state=open]:fade-in-0 aui:data-[state=open]:zoom-in-95 aui:data-[state=open]:slide-in-from-bottom-2 aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95 aui:data-[state=closed]:slide-out-to-bottom-2 aui:[&[data-state=open]_.aui-thread-viewport-footer]:animate-in aui:[&[data-state=open]_.aui-thread-viewport-footer]:fade-in-0 aui:[&[data-state=open]_.aui-thread-viewport-footer]:slide-in-from-bottom-2 aui:[&[data-state=open]_.aui-thread-viewport-footer]:fill-mode-backwards aui:[&>.aui-thread-root_.aui-thread-viewport-footer]:bg-popover aui:z-50 aui:h-[min(740px,calc(100dvh-6rem))] aui:max-h-(--radix-popover-content-available-height) aui:w-190 aui:max-w-[calc(100vw-2rem)] aui:origin-(--radix-popover-content-transform-origin) aui:overflow-clip aui:overscroll-contain aui:rounded-2xl aui:border aui:p-0 aui:antialiased aui:ease-[cubic-bezier(0.32,0.72,0,1)] aui:outline-none aui:data-[state=closed]:duration-200 aui:data-[state=open]:duration-300 aui:motion-reduce:animate-none aui:motion-reduce:[&_.aui-thread-viewport-footer]:animate-none aui:[&_[data-slot=aui\_thread-viewport]]:[scrollbar-gutter:stable_both-edges] aui:[&>.aui-thread-root]:bg-inherit aui:[&[data-state=open]_.aui-thread-viewport-footer]:delay-100 aui:[&[data-state=open]_.aui-thread-viewport-footer]:duration-300 aui:[&[data-state=open]_.aui-thread-viewport-footer]:ease-[cubic-bezier(0.32,0.72,0,1)]"
      >
        {children ?? <Thread />}
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

type AssistantModalButtonProps = { 'data-state'?: 'open' | 'closed' };

const AssistantModalButton = forwardRef<HTMLButtonElement, AssistantModalButtonProps>(
  ({ 'data-state': state, ...rest }, ref) => {
    const tooltip = state === 'open' ? ui('Close Assistant') : ui('Open local assistant');

    return (
      <TooltipIconButton
        variant="default"
        tooltip={tooltip}
        aria-label={tooltip}
        side="left"
        {...rest}
        className="aui-modal-button aui:size-full aui:rounded-full aui:transition-transform aui:duration-150 aui:ease-out aui:hover:scale-105 aui:active:scale-96 aui:motion-reduce:transition-none"
        ref={ref}
      >
        <BotIcon
          data-state={state}
          className="aui-modal-button-closed-icon aui:absolute aui:size-6 aui:transition-[scale,opacity,filter] aui:duration-200 aui:ease-[cubic-bezier(0.2,0,0,1)] aui:data-[state=closed]:scale-100 aui:data-[state=closed]:opacity-100 aui:data-[state=closed]:blur-[0px] aui:data-[state=open]:scale-25 aui:data-[state=open]:opacity-0 aui:data-[state=open]:blur-[4px] aui:motion-reduce:transition-none"
        />

        <ChevronDownIcon
          data-state={state}
          className="aui-modal-button-open-icon aui:absolute aui:size-6 aui:transition-[scale,opacity,filter] aui:duration-200 aui:ease-[cubic-bezier(0.2,0,0,1)] aui:data-[state=closed]:scale-25 aui:data-[state=closed]:opacity-0 aui:data-[state=closed]:blur-[4px] aui:data-[state=open]:scale-100 aui:data-[state=open]:opacity-100 aui:data-[state=open]:blur-[0px] aui:motion-reduce:transition-none"
        />
        <span className="aui-sr-only aui:sr-only">{tooltip}</span>
      </TooltipIconButton>
    );
  },
);

AssistantModalButton.displayName = 'AssistantModalButton';
