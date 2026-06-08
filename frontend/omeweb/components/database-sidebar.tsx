"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  Database, 
  Table as TableIcon, 
  Search, 
  ChevronRight,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface TableSchema {
  name: string
  version: number
  columns: any[]
}

export function DatabaseSidebar() {
  const params = useParams()
  const currentTable = params.tableName as string
  const [schema, setSchema] = useState<TableSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("http://localhost:8000/api/db/schema")
      .then(res => res.json())
      .then(data => {
        setSchema(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch schema:", err)
        setLoading(false)
      })
  }, [])

  const filteredTables = schema.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-64 border-r bg-card/30 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <span className="font-black uppercase tracking-widest text-xs">Таблицы</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Поиск..." 
            className="pl-8 h-8 text-[10px] uppercase font-bold tracking-wider"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse bg-muted/50 rounded-md" />
            ))
          ) : (
            filteredTables.map((table) => (
              <Link 
                key={table.name} 
                href={`/dashboard/database/${table.name}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md transition-all group",
                  currentTable === table.name 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <TableIcon className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    currentTable === table.name ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                    {table.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="h-4 px-1 text-[8px] font-black border-primary/20 bg-primary/5 text-primary">
                    V{table.version}
                  </Badge>
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform",
                    currentTable === table.name ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  )} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-3 w-3" />
          <span className="text-[9px] font-bold uppercase tracking-widest">SQLite System</span>
        </div>
      </div>
    </div>
  )
}
