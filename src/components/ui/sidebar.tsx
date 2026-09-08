import { ui } from '@/lib/assistant/ui-text';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { PanelLeftIcon } from 'lucide-react';
import { Slot } from 'radix-ui';

import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This embedded sidebar is intentionally scoped to the open assistant.
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            'aui:group/sidebar-wrapper aui:flex aui:min-h-svh aui:w-full aui:has-data-[variant=inset]:bg-sidebar',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'aui:flex aui:h-full aui:w-(--sidebar-width) aui:flex-col aui:bg-sidebar aui:text-sidebar-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="aui:w-(--sidebar-width) aui:bg-sidebar aui:p-0 aui:text-sidebar-foreground aui:[&>button]:hidden"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="aui:sr-only">
            <SheetTitle>{ui('Sidebar')}</SheetTitle>
            <SheetDescription>{ui('Displays the mobile sidebar.')}</SheetDescription>
          </SheetHeader>
          <div className="aui:flex aui:h-full aui:w-full aui:flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="aui:group aui:peer aui:hidden aui:text-sidebar-foreground aui:md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          'aui:relative aui:w-(--sidebar-width) aui:bg-transparent aui:transition-[width] aui:duration-200 aui:ease-linear',
          'aui:group-data-[collapsible=offcanvas]:w-0',
          'aui:group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'aui:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'aui:group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot="sidebar-container"
        inert={state === 'collapsed' ? true : undefined}
        aria-hidden={state === 'collapsed'}
        className={cn(
          'aui:fixed aui:inset-y-0 aui:z-10 aui:hidden aui:h-svh aui:w-(--sidebar-width) aui:transition-[left,right,width] aui:duration-200 aui:ease-linear aui:md:flex',
          side === 'left'
            ? 'aui:left-0 aui:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'aui:right-0 aui:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          // Adjust the padding for floating and inset variants.
          variant === 'floating' || variant === 'inset'
            ? 'aui:p-2 aui:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'aui:group-data-[collapsible=icon]:w-(--sidebar-width-icon) aui:group-data-[side=left]:border-r aui:group-data-[side=right]:border-l',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="aui:flex aui:h-full aui:w-full aui:flex-col aui:bg-sidebar aui:group-data-[variant=floating]:rounded-lg aui:group-data-[variant=floating]:border aui:group-data-[variant=floating]:border-sidebar-border aui:group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('aui:size-7', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="aui:sr-only">{ui('Toggle Sidebar')}</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label={ui('Toggle Sidebar')}
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'aui:absolute aui:inset-y-0 aui:z-20 aui:hidden aui:w-4 aui:-translate-x-1/2 aui:transition-all aui:ease-linear aui:group-data-[side=left]:-right-4 aui:group-data-[side=right]:left-0 aui:after:absolute aui:after:inset-y-0 aui:after:left-1/2 aui:after:w-[2px] aui:hover:after:bg-sidebar-border aui:sm:flex',
        'aui:in-data-[side=left]:cursor-w-resize aui:in-data-[side=right]:cursor-e-resize',
        'aui:[[data-side=left][data-state=collapsed]_&]:cursor-e-resize aui:[[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'aui:group-data-[collapsible=offcanvas]:translate-x-0 aui:group-data-[collapsible=offcanvas]:after:left-full aui:hover:group-data-[collapsible=offcanvas]:bg-sidebar',
        'aui:[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        'aui:[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'aui:relative aui:flex aui:w-full aui:flex-1 aui:flex-col aui:bg-background',
        'aui:md:peer-data-[variant=inset]:m-2 aui:md:peer-data-[variant=inset]:ml-0 aui:md:peer-data-[variant=inset]:rounded-xl aui:md:peer-data-[variant=inset]:shadow-sm aui:md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn('aui:h-8 aui:w-full aui:bg-background aui:shadow-none', className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('aui:flex aui:flex-col aui:gap-2 aui:p-2', className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('aui:flex aui:flex-col aui:gap-2 aui:p-2', className)}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('aui:mx-2 aui:w-auto aui:bg-sidebar-border', className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'aui:flex aui:min-h-0 aui:flex-1 aui:flex-col aui:gap-2 aui:overflow-auto aui:group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('aui:relative aui:flex aui:w-full aui:min-w-0 aui:flex-col aui:p-2', className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'aui:flex aui:h-8 aui:shrink-0 aui:items-center aui:rounded-md aui:px-2 aui:text-xs aui:font-medium aui:text-sidebar-foreground/70 aui:ring-sidebar-ring aui:outline-hidden aui:transition-[margin,opacity] aui:duration-200 aui:ease-linear aui:focus-visible:ring-2 aui:[&>svg]:size-4 aui:[&>svg]:shrink-0',
        'aui:group-data-[collapsible=icon]:-mt-8 aui:group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        'aui:absolute aui:top-3.5 aui:right-3 aui:flex aui:aspect-square aui:w-5 aui:items-center aui:justify-center aui:rounded-md aui:p-0 aui:text-sidebar-foreground aui:ring-sidebar-ring aui:outline-hidden aui:transition-transform aui:hover:bg-sidebar-accent aui:hover:text-sidebar-accent-foreground aui:focus-visible:ring-2 aui:[&>svg]:size-4 aui:[&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'aui:after:absolute aui:after:-inset-2 aui:md:after:hidden',
        'aui:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('aui:w-full aui:text-sm', className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('aui:flex aui:w-full aui:min-w-0 aui:flex-col aui:gap-1', className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('aui:group/menu-item aui:relative', className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  'aui:peer/menu-button aui:flex aui:w-full aui:items-center aui:gap-2 aui:overflow-hidden aui:rounded-md aui:p-2 aui:text-left aui:text-sm aui:ring-sidebar-ring aui:outline-hidden aui:transition-[width,height,padding] aui:group-has-data-[sidebar=menu-action]/menu-item:pr-8 aui:group-data-[collapsible=icon]:size-8! aui:group-data-[collapsible=icon]:p-2! aui:hover:bg-sidebar-accent aui:hover:text-sidebar-accent-foreground aui:focus-visible:ring-2 aui:active:bg-sidebar-accent aui:active:text-sidebar-accent-foreground aui:disabled:pointer-events-none aui:disabled:opacity-50 aui:aria-disabled:pointer-events-none aui:aria-disabled:opacity-50 aui:data-[active=true]:bg-sidebar-accent aui:data-[active=true]:font-medium aui:data-[active=true]:text-sidebar-accent-foreground aui:data-[state=open]:hover:bg-sidebar-accent aui:data-[state=open]:hover:text-sidebar-accent-foreground aui:[&>span:last-child]:truncate aui:[&>svg]:size-4 aui:[&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'aui:hover:bg-sidebar-accent aui:hover:text-sidebar-accent-foreground',
        outline:
          'aui:bg-background aui:shadow-[0_0_0_1px_var(--sidebar-border)] aui:hover:bg-sidebar-accent aui:hover:text-sidebar-accent-foreground aui:hover:shadow-[0_0_0_1px_var(--sidebar-accent)]',
      },
      size: {
        default: 'aui:h-8 aui:text-sm',
        sm: 'aui:h-7 aui:text-xs',
        lg: 'aui:h-12 aui:text-sm aui:group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot.Root : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === 'string') {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== 'collapsed' || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        'aui:absolute aui:top-1.5 aui:right-1 aui:flex aui:aspect-square aui:w-5 aui:items-center aui:justify-center aui:rounded-md aui:p-0 aui:text-sidebar-foreground aui:ring-sidebar-ring aui:outline-hidden aui:transition-transform aui:peer-hover/menu-button:text-sidebar-accent-foreground aui:hover:bg-sidebar-accent aui:hover:text-sidebar-accent-foreground aui:focus-visible:ring-2 aui:[&>svg]:size-4 aui:[&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'aui:after:absolute aui:after:-inset-2 aui:md:after:hidden',
        'aui:peer-data-[size=sm]/menu-button:top-1',
        'aui:peer-data-[size=default]/menu-button:top-1.5',
        'aui:peer-data-[size=lg]/menu-button:top-2.5',
        'aui:group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'aui:group-focus-within/menu-item:opacity-100 aui:group-hover/menu-item:opacity-100 aui:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground aui:data-[state=open]:opacity-100 aui:md:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'aui:pointer-events-none aui:absolute aui:right-1 aui:flex aui:h-5 aui:min-w-5 aui:items-center aui:justify-center aui:rounded-md aui:px-1 aui:text-xs aui:font-medium aui:text-sidebar-foreground aui:tabular-nums aui:select-none',
        'aui:peer-hover/menu-button:text-sidebar-accent-foreground aui:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
        'aui:peer-data-[size=sm]/menu-button:top-1',
        'aui:peer-data-[size=default]/menu-button:top-1.5',
        'aui:peer-data-[size=lg]/menu-button:top-2.5',
        'aui:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn(
        'aui:flex aui:h-8 aui:items-center aui:gap-2 aui:rounded-md aui:px-2',
        className,
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton className="aui:size-4 aui:rounded-md" data-sidebar="menu-skeleton-icon" />
      )}
      <Skeleton
        className="aui:h-4 aui:max-w-(--skeleton-width) aui:flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            '--skeleton-width': width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'aui:mx-3.5 aui:flex aui:min-w-0 aui:translate-x-px aui:flex-col aui:gap-1 aui:border-l aui:border-sidebar-border aui:px-2.5 aui:py-0.5',
        'aui:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('aui:group/menu-sub-item aui:relative', className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        'aui:flex aui:h-7 aui:min-w-0 aui:-translate-x-px aui:items-center aui:gap-2 aui:overflow-hidden aui:rounded-md aui:px-2 aui:text-sidebar-foreground aui:ring-sidebar-ring aui:outline-hidden aui:hover:bg-sidebar-accent aui:hover:text-sidebar-accent-foreground aui:focus-visible:ring-2 aui:active:bg-sidebar-accent aui:active:text-sidebar-accent-foreground aui:disabled:pointer-events-none aui:disabled:opacity-50 aui:aria-disabled:pointer-events-none aui:aria-disabled:opacity-50 aui:[&>span:last-child]:truncate aui:[&>svg]:size-4 aui:[&>svg]:shrink-0 aui:[&>svg]:text-sidebar-accent-foreground',
        'aui:data-[active=true]:bg-sidebar-accent aui:data-[active=true]:text-sidebar-accent-foreground',
        size === 'sm' && 'aui:text-xs',
        size === 'md' && 'aui:text-sm',
        'aui:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
