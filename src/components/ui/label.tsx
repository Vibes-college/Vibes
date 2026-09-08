'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label as LabelPrimitive } from 'radix-ui';

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'aui:flex aui:items-center aui:gap-2 aui:text-sm aui:leading-none aui:font-medium aui:select-none aui:group-data-[disabled=true]:pointer-events-none aui:group-data-[disabled=true]:opacity-50 aui:peer-disabled:cursor-not-allowed aui:peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
