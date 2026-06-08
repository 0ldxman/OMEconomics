"use client"

import * as React from "react"
import {
  Building2,
  Users,
  Calendar,
  User,
  Info,
  ArrowUpDown,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Copy,
  Mail,
  ShieldCheck,
  Quote,
  TrendingUp,
  Coins,
  Wallet,
} from "lucide-react"

import {
  Pie,
  PieChart,
  Cell,
  Label,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

// --- TYPES ---
type Member = {
  id: number
  name: string
  avatar?: string
  role: string
  wallet_id: number
}

type Organization = {
  id: number
  wallet_id: number
  long_name: string
  short_name: string
  type: string
  description: string
  founder: { name: string; wallet_id: number; avatar?: string }
  created_at: string
  budget_omc: number
  budget_gold: number
  members: Member[]
}

// --- MOCK DATA ---
const mockOrgs: Organization[] = [
  {
    id: 1,
    wallet_id: 10001,
    long_name: "Omega Economics Group",
    short_name: "OMEGA",
    type: "Финансовая корпорация",
    description: "Ведущая организация по управлению активами и инвестициями в секторе ОМС. Мы создаем будущее экономики вместе.",
    founder: { name: "CEO_Omega", wallet_id: 50001 },
    created_at: "2026-01-15 10:00",
    budget_omc: 150200.50,
    budget_gold: 450,
    members: [
      { id: 1, name: "CEO_Omega", role: "Основатель", wallet_id: 50001 },
      { id: 2, name: "Manager_X", role: "Менеджер", wallet_id: 50002 },
      { id: 3, name: "Trader_Joe", role: "Трейдер", wallet_id: 50003 },
    ]
  },
  {
    id: 2,
    wallet_id: 10002,
    long_name: "Iron Smith Guild",
    short_name: "ISG",
    type: "Производственная гильдия",
    description: "Лучшее кузнечное дело на сервере. Поставляем оружие и инструменты высшего качества для всех героев.",
    founder: { name: "IronMaster", wallet_id: 60001 },
    created_at: "2026-03-20 14:30",
    budget_omc: 42500,
    budget_gold: 1200,
    members: [
      { id: 4, name: "IronMaster", role: "Основатель", wallet_id: 60001 },
      { id: 5, name: "Hammer_Bro", role: "Кузнец", wallet_id: 60002 },
    ]
  },
  {
    id: 3,
    wallet_id: 10003,
    long_name: "Alchemist Union",
    short_name: "AU",
    type: "Научное объединение",
    description: "Исследование магических свойств предметов и создание уникальных зелий. Наш девиз: 'Знание - это сила'.",
    founder: { name: "ArchMage", wallet_id: 70001 },
    created_at: "2026-05-10 09:00",
    budget_omc: 8900,
    budget_gold: 15,
    members: [
      { id: 6, name: "ArchMage", role: "Основатель", wallet_id: 70001 },
      { id: 7, name: "PotionMaker", role: "Алхимик", wallet_id: 70002 },
    ]
  }
]

// --- CHART DATA PREP ---
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

const budgetDistributionData = mockOrgs.map((org, index) => ({
  name: org.short_name,
  value: org.budget_omc,
  fill: COLORS[index % COLORS.length]
}))

const memberDistributionData = mockOrgs.map((org, index) => ({
  name: org.short_name,
  value: org.members.length,
  fill: COLORS[index % COLORS.length]
}))

const monopolyData = [
  { name: mockOrgs[0].short_name, value: 75, fill: "#f59e0b" },
  { name: "Другие", value: 25, fill: "#64748b" }
]

const chartConfig = {
  value: { label: "Значение" },
  ...Object.fromEntries(mockOrgs.map((org, index) => [org.short_name, { label: org.short_name, color: COLORS[index % COLORS.length] }])),
  "Другие": { label: "Другие", color: "#64748b" }
} satisfies ChartConfig

// --- COMPONENTS ---

const UserHoverCard = ({ user, role }: { user: { name: string; wallet_id: number; avatar?: string }; role?: string }) => {
  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(user.wallet_id.toString())
    toast.success("ID кошелька скопирован")
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-help w-fit group/user">
          <Avatar className="h-6 w-6 border">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
            <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold group-hover/user:text-primary transition-colors">{user.name}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-4 shadow-xl border-2" side="top">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">{user.name}</span>
              {role && <span className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-tighter">{role}</span>}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ID Кошелька</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 relative rounded bg-muted px-2 py-1 font-mono text-[11px] font-semibold overflow-hidden text-ellipsis italic">
                {user.wallet_id}
              </code>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 shrink-0"
                onClick={copyId}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const OrgDialog = ({ org }: { org: Organization }) => {
  return (
    <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-2 shadow-2xl bg-card">
      <DialogHeader className="sr-only">
        <DialogTitle>{org.long_name}</DialogTitle>
        <DialogDescription>Детальная информация об организации {org.short_name}</DialogDescription>
      </DialogHeader>
      
      <div className="bg-primary/5 p-8 flex flex-col items-center justify-center text-center border-b relative">
        <div className="absolute top-4 left-4">
          <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20">#{org.id}</Badge>
        </div>
        <Avatar className="h-24 w-24 shadow-xl mb-4">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${org.short_name}`} />
          <AvatarFallback>{org.short_name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-black uppercase tracking-tight leading-none">{org.long_name}</h2>
        <Badge className="mt-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest">
          {org.type}
        </Badge>
        
        <div className="flex gap-4 mt-6">
          <div className="flex flex-col items-center">
            <div className="text-lg font-black text-emerald-500 tabular-nums">{org.budget_omc.toLocaleString()} OMC</div>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Баланс</span>
          </div>
          <div className="w-px h-8 bg-border self-center" />
          <div className="flex flex-col items-center">
            <div className="text-lg font-black text-yellow-600 tabular-nums">{org.budget_gold.toLocaleString()} Au</div>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Золото</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="relative">
          <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/10 -z-10" />
          <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4 py-1">
            {org.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Дата создания
            </span>
            <span className="text-xs font-bold tabular-nums">{org.created_at}</span>
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Основатель
            </span>
            <UserHoverCard user={org.founder} role="Основатель" />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Участники ({org.members.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {org.members.map(member => (
              <UserHoverCard key={member.id} user={member} role={member.role} />
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  )
}

export default function OrganizationsPage() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const totalOrgs = mockOrgs.length
  const uniqueUsersCount = 7 // Mock unique users count

  return (
    <div className="flex flex-col gap-6 py-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Организации</h1>
          <p className="text-muted-foreground">Реестр зарегистрированных объединений и корпораций сервера</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Share Card */}
        <Card className="flex flex-col overflow-hidden border-primary/10 bg-primary/[0.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Организации
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-6 min-h-[220px]">
            <div className="text-7xl font-black tracking-tighter text-primary leading-none">
              {totalOrgs}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase mt-4 tracking-[0.2em]">Всего зарегистрировано</div>
          </CardContent>
          <CardFooter className="pt-2 border-t bg-muted/20 flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
              <TrendingUp className="h-3 w-3" /> +2 за месяц
            </div>
          </CardFooter>
        </Card>

        {/* Monopolization Card */}
        <Card className="flex flex-col overflow-hidden border-orange-500/10 bg-orange-500/[0.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" /> Монополизация
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4 flex flex-col items-center min-h-[260px]">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[160px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={monopolyData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={70}
                  stroke="hsl(var(--background))"
                  strokeWidth={4}
                  paddingAngle={2}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-black">
                              {monopolyData[0].value}%
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-[8px] uppercase font-bold tracking-widest">
                              Индекс
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            
            <div className="w-full space-y-2 px-2 mt-2">
              {mockOrgs.slice(0, 2).map((org, index) => (
                <div key={org.id} className="flex items-center justify-between p-1.5 rounded-lg border bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: index === 0 ? "#f59e0b" : COLORS[(index + 1) % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[100px]">{org.short_name}</span>
                  </div>
                  <span className="text-[10px] font-black tabular-nums">{index === 0 ? "75%" : "15%"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unique Users Card */}
        <Card className="flex flex-col overflow-hidden border-blue-500/10 bg-blue-500/[0.01]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Уникальные участники
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex flex-col items-center justify-center min-h-[220px]">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[160px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={memberDistributionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={75}
                  stroke="hsl(var(--background))"
                  strokeWidth={4}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-black">
                              {uniqueUsersCount}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-[8px] uppercase font-bold tracking-widest">
                              Пользователей
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              className="pl-9 bg-background h-9 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 font-bold text-[10px] uppercase tracking-tighter">
            <Filter className="h-3.5 w-3.5" /> Фильтры
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px] px-6">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  ID <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Название <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right px-4">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Бюджет <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right px-4">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Золото <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center px-4">
                <Button variant="ghost" className="mx-auto flex p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Участников <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Основатель <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right px-6">
                <Button variant="ghost" className="p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-wider">
                  Создана <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrgs.map((org) => (
              <Dialog key={org.id}>
                <DialogTrigger asChild>
                  <TableRow className="group cursor-pointer hover:bg-muted/30 transition-colors border-b last:border-0">
                    <TableCell className="px-6">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                        #{org.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <div className="flex items-center gap-3 py-1">
                            <Avatar className="h-9 w-9 border-2 group-hover:border-primary/20 transition-all">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${org.short_name}`} />
                              <AvatarFallback>{org.short_name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                                {org.short_name}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                                {org.type}
                              </span>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4 border-2 shadow-xl bg-card" side="top" align="start">
                          <div className="flex flex-col gap-2">
                            <h4 className="text-sm font-black uppercase tracking-tight text-primary">{org.long_name}</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3 py-1">
                              {org.description}
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                    <TableCell className="text-right px-4">
                      <span className="font-black text-emerald-500 tabular-nums text-xs">
                        {org.budget_omc.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-4">
                      <span className="font-black text-yellow-600 tabular-nums text-xs">
                        {org.budget_gold.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-black tabular-nums text-[10px]">
                        {org.members.length} чел.
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserHoverCard user={org.founder} role="Основатель" />
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                        <Calendar className="h-3 w-3" /> {org.created_at.split(' ')[0]}
                      </div>
                    </TableCell>
                  </TableRow>
                </DialogTrigger>
                <OrgDialog org={org} />
              </Dialog>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
