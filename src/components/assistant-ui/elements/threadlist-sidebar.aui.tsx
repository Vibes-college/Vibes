import { ui } from '@/lib/assistant/ui-text';
import type * as React from 'react';
import { MessagesSquare } from 'lucide-react';
import { GitHubIcon } from '@/components/icons/github';
import {
  Sidebar,
  useSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ThreadList } from '@/components/assistant-ui/elements/thread-list.aui';

export function ThreadListSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header aui:mb-2 aui:border-b">
        <div className="aui-sidebar-header-content aui:flex aui:items-center aui:justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="https://paseo.sh" target="_blank" rel="noopener noreferrer">
                  <div className="aui-sidebar-header-icon-wrapper aui:bg-sidebar-primary aui:text-sidebar-primary-foreground aui:flex aui:aspect-square aui:size-8 aui:items-center aui:justify-center aui:rounded-lg">
                    <MessagesSquare className="aui-sidebar-header-icon aui:size-4" />
                  </div>
                  <div className="aui-sidebar-header-heading aui:me-6 aui:flex aui:flex-col aui:gap-0.5 aui:leading-none">
                    <span className="aui-sidebar-header-title aui:font-semibold">Paseo</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent
        onClick={(event) => {
          if (
            (event.target as HTMLElement).closest(
              '[data-slot=aui_thread-list-item-trigger], [data-slot=aui_thread-list-new]',
            )
          )
            setOpenMobile(false);
        }}
        className="aui-sidebar-content aui:px-2"
      >
        <ThreadList />
      </SidebarContent>
      {props.collapsible !== 'none' && <SidebarRail />}
      <SidebarFooter className="aui-sidebar-footer aui:border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="https://github.com/getpaseo/paseo" target="_blank" rel="noopener noreferrer">
                <div className="aui-sidebar-footer-icon-wrapper aui:bg-sidebar-primary aui:text-sidebar-primary-foreground aui:flex aui:aspect-square aui:size-8 aui:items-center aui:justify-center aui:rounded-lg">
                  <GitHubIcon className="aui-sidebar-footer-icon aui:size-4" />
                </div>
                <div className="aui-sidebar-footer-heading aui:flex aui:flex-col aui:gap-0.5 aui:leading-none">
                  <span className="aui-sidebar-footer-title aui:font-semibold">GitHub</span>
                  <span>{ui('View Source')}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
