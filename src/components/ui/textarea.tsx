import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'aui:flex aui:field-sizing-content aui:min-h-16 aui:w-full aui:rounded-md aui:border aui:border-input aui:bg-transparent aui:px-3 aui:py-2 aui:text-base aui:shadow-xs aui:transition-[color,box-shadow] aui:outline-none aui:placeholder:text-muted-foreground aui:focus-visible:border-ring aui:focus-visible:ring-[3px] aui:focus-visible:ring-ring/50 aui:disabled:cursor-not-allowed aui:disabled:opacity-50 aui:aria-invalid:border-destructive aui:aria-invalid:ring-destructive/20 aui:md:text-sm aui:dark:bg-input/30 aui:dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
