import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'aui:h-9 aui:w-full aui:min-w-0 aui:rounded-md aui:border aui:border-input aui:bg-transparent aui:px-3 aui:py-1 aui:text-base aui:shadow-xs aui:transition-[color,box-shadow] aui:outline-none aui:selection:bg-primary aui:selection:text-primary-foreground aui:file:inline-flex aui:file:h-7 aui:file:border-0 aui:file:bg-transparent aui:file:text-sm aui:file:font-medium aui:file:text-foreground aui:placeholder:text-muted-foreground aui:disabled:pointer-events-none aui:disabled:cursor-not-allowed aui:disabled:opacity-50 aui:md:text-sm aui:dark:bg-input/30',
        'aui:focus-visible:border-ring aui:focus-visible:ring-[3px] aui:focus-visible:ring-ring/50',
        'aui:aria-invalid:border-destructive aui:aria-invalid:ring-destructive/20 aui:dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
