"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Table as TableIcon, ChevronRight, Info, Search, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TableSchema {
  name: string
  count: number
  columns: number
}

export default function DatabaseExplorer() {
  const [tables, setTables] = useState<TableSchema[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")

  useEffect(() => {
    fetch("http://localhost:8000/api/db/schema")
      .then(res => res.json())
      .then((data: any[]) => {
        const tableList = data.map((schema: any) => ({
          name: schema.name,
          count: schema.rowCount || 0,
          columns: schema.columns.length
        }))
        setTables(tableList)
        setIsLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch schema:", err)
        setIsLoading(false)
      })
  }, [])

  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-zinc-100">
            <Database className="h-8 w-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
            Проводник БД
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            Управление низкоуровневыми данными системы
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input 
              placeholder="Поиск таблиц..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-zinc-900/50 border-zinc-800 text-xs font-bold uppercase tracking-wider focus-visible:ring-primary/30"
            />
          </div>
          <div className="flex items-center bg-zinc-900/50 border border-zinc-800 rounded-md p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-7 w-7", view === "grid" ? "bg-zinc-800 text-primary" : "text-zinc-500")}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-7 w-7", view === "list" ? "bg-zinc-800 text-primary" : "text-zinc-500")}
              onClick={() => setView("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map(table => (
            <Link key={table.name} href={`/dashboard/database/${table.name}`}>
              <Card className="bg-zinc-950/50 border-zinc-800 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <TableIcon className="h-16 w-16 rotate-12" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                      {table.name}
                    </CardTitle>
                    <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                  <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                    {table.columns} колонок
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] font-black tabular-nums">
                      {table.count} записей
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-950/50 border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Таблица</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Колонки</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Записи</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredTables.map(table => (
                  <tr 
                    key={table.name} 
                    className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/database/${table.name}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-primary/30 transition-colors">
                          <TableIcon className="h-4 w-4 text-zinc-400 group-hover:text-primary" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-200 group-hover:text-primary transition-colors">
                          {table.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{table.columns}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] font-black tabular-nums">
                        {table.count}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="h-4 w-4 ml-auto text-zinc-700 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Системная информация</p>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Этот инструмент предоставляет прямой доступ к таблицам базы данных. Будьте осторожны при редактировании записей, так как это может повлиять на стабильность экономики серверов.
          </p>
        </div>
      </div>
    </div>
  )
}
