"use client"

import * as React from "react"
import { usePathname, useParams } from "next/navigation"
import {
  Globe,
  CheckCircle2,
  LayoutDashboard,
  Hash,
  Receipt,
  ShoppingBag,
  Store,
  Briefcase,
  Settings,
  Users,
  Database,
  Coins
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useServer } from "@/context/server-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const pathname = usePathname()
  const params = useParams()
  const { serverInfo, serverId } = useServer()
  const [allServers, setAllServers] = React.useState<any[]>([])
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const isCollapsed = state === "collapsed"

  React.useEffect(() => {
    fetch("http://localhost:8000/api/servers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllServers(data)
      })
      .catch(err => console.error("Failed to fetch servers:", err))
  }, [])

  // Динамические ссылки на основе текущего serverId
  const navMain = [
    {
      title: "Обзор",
      url: `/server/${serverId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "Эмиссия",
      url: `/server/${serverId}/dashboard/emission`,
      icon: Coins,
    },
    {
      title: "Каналы",
      url: `/server/${serverId}/dashboard/channels`,
      icon: Hash,
    },
    {
      title: "Магазин",
      url: `/server/${serverId}/dashboard/shop`,
      icon: ShoppingBag,
    },
    {
      title: "Транзакции",
      url: `/server/${serverId}/dashboard/transactions`,
      icon: Receipt,
    },
    {
      title: "Рынок",
      url: `/server/${serverId}/dashboard/market`,
      icon: Store,
    },
    {
      title: "Биржа труда",
      url: `/server/${serverId}/dashboard/jobs`,
      icon: Briefcase,
    },
    {
      title: "Организации",
      url: `/server/${serverId}/dashboard/organizations`,
      icon: Users,
    },
  ]

  const settingsUrl = `/server/${serverId}/dashboard/settings`

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <SidebarMenuButton 
                  size="lg" 
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src={serverInfo?.icon_url || ""} alt={serverInfo?.name} />
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-black">
                      {serverInfo?.name?.[0] || "S"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight animate-in fade-in duration-200">
                        <span className="truncate font-black uppercase tracking-tight">{serverInfo?.name || "Загрузка..."}</span>
                        <span className="truncate text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Экономика сервера</span>
                      </div>
                      <ChevronDown className="ml-auto size-4 opacity-50" />
                    </>
                  )}
                </SidebarMenuButton>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-zinc-950 border-r-zinc-800 p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-6 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
                  <SheetTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Выберите сервер
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {allServers.map((server) => (
                    <div 
                      key={server.id}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border border-transparent",
                        String(server.id) === serverId 
                          ? "bg-primary/10 border-primary/20 text-primary" 
                          : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                      )}
                      onClick={() => {
                        setIsSheetOpen(false)
                        window.location.href = `/server/${server.id}/dashboard`
                      }}
                    >
                      <Avatar className="size-10 rounded-lg border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                        <AvatarImage src={server.icon_url || ""} />
                        <AvatarFallback className={cn(
                          "rounded-lg font-black text-xs transition-colors",
                          String(server.id) === serverId ? "bg-primary text-black" : "bg-zinc-800 group-hover:bg-zinc-700"
                        )}>
                          {server.name?.[0] || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-black uppercase tracking-tight truncate">
                          {server.name}
                        </span>
                        <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest truncate">
                          ID: {server.id}
                        </span>
                      </div>
                      {String(server.id) === serverId && (
                        <CheckCircle2 className="size-4 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-zinc-900 bg-zinc-950/50">
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer group"
                    onClick={() => {
                      setIsSheetOpen(false)
                      window.location.href = "/dashboard"
                    }}
                  >
                    <div className="size-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
                      <LayoutDashboard className="size-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Глобальный обзор</span>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Настройки" isActive={pathname === settingsUrl}>
              <a href={settingsUrl}>
                <Settings className="size-4" />
                <span className="font-bold uppercase text-[11px] tracking-wider">Настройки</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mx-2" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] px-4 opacity-50">Управление</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span className="font-bold uppercase text-[11px] tracking-wider">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] px-4 opacity-50">Система</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="База данных" isActive={pathname.startsWith("/dashboard/database")}>
                  <a href="/dashboard/database">
                    <Database className="size-4" />
                    <span className="font-bold uppercase text-[11px] tracking-wider">Проводник БД</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
