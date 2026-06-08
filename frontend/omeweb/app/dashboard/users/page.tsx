"use client"

import * as React from "react"
import { 
  Users as UsersIcon, 
  Search, 
  Wallet, 
  Coins, 
  History,
  ShieldAlert,
  MoreVertical,
  Filter
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

interface UserInfo {
  id: string
  wallet_id: string
  balance: number
  gold: number
  last_use: string | null
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserInfo[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    fetch("http://localhost:8000/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch users:", err)
        setLoading(false)
      })
  }, [])

  const filteredUsers = users.filter(u => 
    u.id.includes(search) || 
    u.wallet_id.includes(search)
  )

  return (
    <div className="flex flex-col gap-6 py-6 px-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-100 flex items-center gap-3">
          <UsersIcon className="size-8 text-primary" />
          Пользователи системы
        </h1>
        <p className="text-zinc-500 font-medium max-w-2xl">
          Глобальный список кошельков и пользователей. Здесь можно отслеживать балансы, просматривать историю транзакций и управлять правами доступа.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input 
            placeholder="Поиск по Discord ID или ID кошелька..." 
            className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-primary/50 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-zinc-800 text-zinc-400 gap-2 font-bold uppercase text-[10px] tracking-widest h-10 hover:bg-zinc-900">
            <Filter className="size-3" />
            Фильтры
          </Button>
          <Badge variant="outline" className="h-10 px-4 font-bold border-zinc-800 text-zinc-400 flex items-center">
            ВСЕГО: {users.length}
          </Badge>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-zinc-900 bg-zinc-900/20 py-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Реестр глобальных кошельков</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/30">
              <TableRow className="border-zinc-900 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Пользователь</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Баланс OMC</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Баланс Au</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Активность</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Опции</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-900">
                    <TableCell><Skeleton className="h-10 w-48 bg-zinc-900" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-zinc-900" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-zinc-900" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 bg-zinc-900" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto bg-zinc-900 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-600">
                      <UsersIcon className="size-12 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-sm">Пользователи не найдены</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-zinc-900 group hover:bg-zinc-900/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-primary/50 group-hover:text-primary transition-all">
                          <UsersIcon className="size-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-100 font-bold font-mono text-xs">{user.id}</span>
                          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">WALLET: {user.wallet_id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded bg-primary/10 flex items-center justify-center">
                          <Coins className="size-3 text-primary" />
                        </div>
                        <span className="text-zinc-100 font-black tracking-tight">{user.balance.toLocaleString()} <span className="text-[10px] text-zinc-500">OMC</span></span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded bg-amber-500/10 flex items-center justify-center">
                          <Wallet className="size-3 text-amber-500" />
                        </div>
                        <span className="text-zinc-100 font-black tracking-tight">{user.gold.toLocaleString()} <span className="text-[10px] text-zinc-500">Au</span></span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-zinc-500">
                        <History className="size-3" />
                        <span className="text-[10px] font-bold uppercase">{user.last_use ? new Date(user.last_use).toLocaleDateString('ru-RU') : "Нет данных"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="size-8 text-zinc-500 hover:text-primary transition-colors" title="История">
                          <History className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-zinc-500 hover:text-amber-500 transition-colors" title="Кошелек">
                          <Wallet className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-zinc-500 hover:text-red-500 transition-colors" title="Блокировка">
                          <ShieldAlert className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
