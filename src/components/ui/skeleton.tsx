import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('aui:animate-pulse aui:rounded-md aui:bg-accent', className)}
      {...props}
    />
  );
}

export { Skeleton };
