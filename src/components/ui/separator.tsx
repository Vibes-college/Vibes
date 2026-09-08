'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Separator as SeparatorPrimitive } from 'radix-ui';

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'aui:shrink-0 aui:bg-border aui:data-[orientation=horizontal]:h-px aui:data-[orientation=horizontal]:w-full aui:data-[orientation=vertical]:h-full aui:data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
