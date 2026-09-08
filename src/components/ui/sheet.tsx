import { ui } from '@/lib/assistant/ui-text';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'aui:fixed aui:inset-0 aui:z-50 aui:bg-black/50 aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=open]:animate-in aui:data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'assistant-ui-scope aui:fixed aui:z-50 aui:flex aui:flex-col aui:gap-4 aui:bg-background aui:shadow-lg aui:transition aui:ease-in-out aui:data-[state=closed]:animate-out aui:data-[state=closed]:duration-300 aui:data-[state=open]:animate-in aui:data-[state=open]:duration-500',
          side === 'right' &&
            'aui:inset-y-0 aui:right-0 aui:h-full aui:w-3/4 aui:border-l aui:data-[state=closed]:slide-out-to-right aui:data-[state=open]:slide-in-from-right aui:sm:max-w-sm',
          side === 'left' &&
            'aui:inset-y-0 aui:left-0 aui:h-full aui:w-3/4 aui:border-r aui:data-[state=closed]:slide-out-to-left aui:data-[state=open]:slide-in-from-left aui:sm:max-w-sm',
          side === 'top' &&
            'aui:inset-x-0 aui:top-0 aui:h-auto aui:border-b aui:data-[state=closed]:slide-out-to-top aui:data-[state=open]:slide-in-from-top',
          side === 'bottom' &&
            'aui:inset-x-0 aui:bottom-0 aui:h-auto aui:border-t aui:data-[state=closed]:slide-out-to-bottom aui:data-[state=open]:slide-in-from-bottom',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="aui:absolute aui:top-4 aui:right-4 aui:rounded-xs aui:opacity-70 aui:ring-offset-background aui:transition-opacity aui:hover:opacity-100 aui:focus:ring-2 aui:focus:ring-ring aui:focus:ring-offset-2 aui:focus:outline-hidden aui:disabled:pointer-events-none aui:data-[state=open]:bg-secondary">
            <XIcon className="aui:size-4" />
            <span className="aui:sr-only">{ui('Close')}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('aui:flex aui:flex-col aui:gap-1.5 aui:p-4', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('aui:mt-auto aui:flex aui:flex-col aui:gap-2 aui:p-4', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('aui:font-semibold aui:text-foreground', className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('aui:text-sm aui:text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
