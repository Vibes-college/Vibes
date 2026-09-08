import { ui } from '@/lib/assistant/ui-text';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { Button } from '@/components/ui/button';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'aui:fixed aui:inset-0 aui:z-50 aui:bg-black/50 aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=open]:animate-in aui:data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'assistant-ui-scope aui:fixed aui:top-[50%] aui:left-[50%] aui:z-50 aui:grid aui:w-full aui:max-w-[calc(100%-2rem)] aui:translate-x-[-50%] aui:translate-y-[-50%] aui:gap-4 aui:rounded-lg aui:border aui:bg-background aui:p-6 aui:shadow-lg aui:duration-200 aui:outline-none aui:data-[state=closed]:animate-out aui:data-[state=closed]:fade-out-0 aui:data-[state=closed]:zoom-out-95 aui:data-[state=open]:animate-in aui:data-[state=open]:fade-in-0 aui:data-[state=open]:zoom-in-95 aui:sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="aui:absolute aui:top-4 aui:right-4 aui:rounded-xs aui:opacity-70 aui:ring-offset-background aui:transition-opacity aui:hover:opacity-100 aui:focus:ring-2 aui:focus:ring-ring aui:focus:ring-offset-2 aui:focus:outline-hidden aui:disabled:pointer-events-none aui:data-[state=open]:bg-accent aui:data-[state=open]:text-muted-foreground aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4"
          >
            <XIcon />
            <span className="aui:sr-only">{ui('Close')}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('aui:flex aui:flex-col aui:gap-2 aui:text-center aui:sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'aui:flex aui:flex-col-reverse aui:gap-2 aui:sm:flex-row aui:sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">{ui('Close')}</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('aui:text-lg aui:leading-none aui:font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('aui:text-sm aui:text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
