import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar as AvatarPrimitive } from 'radix-ui';

function Avatar({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'aui:group/avatar aui:relative aui:flex aui:size-8 aui:shrink-0 aui:overflow-hidden aui:rounded-full aui:select-none aui:data-[size=lg]:size-10 aui:data-[size=sm]:size-6',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aui:aspect-square aui:size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'aui:flex aui:size-full aui:items-center aui:justify-center aui:rounded-full aui:bg-muted aui:text-sm aui:text-muted-foreground aui:group-data-[size=sm]/avatar:text-xs',
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'aui:absolute aui:right-0 aui:bottom-0 aui:z-10 aui:inline-flex aui:items-center aui:justify-center aui:rounded-full aui:bg-primary aui:text-primary-foreground aui:ring-2 aui:ring-background aui:select-none',
        'aui:group-data-[size=sm]/avatar:size-2 aui:group-data-[size=sm]/avatar:[&>svg]:hidden',
        'aui:group-data-[size=default]/avatar:size-2.5 aui:group-data-[size=default]/avatar:[&>svg]:size-2',
        'aui:group-data-[size=lg]/avatar:size-3 aui:group-data-[size=lg]/avatar:[&>svg]:size-2',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'aui:group/avatar-group aui:flex aui:-space-x-2 aui:*:data-[slot=avatar]:ring-2 aui:*:data-[slot=avatar]:ring-background',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'aui:relative aui:flex aui:size-8 aui:shrink-0 aui:items-center aui:justify-center aui:rounded-full aui:bg-muted aui:text-sm aui:text-muted-foreground aui:ring-2 aui:ring-background aui:group-has-data-[size=lg]/avatar-group:size-10 aui:group-has-data-[size=sm]/avatar-group:size-6 aui:[&>svg]:size-4 aui:group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 aui:group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount };
