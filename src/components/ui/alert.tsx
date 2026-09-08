import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'aui:relative aui:grid aui:w-full aui:grid-cols-[0_1fr] aui:items-start aui:gap-y-0.5 aui:rounded-lg aui:border aui:px-4 aui:py-3 aui:text-sm aui:has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] aui:has-[>svg]:gap-x-3 aui:[&>svg]:size-4 aui:[&>svg]:translate-y-0.5 aui:[&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'aui:bg-card aui:text-card-foreground',
        destructive:
          'aui:bg-card aui:text-destructive aui:*:data-[slot=alert-description]:text-destructive/90 aui:[&>svg]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'aui:col-start-2 aui:line-clamp-1 aui:min-h-4 aui:font-medium aui:tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'aui:col-start-2 aui:grid aui:justify-items-start aui:gap-1 aui:text-sm aui:text-muted-foreground aui:[&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
