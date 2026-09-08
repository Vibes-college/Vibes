import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'aui:peer aui:size-4 aui:shrink-0 aui:rounded-[4px] aui:border aui:border-input aui:shadow-xs aui:transition-shadow aui:outline-none aui:focus-visible:border-ring aui:focus-visible:ring-[3px] aui:focus-visible:ring-ring/50 aui:disabled:cursor-not-allowed aui:disabled:opacity-50 aui:aria-invalid:border-destructive aui:aria-invalid:ring-destructive/20 aui:data-[state=checked]:border-primary aui:data-[state=checked]:bg-primary aui:data-[state=checked]:text-primary-foreground aui:dark:bg-input/30 aui:dark:aria-invalid:ring-destructive/40 aui:dark:data-[state=checked]:bg-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="aui:grid aui:place-content-center aui:text-current aui:transition-none"
      >
        <CheckIcon className="aui:size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
