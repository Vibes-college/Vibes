import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import { SearchIcon } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'aui:flex aui:h-full aui:w-full aui:flex-col aui:overflow-hidden aui:rounded-md aui:bg-popover aui:text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="aui:sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn('aui:overflow-hidden aui:p-0', className)}
        showCloseButton={showCloseButton}
      >
        <Command className="aui:**:data-[slot=command-input-wrapper]:h-12 aui:[&_[cmdk-group-heading]]:px-2 aui:[&_[cmdk-group-heading]]:font-medium aui:[&_[cmdk-group-heading]]:text-muted-foreground aui:[&_[cmdk-group]]:px-2 aui:[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 aui:[&_[cmdk-input-wrapper]_svg]:h-5 aui:[&_[cmdk-input-wrapper]_svg]:w-5 aui:[&_[cmdk-input]]:h-12 aui:[&_[cmdk-item]]:px-2 aui:[&_[cmdk-item]]:py-3 aui:[&_[cmdk-item]_svg]:h-5 aui:[&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="aui:flex aui:h-9 aui:items-center aui:gap-2 aui:border-b aui:px-3"
    >
      <SearchIcon className="aui:size-4 aui:shrink-0 aui:opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'aui:flex aui:h-10 aui:w-full aui:rounded-md aui:bg-transparent aui:py-3 aui:text-sm aui:outline-hidden aui:placeholder:text-muted-foreground aui:disabled:cursor-not-allowed aui:disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'aui:max-h-[300px] aui:scroll-py-1 aui:overflow-x-hidden aui:overflow-y-auto',
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="aui:py-6 aui:text-center aui:text-sm"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'aui:overflow-hidden aui:p-1 aui:text-foreground aui:[&_[cmdk-group-heading]]:px-2 aui:[&_[cmdk-group-heading]]:py-1.5 aui:[&_[cmdk-group-heading]]:text-xs aui:[&_[cmdk-group-heading]]:font-medium aui:[&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('aui:-mx-1 aui:h-px aui:bg-border', className)}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'aui:relative aui:flex aui:cursor-default aui:items-center aui:gap-2 aui:rounded-sm aui:px-2 aui:py-1.5 aui:text-sm aui:outline-hidden aui:select-none aui:data-[disabled=true]:pointer-events-none aui:data-[disabled=true]:opacity-50 aui:data-[selected=true]:bg-accent aui:data-[selected=true]:text-accent-foreground aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4 aui:[&_svg:not([class*=text-])]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'aui:ml-auto aui:text-xs aui:tracking-widest aui:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
