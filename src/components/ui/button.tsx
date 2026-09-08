import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from 'radix-ui';

const buttonVariants = cva(
  'aui:inline-flex aui:shrink-0 aui:items-center aui:justify-center aui:gap-2 aui:rounded-md aui:text-sm aui:font-medium aui:whitespace-nowrap aui:transition-all aui:outline-none aui:focus-visible:border-ring aui:focus-visible:ring-[3px] aui:focus-visible:ring-ring/50 aui:disabled:pointer-events-none aui:disabled:opacity-50 aui:aria-invalid:border-destructive aui:aria-invalid:ring-destructive/20 aui:dark:aria-invalid:ring-destructive/40 aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-4',
  {
    variants: {
      variant: {
        default: 'aui:bg-primary aui:text-primary-foreground aui:hover:bg-primary/90',
        destructive:
          'aui:bg-destructive aui:text-white aui:hover:bg-destructive/90 aui:focus-visible:ring-destructive/20 aui:dark:bg-destructive/60 aui:dark:focus-visible:ring-destructive/40',
        outline:
          'aui:border aui:bg-background aui:shadow-xs aui:hover:bg-accent aui:hover:text-accent-foreground aui:dark:border-input aui:dark:bg-input/30 aui:dark:hover:bg-input/50',
        secondary: 'aui:bg-secondary aui:text-secondary-foreground aui:hover:bg-secondary/80',
        ghost: 'aui:hover:bg-accent aui:hover:text-accent-foreground aui:dark:hover:bg-accent/50',
        link: 'aui:text-primary aui:underline-offset-4 aui:hover:underline',
      },
      size: {
        default: 'aui:h-9 aui:px-4 aui:py-2 aui:has-[>svg]:px-3',
        xs: 'aui:h-6 aui:gap-1 aui:rounded-md aui:px-2 aui:text-xs aui:has-[>svg]:px-1.5 aui:[&_svg:not([class*=size-])]:size-3',
        sm: 'aui:h-8 aui:gap-1.5 aui:rounded-md aui:px-3 aui:has-[>svg]:px-2.5',
        lg: 'aui:h-10 aui:rounded-md aui:px-6 aui:has-[>svg]:px-4',
        icon: 'aui:size-9',
        'icon-xs': 'aui:size-6 aui:rounded-md aui:[&_svg:not([class*=size-])]:size-3',
        'icon-sm': 'aui:size-8',
        'icon-lg': 'aui:size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
