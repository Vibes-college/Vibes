import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'assistant-ui-scope aui:z-50 aui:max-h-(--radix-dropdown-menu-content-available-height) aui:min-w-[8rem] aui:origin-(--radix-dropdown-menu-content-transform-origin) aui:overflow-x-hidden aui:overflow-y-auto aui:rounded-md aui:border aui:bg-popover aui:p-1 aui:text-popover-foreground aui:shadow-md aui:data-[side=bottom]:slide-in-from-top-2 aui:data-[side=left]:slide-in-from-right-2 aui:data-[side=right]:slide-in-from-left-2 aui:data-[side=top]:slide-in-from-bottom-2 aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95 aui:data-[state=open]:animate-in aui:data-[state=open]:fade-in-0 aui:data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        'aui:relative aui:flex aui:cursor-default aui:items-center aui:gap-2 aui:rounded-sm aui:px-2 aui:py-1.5 aui:text-sm aui:outline-hidden aui:select-none aui:focus:bg-accent aui:focus:text-accent-foreground aui:data-[disabled]:pointer-events-none aui:data-[disabled]:opacity-50 aui:data-[inset]:pl-8 aui:data-[variant=destructive]:text-destructive aui:data-[variant=destructive]:focus:bg-destructive/10 aui:data-[variant=destructive]:focus:text-destructive aui:dark:data-[variant=destructive]:focus:bg-destructive/20 aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4 aui:[&_svg:not([class*=text-])]:text-muted-foreground aui:data-[variant=destructive]:*:[svg]:text-destructive!',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        'aui:relative aui:flex aui:cursor-default aui:items-center aui:gap-2 aui:rounded-sm aui:py-1.5 aui:pr-2 aui:pl-8 aui:text-sm aui:outline-hidden aui:select-none aui:focus:bg-accent aui:focus:text-accent-foreground aui:data-[disabled]:pointer-events-none aui:data-[disabled]:opacity-50 aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4',
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="aui:pointer-events-none aui:absolute aui:left-2 aui:flex aui:size-3.5 aui:items-center aui:justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="aui:size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        'aui:relative aui:flex aui:cursor-default aui:items-center aui:gap-2 aui:rounded-sm aui:py-1.5 aui:pr-2 aui:pl-8 aui:text-sm aui:outline-hidden aui:select-none aui:focus:bg-accent aui:focus:text-accent-foreground aui:data-[disabled]:pointer-events-none aui:data-[disabled]:opacity-50 aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4',
        className,
      )}
      {...props}
    >
      <span className="aui:pointer-events-none aui:absolute aui:left-2 aui:flex aui:size-3.5 aui:items-center aui:justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="aui:size-2 aui:fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'aui:px-2 aui:py-1.5 aui:text-sm aui:font-medium aui:data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('aui:-mx-1 aui:my-1 aui:h-px aui:bg-border', className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'aui:ml-auto aui:text-xs aui:tracking-widest aui:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        'aui:flex aui:cursor-default aui:items-center aui:gap-2 aui:rounded-sm aui:px-2 aui:py-1.5 aui:text-sm aui:outline-hidden aui:select-none aui:focus:bg-accent aui:focus:text-accent-foreground aui:data-[inset]:pl-8 aui:data-[state=open]:bg-accent aui:data-[state=open]:text-accent-foreground aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4 aui:[&_svg:not([class*=text-])]:text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="aui:ml-auto aui:size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'aui:z-50 aui:min-w-[8rem] aui:origin-(--radix-dropdown-menu-content-transform-origin) aui:overflow-hidden aui:rounded-md aui:border aui:bg-popover aui:p-1 aui:text-popover-foreground aui:shadow-lg aui:data-[side=bottom]:slide-in-from-top-2 aui:data-[side=left]:slide-in-from-right-2 aui:data-[side=right]:slide-in-from-left-2 aui:data-[side=top]:slide-in-from-bottom-2 aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95 aui:data-[state=open]:animate-in aui:data-[state=open]:fade-in-0 aui:data-[state=open]:zoom-in-95',
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
