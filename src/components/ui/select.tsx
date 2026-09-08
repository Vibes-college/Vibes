'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'aui:flex aui:w-fit aui:items-center aui:justify-between aui:gap-2 aui:rounded-md aui:border aui:border-input aui:bg-transparent aui:px-3 aui:py-2 aui:text-sm aui:whitespace-nowrap aui:shadow-xs aui:transition-[color,box-shadow] aui:outline-none aui:focus-visible:border-ring aui:focus-visible:ring-[3px] aui:focus-visible:ring-ring/50 aui:disabled:cursor-not-allowed aui:disabled:opacity-50 aui:aria-invalid:border-destructive aui:aria-invalid:ring-destructive/20 aui:data-[placeholder]:text-muted-foreground aui:data-[size=default]:h-9 aui:data-[size=sm]:h-8 aui:*:data-[slot=select-value]:line-clamp-1 aui:*:data-[slot=select-value]:flex aui:*:data-[slot=select-value]:items-center aui:*:data-[slot=select-value]:gap-2 aui:dark:bg-input/30 aui:dark:hover:bg-input/50 aui:dark:aria-invalid:ring-destructive/40 aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4 aui:[&_svg:not([class*=text-])]:text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="aui:size-4 aui:opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'item-aligned',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'assistant-ui-scope aui:relative aui:z-50 aui:max-h-(--radix-select-content-available-height) aui:min-w-[8rem] aui:origin-(--radix-select-content-transform-origin) aui:overflow-x-hidden aui:overflow-y-auto aui:rounded-md aui:border aui:bg-popover aui:text-popover-foreground aui:shadow-md aui:data-[side=bottom]:slide-in-from-top-2 aui:data-[side=left]:slide-in-from-right-2 aui:data-[side=right]:slide-in-from-left-2 aui:data-[side=top]:slide-in-from-bottom-2 aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95 aui:data-[state=open]:animate-in aui:data-[state=open]:fade-in-0 aui:data-[state=open]:zoom-in-95',
          position === 'popper' &&
            'aui:data-[side=bottom]:translate-y-1 aui:data-[side=left]:-translate-x-1 aui:data-[side=right]:translate-x-1 aui:data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'aui:p-1',
            position === 'popper' &&
              'aui:h-[var(--radix-select-trigger-height)] aui:w-full aui:min-w-[var(--radix-select-trigger-width)] aui:scroll-my-1',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('aui:px-2 aui:py-1.5 aui:text-xs aui:text-muted-foreground', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'aui:relative aui:flex aui:w-full aui:cursor-default aui:items-center aui:gap-2 aui:rounded-sm aui:py-1.5 aui:pr-8 aui:pl-2 aui:text-sm aui:outline-hidden aui:select-none aui:focus:bg-accent aui:focus:text-accent-foreground aui:data-[disabled]:pointer-events-none aui:data-[disabled]:opacity-50 aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4 aui:[&_svg:not([class*=text-])]:text-muted-foreground aui:*:[span]:last:flex aui:*:[span]:last:items-center aui:*:[span]:last:gap-2',
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="aui:absolute aui:right-2 aui:flex aui:size-3.5 aui:items-center aui:justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="aui:size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('aui:pointer-events-none aui:-mx-1 aui:my-1 aui:h-px aui:bg-border', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'aui:flex aui:cursor-default aui:items-center aui:justify-center aui:py-1',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="aui:size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'aui:flex aui:cursor-default aui:items-center aui:justify-center aui:py-1',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="aui:size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
