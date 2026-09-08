import type * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'aui:focus-visible:border-ring aui:focus-visible:ring-ring/50 aui:aria-invalid:border-destructive aui:aria-invalid:ring-destructive/20 aui:dark:aria-invalid:ring-destructive/40 aui:inline-flex aui:w-fit aui:shrink-0 aui:items-center aui:justify-center aui:gap-1 aui:overflow-hidden aui:rounded-full aui:border aui:border-transparent aui:px-2 aui:py-0.5 aui:text-xs aui:font-medium aui:whitespace-nowrap aui:transition-colors aui:focus-visible:ring-1 aui:[&>svg]:pointer-events-none aui:[&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'aui:bg-primary aui:text-primary-foreground aui:[a&]:hover:bg-primary/90',
        secondary: 'aui:bg-secondary aui:text-secondary-foreground aui:[a&]:hover:bg-secondary/90',
        destructive:
          'aui:bg-destructive aui:focus-visible:ring-destructive/20 aui:dark:bg-destructive/60 aui:dark:focus-visible:ring-destructive/40 aui:[a&]:hover:bg-destructive/90 aui:text-white',
        outline:
          'aui:border-border aui:text-foreground aui:[a&]:hover:bg-accent aui:[a&]:hover:text-accent-foreground',
        ghost: 'aui:[a&]:hover:bg-accent aui:[a&]:hover:text-accent-foreground',
        link: 'aui:text-primary aui:underline-offset-4 aui:[a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
