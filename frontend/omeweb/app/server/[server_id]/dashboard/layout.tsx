import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ServerProvider } from "@/context/server-context"

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: Promise<{ server_id: string }>
}) {
  const resolvedParams = await params;
  const server_id = resolvedParams.server_id;

  return (
    <ServerProvider serverId={server_id}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Панель управления</span>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ServerProvider>
  )
}
