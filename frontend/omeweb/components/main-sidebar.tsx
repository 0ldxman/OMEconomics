"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Server,
  Users,
  Database,
  Settings,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function MainSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navMain = [
    {
      title: "Обзор",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Серверы",
      url: "/dashboard/servers",
      icon: Server,
    },
    {
      title: "Пользователи",
      url: "/dashboard/users",
      icon: Users,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
              <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-zinc-800">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback className="rounded-lg bg-zinc-900 text-zinc-400 font-black">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight animate-in fade-in duration-200">
                <span className="truncate font-black uppercase tracking-tight text-zinc-100">Administrator</span>
                <span className="truncate text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-primary">System Root</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] px-4 opacity-50">Администрирование</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title} 
                    isActive={pathname === item.url}
                    className={cn(
                      "transition-all duration-200",
                      pathname === item.url ? "bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]" : "text-zinc-400 hover:text-zinc-100"
                    )}
                  >
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
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] px-4 opacity-50">Инструменты</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Проводник БД" 
                  isActive={pathname.startsWith("/dashboard/database")}
                  className={cn(
                    "transition-all duration-200",
                    pathname.startsWith("/dashboard/database") ? "bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]" : "text-zinc-400 hover:text-zinc-100"
                  )}
                >
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

      <SidebarFooter className="p-4 border-t border-zinc-900">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-zinc-500 hover:text-rose-500 transition-colors">
              <LogOut className="size-4" />
              <span className="font-bold uppercase text-[10px] tracking-widest">Выйти</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
