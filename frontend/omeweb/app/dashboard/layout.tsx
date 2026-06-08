import { MainSidebar } from "@/components/main-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10 px-4">
          <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-primary transition-colors" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-800" />
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Системное управление</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
