"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Server as ServerIcon, 
  Search, 
  Users, 
  ExternalLink,
  LayoutGrid,
  List as ListIcon,
  Wallet,
  Coins,
  History
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ServerInfo {
  id: string
  name: string
  icon_url: string | null
  member_count: number
  last_emission: string | null
  wallet_id: string
  settings: any
}

export default function ServersPage() {
  const router = useRouter()
  const [servers, setServers] = React.useState<ServerInfo[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")

  React.useEffect(() => {
    fetch("http://localhost:8000/api/servers")
      .then(res => res.json())
      .then(data => {
        setServers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch servers:", err)
        setLoading(false)
      })
  }, [])

  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.includes(search)
  )

  const handleOpenDashboard = (serverId: string) => {
    router.push(`/server/${serverId}/dashboard`)
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-100 flex items-center gap-3">
          <ServerIcon className="size-8 text-primary" />
          Управление серверами
        </h1>
        <p className="text-zinc-500 font-medium max-w-2xl">
          Список всех подключенных серверов в экосистеме OMC. Здесь вы можете просмотреть краткую статистику и перейти к детальному управлению каждым сервером.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input 
            placeholder="Поиск по названию или ID..." 
            className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-primary/50 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} className="bg-zinc-950 border border-zinc-800 p-1 rounded-lg">
            <ToggleGroupItem value="grid" className="data-[state=on]:bg-zinc-800 data-[state=on]:text-primary size-8 p-0">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="data-[state=on]:bg-zinc-800 data-[state=on]:text-primary size-8 p-0">
              <ListIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Badge variant="outline" className="h-10 px-4 font-bold border-zinc-800 text-zinc-400">
            ВСЕГО: {servers.length}
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className={cn(
          "grid gap-6",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={cn("bg-zinc-900", viewMode === "grid" ? "h-[200px]" : "h-20")} />
          ))}
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
          <ServerIcon className="size-16 opacity-20" />
          <p className="font-black uppercase tracking-widest text-lg">Серверы не найдены</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServers.map((server) => (
            <Card 
              key={server.id} 
              className="group border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/40 hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative"
              onClick={() => handleOpenDashboard(server.id)}
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="size-4 text-primary" />
              </div>
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Avatar className="size-12 rounded-xl border border-zinc-800 group-hover:border-primary/50 transition-colors">
                  <AvatarImage src={server.icon_url || ""} />
                  <AvatarFallback className="bg-zinc-900 text-zinc-400 font-black">
                    {server.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <CardTitle className="text-zinc-100 text-base font-black truncate group-hover:text-primary transition-colors">
                    {server.name}
                  </CardTitle>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className="text-[10px] text-zinc-600 font-mono font-bold tracking-tighter">ID: {server.id}</span>
                    <span className="text-[10px] text-zinc-600 font-mono font-bold tracking-tighter uppercase">WALLET: {server.wallet_id}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-y border-zinc-900/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Участники</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3 text-primary" />
                      <span className="text-sm font-black text-zinc-200">{server.member_count}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Статус</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black uppercase text-[8px] tracking-widest h-5">
                      Online
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Последняя эмиссия</span>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <History className="size-3" />
                    <span className="text-[11px] font-bold">
                      {server.last_emission ? new Date(server.last_emission).toLocaleString('ru-RU') : "Никогда"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-md overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  <TableHead className="w-[350px] text-[10px] font-black uppercase tracking-widest text-zinc-500">Сервер</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ID Системы</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Участники</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Последняя эмиссия</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServers.map((server) => (
                  <TableRow 
                    key={server.id} 
                    className="border-zinc-900 group hover:bg-zinc-900/20 transition-colors cursor-pointer"
                    onClick={() => handleOpenDashboard(server.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 rounded-lg border border-zinc-800 group-hover:border-primary/50 transition-colors">
                          <AvatarImage src={server.icon_url || ""} />
                          <AvatarFallback className="bg-zinc-900 text-zinc-400 font-black">
                            {server.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-zinc-100 font-black group-hover:text-primary transition-colors">{server.name}</span>
                          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">WALLET: {server.wallet_id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] bg-zinc-900 px-2 py-1 rounded text-zinc-400 font-mono">
                        {server.id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="size-3 text-zinc-500" />
                        <span className="text-sm font-bold text-zinc-300">{server.member_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {server.last_emission ? new Date(server.last_emission).toLocaleString('ru-RU') : "Никогда"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all gap-2"
                      >
                        Дашборд
                        <ExternalLink className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
