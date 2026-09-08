'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'assistant-ui-scope aui:z-50 aui:w-fit aui:origin-(--radix-tooltip-content-transform-origin) aui:animate-in aui:rounded-md aui:bg-foreground aui:px-3 aui:py-1.5 aui:text-xs aui:text-balance aui:text-background aui:fade-in-0 aui:zoom-in-95 aui:data-[side=bottom]:slide-in-from-top-2 aui:data-[side=left]:slide-in-from-right-2 aui:data-[side=right]:slide-in-from-left-2 aui:data-[side=top]:slide-in-from-bottom-2 aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="aui:z-50 aui:size-2.5 aui:translate-y-[calc(-50%_-_2px)] aui:rotate-45 aui:rounded-[2px] aui:bg-foreground aui:fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
